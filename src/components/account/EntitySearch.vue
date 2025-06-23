<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useSearchStore } from '@/stores/search'
import { useCoreStore } from '@/stores/core'
import type { EntityOption, EntitiesArgs, EntityActions } from '@/interfaces/AccountManagement'
import type { PropType } from 'vue'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import EntityCard from '@/components/account/EntityCard.vue'
import EntityManager from '@/components/account/EntityManager.vue'
import GroupSelector from '@/components/account/GroupSelector.vue'
import type { Group } from '@/interfaces/Group'
import type { Entity } from '@/interfaces/Entities'
import { setCookie } from 'typescript-cookie'

const props = defineProps({
  entity: {
    type: Object as PropType<EntityOption>,
    required: true,
  },
})
const coreStore = useCoreStore()
const userStore = useUserStore()
const { featureDetails, groupMap, selectedGroups, type, groups, entityName, gettingUser } =
  storeToRefs(userStore)

const searchStore = useSearchStore()
const { secondaryLimit } = storeToRefs(searchStore)

const query = ref('')
const page = ref(1)
const searching = ref(false)
const entities = ref({} as { [key: string]: Entity })
const entityCount = ref(0)
const entityGroups = ref(featureDetails.value[`get_${props.entity.type}`].groups)
selectedGroups.value[`get_${props.entity.type}`] = entityGroups.value
const selectorGroupOptions = ref(
  entityGroups.value.reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[]),
)

const doSearch = async () => {
  searching.value = true
  const args: EntitiesArgs = {
    groups: selectedGroups.value[`get_${props.entity.type}`],
    query: query.value,
    limit: secondaryLimit.value,
    page: page.value,
  }
  const { data } = await coreStore.$api.auth.entities.get(args, props.entity.type)
  entities.value = data.entities
  entityCount.value = data.total
  searching.value = false
}
const handleUpdate = async () => {
  doSearch()
  gettingUser.value = true
  const { data } = await coreStore.$api.auth.session()
  if (data?.uuid) {
    const inOneDay = new Date(new Date().getTime() + 24 * 3600 * 1000)
    setCookie('uuid', data.uuid, { expires: inOneDay })
  }
  groups.value = data.groups
  type.value = data.type
  entityName.value = data.name
  gettingUser.value = false
}

const changePage = (p: number) => {
  page.value = p
  doSearch()
}
doSearch()

const hasAddEntity = computed(() => {
  return props.entity.type === 'users'
    ? featureDetails.value['add_or_edit_users'].enabled
    : (featureDetails.value['manage_facilities'] || {}).enabled
})
const showAddEntityModal = ref(false)
const addAction = 'add' as EntityActions

const addEntityModal = () => {
  const featureName = props.entity.type === 'users' ? 'add_or_edit_users' : 'manage_facilities'
  const isSingleGroup = (featureDetails.value[featureName] || {}).groups.length === 1
  selectedGroups.value[featureName] = isSingleGroup ? [selectorGroupOptions.value[0].id] : []
  showAddEntityModal.value = true
}
</script>

<template>
  <!-- class="pt-5 pb-8 md-pt-4 md-pb-7" -->
  <pep-pharos-layout row-gap="0">
    <pep-pharos-heading
      class="text-capitalize cols-12 pt-5 md-pt-4"
      :level="2"
      preset="4"
    >
      <span class="button-row">
        <span>{{ entity.titleSingular }} Management</span>
        <span v-if="hasAddEntity">
          <pep-pharos-button
            icon-left="add"
            @click.prevent.stop="addEntityModal"
          >
            <span>{{ `Add ${entity.titleSingular}` }}</span>
          </pep-pharos-button>
        </span>
      </span>
    </pep-pharos-heading>
    <EntityManager
      :entity="{
        type: entity.type,
      }"
      :entity-type="entity.title"
      :show-modal="showAddEntityModal"
      :action="addAction"
      @close="showAddEntityModal = false"
      @update="handleUpdate"
    />

    <div
      v-if="featureDetails[`get_${props.entity.type}`].groups.length > 1"
      class="cols-12 mt-3 mb-6"
    >
      <GroupSelector
        :groups="selectorGroupOptions"
        :feature-name="`get_${props.entity.type}`"
        :start-full="true"
        multiple
        @change="doSearch"
      />
    </div>
    <form
      class="cols-8"
      @submit.prevent.stop="doSearch"
    >
      <pep-pharos-input-group
        :id="`${entity.title}_search`"
        :value="query"
        :placeholder="
          entity.type === 'users' ? 'Enter user name or email' : 'Enter facility name or site code'
        "
        :name="`${entity.title}_search`"
        @input="query = $event.target.value"
      >
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <span slot="label">{{ entity.titleSingular }} Search</span>
        <pep-pharos-button
          name="search-button"
          icon="search"
          variant="subtle"
          label="search"
          a11y-label="search"
          type="submit"
        />
      </pep-pharos-input-group>
    </form>
    <div
      v-if="searching"
      class="position-relative mt-8 cols-12"
    >
      <pep-pharos-loading-spinner />
    </div>
    <div
      v-else-if="entityCount"
      class="cols-12"
    >
      <div
        v-for="(ent, grp, index) in entities"
        :key="`${entity.type}_${index}`"
      >
        <EntityCard
          :class="index !== Object.keys(entities).length - 1 ? 'entity-card' : 'mt-7'"
          :entity="ent"
          :entity-type="entity.titleSingular"
          @update="handleUpdate"
        />
      </div>
    </div>
    <div
      v-else-if="!searching && !entityCount"
      class="cols-12 mt-6"
    >
      <pep-pharos-heading
        class="mb-2 pb-0"
        preset="legend"
        :level="3"
      >
        No Results
      </pep-pharos-heading>
    </div>
    <pep-pharos-pagination
      v-if="!searching && entityCount > secondaryLimit"
      class="mt-8 cols-12 justify-self-end"
      :total-results="entityCount"
      :page-size="secondaryLimit"
      :current-page="page"
      @prev-page="changePage(page - 1)"
      @next-page="changePage(page + 1)"
    />
  </pep-pharos-layout>
</template>

<script setup lang="ts">
import type { EditingGroup } from '@/interfaces/Group'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import AddGroup from '@/components/groups/AddGroup.vue'
import DeleteGroup from '@/components/groups/DeleteGroup.vue'
import EditGroup from '@/components/groups/EditGroup.vue'
import ReactivateGroup from '@/components/groups/ReactivateGroup.vue'
import ClearHistory from '@/components/groups/ClearHistory.vue'

const coreStore = useCoreStore()

const userStore = useUserStore()
const { ungroupedFeatures } = storeToRefs(userStore)

const gettingGroups = ref(false)
const currentGroups = ref([] as EditingGroup[])
const query = ref('')
const total = ref(0)
const limit = ref(10)
const page = ref(1)
const isActive = ref(false)
const getGroups = async () => {
  gettingGroups.value = true

  const { data } = await coreStore.$api.auth.groups.get({
    name: query.value,
    page: page.value,
    limit: limit.value,
    is_active: isActive.value,
  })
  currentGroups.value = data.groups || []
  total.value = data.total
  gettingGroups.value = false
  showDeleteGroupModal.value = Array(currentGroups.value.length).fill(false)
  showEditGroupModal.value = Array(currentGroups.value.length).fill(false)
}

const showAddGroupModal = ref(false)
const showEditGroupModal = ref([] as boolean[])
const showDeleteGroupModal = ref([] as boolean[])
const showReactivateGroupModal = ref([] as boolean[])
const showClearHistoryModal = ref([] as boolean[])

const changeGroupsPage = (newPage: number) => {
  page.value = newPage
  getGroups()
}

getGroups()
const toggleActive = () => {
  isActive.value = !isActive.value
  getGroups()
}
const handleNewGroup = async () => {
  await userStore.getCurrentUser()
  await getGroups()
  showAddGroupModal.value = false
}
const handleEditGroup = async (i: number) => {
  await userStore.getCurrentUser()
  await getGroups()
  showEditGroupModal.value[i] = false
}
const handleDeleteGroup = async (i: number) => {
  await userStore.getCurrentUser()
  await getGroups()
  showDeleteGroupModal.value[i] = false
}
const handleReactivateGroup = async (i: number) => {
  await userStore.getCurrentUser()
  await getGroups()
  showReactivateGroupModal.value[i] = false
}
const handleClearHistory = async (i: number) => {
  await userStore.getCurrentUser()
  await getGroups()
  showClearHistoryModal.value[i] = false
}
</script>
<template>
  <div class="full-width">
    <div v-if="ungroupedFeatures['add_group']?.enabled">
      <pep-pharos-button
        variant="primary"
        icon-left="add"
        class="mb-5"
        @click="showAddGroupModal = true"
      >
        Add Group
      </pep-pharos-button>
      <AddGroup
        :show="showAddGroupModal"
        @submit="handleNewGroup"
        @close="showAddGroupModal = false"
      />
    </div>
    <div>
      <form class="cols-8" @submit.prevent.stop="getGroups">
        <pep-pharos-input-group
          :id="`group_search`"
          :value="query"
          :placeholder="'Enter group name'"
          :name="`group_search`"
          class="mb-5"
          @input="query = $event.target.value"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Group Search</span>
          <pep-pharos-button
            name="search-button"
            icon="search"
            variant="subtle"
            label="search"
            a11y-label="search"
            type="submit"
          />
        </pep-pharos-input-group>
        <pep-pharos-checkbox :checked="isActive" class="mb-5" @change="toggleActive">
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label" class="text-weight-bold"> Get Active Groups Only </span>
        </pep-pharos-checkbox>
      </form>
    </div>
    <pep-pharos-loading-spinner v-if="gettingGroups" />
    <div v-else-if="!currentGroups.length">
      <pep-pharos-heading :level="2" preset="legend">No groups found</pep-pharos-heading>
    </div>
    <div v-else>
      <div v-for="(group, i) in currentGroups" :key="`group_${i}`">
        <div
          class="group-card"
          :class="i !== Object.keys(currentGroups).length - 1 ? 'underline' : ''"
        >
          <div
            class="pa-6 display-flex flex-direction-row justify-content-space-between"
            :class="{ inactive: !group.is_active }"
          >
            <div>
              <pep-pharos-heading :level="2">{{ group.name }}</pep-pharos-heading>
            </div>
            <div class="buttons">
              <pep-pharos-button
                v-if="ungroupedFeatures['edit_group']?.enabled"
                variant="primary"
                icon-left="edit"
                full-width
                class="mb-2"
                @click="showEditGroupModal[i] = true"
              >
                Edit
              </pep-pharos-button>
              <pep-pharos-button
                v-if="ungroupedFeatures['delete_group']?.enabled && group.is_active"
                variant="secondary"
                icon-left="delete"
                full-width
                class="mb-2"
                @click="showDeleteGroupModal[i] = true"
              >
                Delete
              </pep-pharos-button>
              <pep-pharos-button
                v-else-if="ungroupedFeatures['add_group']?.enabled && !group.is_active"
                variant="secondary"
                icon-left="add"
                full-width
                class="mb-2"
                @click="showReactivateGroupModal[i] = true"
              >
                Reactivate
              </pep-pharos-button>

              <pep-pharos-button
                v-if="ungroupedFeatures['clear_history']?.enabled"
                variant="secondary"
                icon-left="close-inverse"
                full-width
                class="mb-2"
                @click="showClearHistoryModal[i] = true"
              >
                Clear History
              </pep-pharos-button>
            </div>
          </div>
        </div>
        <ClearHistory
          v-if="ungroupedFeatures['clear_history']?.enabled"
          :show="showClearHistoryModal[i]"
          :group-id="group.id || 0"
          :name="group.name || ''"
          @submit="handleClearHistory(i)"
          @close="showClearHistoryModal[i] = false"
        />
        <DeleteGroup
          v-if="ungroupedFeatures['delete_group']?.enabled && group.is_active"
          :show="showDeleteGroupModal[i]"
          :group-id="group.id || 0"
          :name="group.name || ''"
          @submit="handleDeleteGroup(i)"
          @close="showDeleteGroupModal[i] = false"
        />
        <ReactivateGroup
          v-else-if="ungroupedFeatures['add_group']?.enabled && !group.is_active"
          :show="showReactivateGroupModal[i]"
          :name="group.name || ''"
          :group-id="group.id || 0"
          @submit="handleReactivateGroup(i)"
          @close="showReactivateGroupModal[i] = false"
        />
        <EditGroup
          v-if="ungroupedFeatures['edit_group']?.enabled"
          :show="showEditGroupModal[i]"
          :name="group.name || ''"
          :group-id="group.id || 0"
          @submit="handleEditGroup(i)"
          @close="showEditGroupModal[i] = false"
        />
      </div>
      <pep-pharos-pagination
        v-if="total > limit"
        class="justify-self-end mt-7"
        :total-results="total"
        :page-size="limit"
        :current-page="page"
        @prev-page="changeGroupsPage(page - 1)"
        @next-page="changeGroupsPage(page + 1)"
      />
    </div>
  </div>
</template>

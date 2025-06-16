<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useFeaturesStore } from '@/stores/features'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import AddFeature from '@/components/features/AddFeature.vue'
import EditFeature from '@/components/features/EditFeature.vue'
import DeleteFeature from '@/components/features/DeleteFeature.vue'
import ReactivateFeature from '@/components/features/ReactivateFeature.vue'
import type { Feature } from '@/interfaces/Features'

const props = defineProps({
  ungrouped: Boolean,
})

const coreStore = useCoreStore()

const userStore = useUserStore()
const { ungroupedFeatures } = storeToRefs(userStore)

const featureStore = useFeaturesStore()
const { features } = storeToRefs(featureStore)
const gettingFeatures = ref(false)
const currentFeatures = ref([] as Feature[])

const query = ref('')
const total = ref(0)
const limit = ref(10)
const page = ref(1)
const isActive = ref(false)
const getFeatures = async () => {
  gettingFeatures.value = true

  const args = {
    name: query.value,
    page: page.value,
    limit: limit.value,
    is_active: isActive.value,
  }
  const type = props.ungrouped ? 'ungrouped' : 'basic'
  const { data } = await coreStore.$api.auth.features[type].get(args)
  currentFeatures.value = data.features
  total.value = data.total
  if (!props.ungrouped) {
    const resp = await coreStore.$api.auth.features.basic.get({ is_active: true })
    if (resp.data && resp.data.features && resp.data.total > 0) {
      features.value = resp.data.features
    }
  }
  gettingFeatures.value = false
  showEditFeatureModal.value = Array(Object.keys(currentFeatures.value).length).fill(false)
  showDeleteFeatureModal.value = Array(Object.keys(currentFeatures.value).length).fill(false)
  showReactivateFeatureModal.value = Array(Object.keys(currentFeatures.value).length).fill(false)
}

const showAddFeatureModal = ref(false)
const showEditFeatureModal = ref([] as boolean[])
const showDeleteFeatureModal = ref([] as boolean[])
const showReactivateFeatureModal = ref([] as boolean[])

const addFeatureName = props.ungrouped ? 'add_ungrouped_feature' : 'add_feature'
const editFeatureName = props.ungrouped ? 'edit_ungrouped_feature' : 'edit_feature'
const deleteFeatureName = props.ungrouped ? 'delete_ungrouped_feature' : 'delete_feature'

const changePage = (newPage: number) => {
  page.value = newPage
  getFeatures()
}

getFeatures()

const toggleActive = () => {
  isActive.value = !isActive.value
  getFeatures()
}

const handleReactivateFeature = async (i: number) => {
  await userStore.getCurrentUser()
  await getFeatures()
  showReactivateFeatureModal.value[i] = false
}

const handleAddFeature = async () => {
  await userStore.getCurrentUser()
  await getFeatures()
  showAddFeatureModal.value = false
}

const handleDeleteFeature = async (i: number) => {
  await userStore.getCurrentUser()
  await getFeatures()
  showDeleteFeatureModal.value[i] = false
}

const handleEditFeature = async (i: number) => {
  await userStore.getCurrentUser()
  await getFeatures()
  showEditFeatureModal.value[i] = false
}
</script>
<template>
  <div class="full-width">
    <div v-if="ungroupedFeatures[addFeatureName]?.enabled">
      <pep-pharos-button
        variant="primary"
        icon-left="add"
        class="mb-5"
        @click="showAddFeatureModal = true"
      >
        Add Feature
      </pep-pharos-button>
      <AddFeature
        v-if="ungroupedFeatures[addFeatureName]?.enabled"
        :show="showAddFeatureModal"
        :ungrouped="props.ungrouped"
        @submit="handleAddFeature"
        @close="showAddFeatureModal = false"
      />
    </div>
    <div>
      <form class="cols-8" @submit.prevent.stop="getFeatures">
        <pep-pharos-input-group
          :id="`${props.ungrouped ? 'ungrouped_' : ''}feature_search`"
          :value="query"
          :placeholder="'Enter feature name'"
          :name="`${props.ungrouped ? 'ungrouped_' : ''}feature_search`"
          class="mb-5"
          @input="query = $event.target.value"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">{{
            props.ungrouped ? 'Ungrouped Feature Search' : 'Feature Search'
          }}</span>
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
          <span slot="label" class="text-weight-bold"> Get Active Features Only </span>
        </pep-pharos-checkbox>
      </form>
    </div>
    <pep-pharos-loading-spinner v-if="gettingFeatures" />
    <div v-else>
      <div v-for="(feature, i) in currentFeatures" :key="`user_${i}`">
        <div
          class="group-card"
          :class="i !== Object.keys(currentFeatures).length - 1 ? 'underline' : ''"
        >
          <div
            class="pa-6 display-flex flex-direction-row justify-content-space-between"
            :class="{ inactive: !feature.is_active }"
          >
            <div class="md-mb-6">
              <div class="mb-3">
                <pep-pharos-heading :level="2">
                  {{ feature.display_name }}
                </pep-pharos-heading>
                <pep-pharos-heading :level="3" preset="legend">
                  Category: {{ feature.category }}
                </pep-pharos-heading>
              </div>
              <p class="description">
                {{ feature.description }}
              </p>
            </div>
            <div class="buttons">
              <pep-pharos-button
                v-if="ungroupedFeatures[editFeatureName]?.enabled"
                variant="primary"
                icon-left="edit"
                class="mb-2"
                full-width
                @click="showEditFeatureModal[i] = true"
              >
                Edit
              </pep-pharos-button>
              <pep-pharos-button
                v-if="!feature.is_active && ungroupedFeatures[addFeatureName]?.enabled"
                variant="secondary"
                icon-left="add"
                class="mb-2"
                full-width
                @click="showReactivateFeatureModal[i] = true"
              >
                Reactivate
              </pep-pharos-button>
              <pep-pharos-button
                v-if="feature.is_active && ungroupedFeatures[deleteFeatureName]?.enabled"
                variant="secondary"
                icon-left="add"
                class="mb-2"
                full-width
                @click="showDeleteFeatureModal[i] = true"
              >
                Delete
              </pep-pharos-button>
            </div>
          </div>
        </div>
        <ReactivateFeature
          v-if="ungroupedFeatures[addFeatureName]?.enabled"
          :show="showReactivateFeatureModal[i]"
          :feature="feature"
          :ungrouped="props.ungrouped"
          @submit="handleReactivateFeature(i)"
          @close="showReactivateFeatureModal[i + 1] = false"
        />
        <EditFeature
          v-if="ungroupedFeatures[editFeatureName]?.enabled"
          :show="showEditFeatureModal[i]"
          :feature="feature"
          :ungrouped="props.ungrouped"
          @submit="handleEditFeature(i)"
          @close="showEditFeatureModal[i] = false"
        />
        <DeleteFeature
          v-if="ungroupedFeatures[deleteFeatureName]?.enabled"
          :show="showDeleteFeatureModal[i]"
          :feature="feature"
          :ungrouped="props.ungrouped"
          @submit="handleDeleteFeature(i)"
          @close="showDeleteFeatureModal[i] = false"
        />
      </div>
      <pep-pharos-pagination
        v-if="total > limit"
        class="justify-self-end mt-7"
        :total-results="total"
        :page-size="limit"
        :current-page="page"
        @prev-page="changePage(page - 1)"
        @next-page="changePage(page + 1)"
      />
    </div>
  </div>
</template>

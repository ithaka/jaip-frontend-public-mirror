<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import type { Subdomain } from '@/interfaces/Subdomains'
import AddSubdomain from '@/components/subdomains/AddSubdomain.vue'
import EditSubdomain from '@/components/subdomains/EditSubdomain.vue'
import DeleteSubdomain from '@/components/subdomains/DeleteSubdomain.vue'
import ReactivateSubdomain from '@/components/subdomains/ReactivateSubdomain.vue'

const coreStore = useCoreStore()

const userStore = useUserStore()
const { ungroupedFeatures } = storeToRefs(userStore)

const gettingSubdomains = ref(false)
const currentSubdomains = ref([] as Subdomain[])
const query = ref('')
const total = ref(0)
const limit = ref(10)
const page = ref(1)
const isActive = ref(false)
const getSubdomains = async () => {
  gettingSubdomains.value = true

  const args = {
    name: query.value,
    page: page.value,
    limit: limit.value,
    is_active: isActive.value,
  }
  const { data } = await coreStore.$api.auth.subdomains.get(args)
  currentSubdomains.value = data.subdomains
  total.value = data.total
  gettingSubdomains.value = false
  showEditSubdomainModal.value = Array(Object.keys(currentSubdomains.value).length).fill(false)
  showDeleteSubdomainModal.value = Array(Object.keys(currentSubdomains.value).length).fill(false)
  showReactivateSubdomainModal.value = Array(Object.keys(currentSubdomains.value).length).fill(
    false,
  )
}

const showAddSubdomainModal = ref(false)
const showEditSubdomainModal = ref([] as boolean[])
const showDeleteSubdomainModal = ref([] as boolean[])
const showReactivateSubdomainModal = ref([] as boolean[])

const changePage = (newPage: number) => {
  page.value = newPage
  getSubdomains()
}

getSubdomains()

const toggleActive = () => {
  isActive.value = !isActive.value
  getSubdomains()
}

const handleReactivateSubdomain = async (i: number) => {
  await userStore.getCurrentUser()
  await getSubdomains()
  showReactivateSubdomainModal.value[i] = false
}

const handleAddSubdomain = async () => {
  await userStore.getCurrentUser()
  await getSubdomains()
  showAddSubdomainModal.value = false
}

const handleDeleteSubdomain = async (i: number) => {
  await userStore.getCurrentUser()
  await getSubdomains()
  showDeleteSubdomainModal.value[i] = false
}

const handleEditSubdomain = async (i: number) => {
  await userStore.getCurrentUser()
  await getSubdomains()
  showEditSubdomainModal.value[i] = false
}
</script>
<template>
  <div class="full-width">
    <div v-if="ungroupedFeatures['add_subdomain']?.enabled">
      <pep-pharos-button
        variant="primary"
        icon-left="add"
        class="mb-5"
        @click="showAddSubdomainModal = true"
      >
        Add Subdomain
      </pep-pharos-button>
      <AddSubdomain
        v-if="ungroupedFeatures['add_subdomain']?.enabled"
        :show="showAddSubdomainModal"
        :user="{
          type: 'users',
          ungrouped_features: {},
        }"
        @submit="handleAddSubdomain"
        @close="showAddSubdomainModal = false"
      />
    </div>
    <div>
      <form class="cols-8" @submit.prevent.stop="getSubdomains">
        <pep-pharos-input-group
          :id="`subdomain_search`"
          :value="query"
          :placeholder="'Enter subdomain'"
          :name="`subdomain_search`"
          class="mb-5"
          @input="query = $event.target.value"
        >
          <span slot="label">Subdomain Search</span>
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
          <span slot="label" class="text-weight-bold"> Get Active Subdomains Only </span>
        </pep-pharos-checkbox>
      </form>
    </div>
    <pep-pharos-loading-spinner v-if="gettingSubdomains" />
    <div v-else>
      <div v-for="(subdomain, i) in currentSubdomains" :key="`user_${i}`">
        <div
          class="group-card"
          :class="i !== Object.keys(currentSubdomains).length - 1 ? 'underline' : ''"
        >
          <div
            class="pa-6 display-flex flex-direction-row justify-content-space-between"
            :class="{ inactive: !subdomain.is_active }"
          >
            <div class="md-mb-6">
              <pep-pharos-heading :level="2">
                {{ subdomain.subdomain }}
              </pep-pharos-heading>
            </div>
            <div class="buttons">
              <pep-pharos-button
                v-if="ungroupedFeatures['edit_subdomain']?.enabled"
                variant="primary"
                icon-left="edit"
                full-width
                class="mb-2"
                @click="showEditSubdomainModal[i] = true"
              >
                Edit
              </pep-pharos-button>
              <pep-pharos-button
                v-if="!subdomain.is_active && ungroupedFeatures['add_subdomain']?.enabled"
                variant="secondary"
                icon-left="add"
                class="mb-2"
                full-width
                @click="showReactivateSubdomainModal[i] = true"
              >
                Reactivate
              </pep-pharos-button>
              <pep-pharos-button
                v-if="subdomain.is_active && ungroupedFeatures['delete_subdomain']?.enabled"
                variant="secondary"
                icon-left="add"
                class="mb-2"
                full-width
                @click="showDeleteSubdomainModal[i] = true"
              >
                Delete
              </pep-pharos-button>
            </div>
          </div>
        </div>
        <ReactivateSubdomain
          v-if="ungroupedFeatures['add_subdomain']?.enabled"
          :show="showReactivateSubdomainModal[i]"
          :subdomain="subdomain"
          @submit="handleReactivateSubdomain(i)"
          @close="showReactivateSubdomainModal[i + 1] = false"
        />
        <EditSubdomain
          v-if="ungroupedFeatures['edit_subdomain']?.enabled"
          :show="showEditSubdomainModal[i]"
          :subdomain="subdomain"
          @submit="handleEditSubdomain(i)"
          @close="showEditSubdomainModal[i + 1] = false"
        />
        <DeleteSubdomain
          v-if="ungroupedFeatures['delete_subdomain']?.enabled"
          :show="showDeleteSubdomainModal[i]"
          :subdomain="subdomain"
          @submit="handleDeleteSubdomain(i)"
          @close="showDeleteSubdomainModal[i] = false"
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

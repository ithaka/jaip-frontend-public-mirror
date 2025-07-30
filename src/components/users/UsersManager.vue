<script setup lang="ts">
import type { Entity } from '@/interfaces/Entities'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import EditUser from '@/components/users/EditUser.vue'
import AddGroupAdmin from '@/components/users/AddGroupAdmin.vue'

const coreStore = useCoreStore()

const userStore = useUserStore()
const { ungroupedFeatures, gettingUser } = storeToRefs(userStore)

watch(gettingUser, async (newValue, oldValue) => {
  if (oldValue === true && newValue === false) {
    await getUsers()
  }
})

const gettingUsers = ref(false)
const currentUsers = ref({} as { [key: string]: Entity })
const query = ref('')
const total = ref(0)
const limit = ref(10)
const page = ref(1)
const getUsers = async () => {
  gettingUsers.value = true

  const args = {
    groups: [],
    query: query.value,
    page: page.value,
    limit: limit.value,
    include_ungrouped: true,
  }
  const { data } = await coreStore.$api.auth.entities.get(args, 'users')
  currentUsers.value = data.entities
  total.value = data.total
  gettingUsers.value = false
  showEditUserModal.value = Array(Object.keys(currentUsers.value).length + 1).fill(false)
  showAddAdminModal.value = Array(Object.keys(currentUsers.value).length).fill(false)
}

const showEditUserModal = ref([] as boolean[])
const showAddAdminModal = ref([] as boolean[])

const changePage = (newPage: number) => {
  page.value = newPage
  getUsers()
}

getUsers()

const handleEditUser = async (i: number) => {
  await userStore.getCurrentUser()
  await getUsers()
  showEditUserModal.value[i + 1] = false
}

const handleAddAdmin = async (i: number) => {
  await userStore.getCurrentUser()
  await getUsers()
  showAddAdminModal.value[i + 1] = false
}
</script>
<template>
  <div class="full-width">
    <div v-if="ungroupedFeatures['manage_superusers']?.enabled">
      <pep-pharos-button
        variant="primary"
        icon-left="add"
        class="mb-5"
        @click="showEditUserModal[0] = true"
      >
        Add User
      </pep-pharos-button>
      <EditUser
        v-if="ungroupedFeatures['manage_superusers']?.enabled"
        :show="showEditUserModal[0]"
        :user="{
          type: 'users',
          ungrouped_features: {},
        }"
        @submit="handleEditUser(0)"
        @close="showEditUserModal[0] = false"
      />
    </div>
    <div>
      <form class="cols-8" @submit.prevent.stop="getUsers">
        <pep-pharos-input-group
          :id="`user_search`"
          :value="query"
          :placeholder="'Enter user name or email'"
          :name="`user_search`"
          @input="query = $event.target.value"
        >
          <span slot="label">User Search</span>
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
    </div>
    <pep-pharos-loading-spinner v-if="gettingUsers" />
    <div v-else>
      <div v-for="(user, id, i) in currentUsers" :key="`user_${i}`">
        <div
          class="group-card"
          :class="i !== Object.keys(currentUsers).length - 1 ? 'underline' : ''"
        >
          <div class="pa-6 display-flex flex-direction-row justify-content-space-between">
            <div>
              <pep-pharos-heading :level="2">
                {{ user.name }}
              </pep-pharos-heading>
              <p>{{ user.contact }}</p>
            </div>
            <div class="buttons">
              <pep-pharos-button
                v-if="ungroupedFeatures['manage_superusers']?.enabled"
                variant="primary"
                icon-left="edit"
                class="mb-2"
                full-width
                @click="showEditUserModal[i + 1] = true"
              >
                Edit
              </pep-pharos-button>
              <pep-pharos-button
                v-if="ungroupedFeatures['create_group_admins']?.enabled"
                variant="secondary"
                icon-left="add"
                class="mb-2"
                full-width
                @click="showAddAdminModal[i] = true"
              >
                Make Group Admin
              </pep-pharos-button>
            </div>
          </div>
          <div
            v-if="
              user.ungrouped_features &&
              Object.keys(userStore.getEnabledFeatures(user.ungrouped_features)).length > 0
            "
            class="pb-6 pl-6 pr-6 pt-0 display-flex flex-direction-row justify-content-space-between"
          >
            <div class="entity-features">
              <div
                v-for="(category, label, index) in userStore.sortUngroupedFeatures(
                  userStore.getEnabledFeatures(user.ungrouped_features),
                )"
                :key="`feature-category-${index}`"
                :data-panel-id="`feature-category-${index}`"
              >
                <pep-pharos-heading class="" preset="legend" :level="3">
                  {{ label }}
                </pep-pharos-heading>
                <ul>
                  <li v-for="feature of category" :key="`feature_${feature.name}`">
                    <span class="display-flex align-items-center">
                      <span>{{ feature.display_name }}</span>
                      <pep-pharos-icon
                        :data-tooltip-id="`feature-tooltip-${feature.name}`"
                        name="question-inverse"
                        :a11y-title="'Pre-Approved Discipline'"
                        class="mt-0 pl-2 fill-gray-40 small-icon"
                        :aria-describedby="`feature-tooltip-${feature.name}`"
                      />
                      <pep-pharos-tooltip :id="`feature-tooltip-${feature.name}`" placement="top">
                        <span class="text-none">{{ feature.description }}</span>
                      </pep-pharos-tooltip>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            v-else
            class="pb-6 pl-6 pr-6 pt-0 display-flex flex-direction-row justify-content-space-between"
          >
            <pep-pharos-heading class="" preset="legend" :level="3">
              No Features Enabled
            </pep-pharos-heading>
          </div>
        </div>
        <EditUser
          v-if="ungroupedFeatures['manage_superusers']?.enabled"
          :show="showEditUserModal[i + 1]"
          :user="user"
          @submit="handleEditUser(i)"
          @close="showEditUserModal[i + 1] = false"
        />
        <AddGroupAdmin
          v-if="ungroupedFeatures['create_group_admins']?.enabled"
          :show="showAddAdminModal[i]"
          :user="user"
          @submit="handleAddAdmin(i)"
          @close="showAddAdminModal[i] = false"
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

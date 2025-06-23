<script setup lang="ts">
import type { Entity } from '@/interfaces/Entities'
import type { EntityActions } from '@/interfaces/AccountManagement'
import type { Group, GroupSelection } from '@/interfaces/Group'
import { capitalize, isEmail } from '@/utils/helpers'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useFeaturesStore } from '@/stores/features'
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { PropType } from 'vue'
import type { Feature } from '@/interfaces/Features'
import GroupSelector from '@/components/account/GroupSelector.vue'
import { useSubdomainStore } from '@/stores/subdomains'

const props = defineProps({
  entity: {
    type: Object as PropType<Entity>,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  action: {
    type: String as PropType<EntityActions>,
    required: true,
  },
  showModal: Boolean,
})

const coreStore = useCoreStore()
const userStore = useUserStore()
const { featureDetails, selectedGroups, groupMap, groupThreshold } = storeToRefs(userStore)

const subdomainStore = useSubdomainStore()
const { subdomains, gettingSubdomains } = storeToRefs(subdomainStore)

const featuresStore = useFeaturesStore()
const { features } = storeToRefs(featuresStore)

const emit = defineEmits(['close', 'update'])

const featureName = computed(() => {
  let name = 'add_or_edit_users'
  if (props.action === 'add' && props.entity.type === 'facilities') {
    name = 'manage_facilities'
  } else if (props.action === 'edit' && props.entity.type === 'facilities') {
    if ((featureDetails.value['manage_facilities'] || {}).enabled) {
      name = 'manage_facilities'
    } else {
      name = 'edit_facilities'
    }
  }
  return name
})

const canManageFacilities = ref(featureName.value === 'manage_facilities')

if (!selectedGroups.value[featureName.value]) {
  selectedGroups.value[featureName.value] = []
}

const selectorGroupOptions = ref(
  (featureDetails.value[featureName.value] || {}).groups.reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[]),
)

if (props.action === 'edit') {
  if (props.entity.type === 'users') {
    selectedGroups.value[featureName.value] = selectorGroupOptions.value.map(
      (group: Group) => group.id,
    )
  } else if (props.entity.type === 'facilities') {
    selectedGroups.value[featureName.value] = [selectorGroupOptions.value[0].id]
  }
}

const focusedGroup = ref(selectorGroupOptions.value.length ? selectorGroupOptions.value[0].id : 0)

if ((featureDetails.value[featureName.value] || {}).groups.length === 1) {
  selectedGroups.value[featureName.value] = [selectorGroupOptions.value[0].id]
}
if (
  props.entity.type === 'facilities' &&
  props.action === 'edit' &&
  (props.entity.groups || []).length === 1
) {
  selectedGroups.value[featureName.value] = [props.entity.groups![0].id]
  focusedGroup.value = props.entity.groups![0].id
}
const invalidName = ref(false)
const invalidContact = ref(false)
const nameError = ref('')
const contactError = ref('')
const validateName = (str: string) => {
  str = str.trim()
  invalidName.value = !str
  nameError.value = invalidName.value ? 'Name is required' : ''
}
const validateContact = (str: string) => {
  str = str.trim()
  invalidContact.value = !str
  contactError.value = invalidContact.value
    ? `${props.entity.type === 'facilities' ? 'Site code' : 'Email'} is required`
    : ''
  if (!invalidContact.value && props.entity.type === 'users') {
    invalidContact.value = !isEmail(str)
    contactError.value = invalidContact.value ? 'A valid email is required' : ''
  }
}

const handleNameInput = (e: InputFileEvent) => {
  newEntity.value.name = e.target.value
  validateName(newEntity.value.name || '')
}

const handleContactInput = (e: InputFileEvent) => {
  newEntity.value.contact = e.target.value
  validateContact(newEntity.value.contact)
}

const handleSubmit = async () => {
  // Validation
  validateName(newEntity.value.name || '')
  validateContact(newEntity.value.contact || '')
  const hasGroups = selectedGroups.value[featureName.value].length
  const anyInvalid =
    invalidName.value ||
    invalidContact.value ||
    !hasGroups ||
    hasInvalidPrimarySiteCode.value ||
    hasInvalidSubdomain.value
  if (anyInvalid) {
    if (includeSubdomain.value) {
      primarySitecodeTouched.value = true
      subdomainTouched.value = true
    }
    return
  }

  if (props.entity.type == 'facilities' && canManageFacilities.value && includeSubdomain.value) {
    newEntity.value.subdomain = subdomain.value
    newEntity.value.primary_sitecode = primarySitecode.value
  } else if (props.entity.type == 'facilities' && canManageFacilities.value) {
    newEntity.value.subdomain = ''
    newEntity.value.primary_sitecode = ''
  }

  newEntity.value.groups = selectedGroups.value[featureName.value]
    .map((group) => {
      const g = groupMap.value.get(group)
      return {
        id: g!.id,
        name: g!.name,
        features: selectedFeatures.value[group],
      }
    })
    .filter((group) => {
      return Object.keys(group.features).length
    })
  try {
    await coreStore.$api.auth.entities[props.action](newEntity.value, props.entity.type)
    const msg = `${newEntity.value.name} successfully ${props.action === 'add' ? 'added' : 'edited'}.`
    coreStore.toast(msg, 'success')
  } catch {
    const msg = `Oops! There was an error and ${newEntity.value.name} could not be ${props.action === 'add' ? 'added' : 'edited'}.`
    coreStore.toast(msg, 'error')
  }
  emit('update')

  emit('close')
}

const newEntity = ref({ ...props.entity })
const categorizedFeatures = computed(() =>
  featuresStore.categorizedFeatures(
    groupMap.value.get(focusedGroup.value),
    props.entity.type,
    true,
  ),
)
const selectedFeatures = ref({} as { [group: number]: { [feature: string]: boolean } })
selectorGroupOptions.value.forEach((group) => {
  selectedFeatures.value[group.id] = {}
  for (const key in categorizedFeatures.value) {
    categorizedFeatures.value[key].forEach((feature) => {
      if (newEntity.value.groups) {
        const currentGroup = newEntity.value.groups.find((g: Group) => g.id === group.id)
        if (currentGroup) {
          selectedFeatures.value[group.id][feature.name] = currentGroup.features[feature.name]
        }
      }
    })
  }
})
const selectAllFeatures = (emptying: boolean) => {
  if (emptying) {
    selectedFeatures.value[focusedGroup.value] = {}
  } else {
    selectedFeatures.value[focusedGroup.value] = features.value.reduce(
      (obj, feature) => {
        obj[feature.name] = true
        return obj
      },
      {} as { [feature: string]: boolean },
    )
  }
}

const selectCategoryFeatures = (category: Array<Feature>) => {
  const hasCategoryFeature = category.some((feature: Feature) => {
    return selectedFeatures.value[focusedGroup.value][feature.name]
  })
  category.forEach((feature: Feature) => {
    selectedFeatures.value[focusedGroup.value][feature.name] =
      !selectedFeatures.value[focusedGroup.value] || !hasCategoryFeature
  })
}
const handleFeatureSelection = (e: InputFileEvent) => {
  selectedFeatures.value[focusedGroup.value][e.target.value] = !e.target.checked
}

const handleGroupSelection = (event: GroupSelection) => {
  const hasGroup = selectedGroups.value[featureName.value].includes(event.target)
  const hasAny = event.groups.length
  if (hasGroup) {
    focusedGroup.value = event.target
  } else if (hasAny) {
    focusedGroup.value = event.groups[0]
  } else {
    focusedGroup.value = 0
  }
}

const handleFeatureGroupSelection = (e: InputFileEvent) => {
  focusedGroup.value = parseInt(e.target.value, 10)
}

const includeSubdomain = ref(!!newEntity.value.subdomain && !!newEntity.value.primary_sitecode)
const primarySitecode = ref(newEntity.value.primary_sitecode || '')
const noPrimarySitecode = computed(() => !primarySitecode.value.trim())
const primarySitecodeTouched = ref(false)
const hasInvalidPrimarySiteCode = computed(() => includeSubdomain.value && noPrimarySitecode.value)
const showInvalidPrimarySitecode = computed(
  () => includeSubdomain.value && primarySitecodeTouched.value && noPrimarySitecode.value,
)
const sitecodeMessage = computed(() =>
  primarySitecodeTouched.value && noPrimarySitecode.value
    ? 'A primary sitecode is required if you wish to use a subdomain.'
    : '',
)
const subdomain = ref(newEntity.value.subdomain || '')
const hasInvalidSubdomain = computed(() => includeSubdomain.value && !subdomain.value)
const showInvalidSubdomain = computed(
  () => includeSubdomain.value && subdomainTouched.value && !subdomain.value,
)
const subdomainTouched = ref(false)
const subdomainMessage = computed(() =>
  showInvalidSubdomain.value ? 'A subdomain is required if you wish to use a subdomain.' : '',
)

const handlePrimarySitecode = (e: InputFileEvent) => {
  primarySitecode.value = e.target.value
  primarySitecodeTouched.value = true
}
const handleSubdomain = (e: InputFileEvent) => {
  subdomain.value = e.target.value
  subdomainTouched.value = true
}

const getSubdomains = async () => {
  gettingSubdomains.value = true
  const args = {
    is_active: true,
    name: '',
  }
  const { data } = await coreStore.$api.auth.subdomains.get(args)
  subdomains.value = data.subdomains
  gettingSubdomains.value = false
}
if (props.entity.type === 'facilities' && !subdomains.value.length && !gettingSubdomains.value) {
  getSubdomains()
}
</script>

<template>
  <Teleport to="body">
    <pep-pharos-modal
      :id="`${action}-entity-modal-${entity.id || 0}`"
      :key="`${action}-entity-modal-${entity.id || 0}`"
      :header="`${capitalize(action)} ${entityType}`"
      size="large"
      :open="showModal"
      @pharos-modal-closed="emit('close')"
    >
      <div class="mb-6">
        <pep-pharos-input-group
          v-if="entity.type !== 'facilities' || canManageFacilities"
          :id="`${entity.id || entity.type}_name`"
          :value="newEntity.name || ''"
          :placeholder="
            entity.type === 'users' ? 'Jane Smith' : 'Department of Corrections Facility'
          "
          :name="`${entity.id || entity.type}_name`"
          class="mb-4"
          :message="nameError"
          :invalidated="invalidName"
          @input="handleNameInput"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Name</span>
        </pep-pharos-input-group>

        <pep-pharos-input-group
          v-if="entity.type !== 'facilities' || canManageFacilities"
          :id="`${entity.id || entity.type}_contact`"
          :value="newEntity.contact || ''"
          :placeholder="entity.type === 'users' ? 'name@example.com' : 'example.edu'"
          :name="`${entity.id || entity.type}_contact`"
          class="mb-4"
          :message="contactError"
          :invalidated="invalidContact"
          @input="handleContactInput"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">{{ entity.type === 'users' ? 'Email' : 'Site Code' }}</span>
        </pep-pharos-input-group>
        <div v-if="entity.type === 'facilities' && canManageFacilities">
          <pep-pharos-checkbox
            :id="`${entity.id || entity.type}_use_subdomain`"
            :checked="includeSubdomain"
            class="mb-4"
            @input="includeSubdomain = !includeSubdomain"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <span
              slot="label"
              class="text-weight-bold"
            > Use Subdomain </span>
          </pep-pharos-checkbox>
          <pep-pharos-combobox
            v-if="includeSubdomain"
            :id="`${entity.id || entity.type}_subdomain`"
            class="mb-4"
            :value="subdomain"
            :invalidated="showInvalidSubdomain"
            :message="subdomainMessage"
            @change="handleSubdomain"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <div slot="label">
              <div class="display-flex align-items-center">
                <span>Subdomains</span>
              </div>
            </div>
            <option
              v-for="(sub, index) in subdomains"
              :key="`subdomain_option_${index}`"
              :value="sub.subdomain"
            >
              {{ sub.subdomain }}
            </option>
          </pep-pharos-combobox>
          <pep-pharos-input-group
            v-if="includeSubdomain"
            :id="`${entity.id || entity.type}_primary_sitecode`"
            :value="primarySitecode"
            :placeholder="'example.edu'"
            :name="`${entity.id || entity.type}_primary_sitecode`"
            :message="sitecodeMessage"
            :invalidated="showInvalidPrimarySitecode"
            @input="handlePrimarySitecode"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <span slot="label">{{ 'Primary Sitecode' }}</span>
          </pep-pharos-input-group>
        </div>
      </div>
      <div v-if="entity.type === 'users'">
        <div
          v-if="action === 'add'"
          class="mb-4"
        >
          <GroupSelector
            :groups="selectorGroupOptions"
            :feature-name="featureName"
            :start-full="false"
            multiple
            @change="handleGroupSelection"
          />
          <span
            v-if="!selectedGroups[featureName].length"
            class="error"
          >
            At least one group must be selected
          </span>
        </div>
        <!-- Group Selector for Features -->
        <div
          v-if="selectedGroups[featureName].length > 1"
          class="mb-4"
        >
          <div v-if="selectedGroups[featureName].length >= groupThreshold">
            <pep-pharos-select
              class="group-selector-dropdown"
              :value="focusedGroup"
              @change="handleFeatureGroupSelection"
            >
              <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
              <div slot="label">
                <div class="display-flex align-items-center">
                  <span>Enable Features</span>
                </div>
              </div>
              <option
                v-for="group in selectorGroupOptions.filter((group: Group) =>
                  selectedGroups[featureName].includes(group.id),
                )"
                :key="`${entity.id}_group_${group}`"
                :value="group.id"
              >
                {{ group.name }}
              </option>
            </pep-pharos-select>
          </div>
          <div v-else>
            <pep-pharos-heading
              class="mb-2 pb-0"
              preset="legend"
              :level="3"
            >
              Enable Features
            </pep-pharos-heading>
            <pep-pharos-button
              variant="overlay"
              :data-dropdown-menu-id="`group_selector_manager_${entity.id}`"
              full-width
              class="mb-3"
              icon-left="chevron-down"
            >
              {{ (groupMap.get(focusedGroup) || {}).name }}
            </pep-pharos-button>
            <pep-pharos-dropdown-menu
              :id="`group_selector_manager_${entity.id}`"
              full-width
            >
              <pep-pharos-dropdown-menu-item
                v-for="group in selectorGroupOptions.filter((group: Group) =>
                  selectedGroups[featureName].includes(group.id),
                )"
                :key="`${entity.id}_group_${group}`"
                @click="focusedGroup = group.id"
              >
                {{ group.name }}
              </pep-pharos-dropdown-menu-item>
            </pep-pharos-dropdown-menu>
          </div>
        </div>
      </div>
      <div
        v-else-if="action === 'add'"
        class="mb-4"
      >
        <GroupSelector
          :groups="selectorGroupOptions"
          :feature-name="featureName"
          :start-full="true"
          @change="handleGroupSelection"
        />
        <span
          v-if="!selectedGroups[featureName].length"
          class="error"
        >
          A group must be selected
        </span>
      </div>
      <div v-else-if="selectedGroups[featureName].length === 1">
        <pep-pharos-heading
          class="mb-2 pb-0"
          preset="3"
          :level="3"
        >
          {{ (groupMap.get(selectedGroups[featureName][0]) || {}).name }}
        </pep-pharos-heading>
      </div>
      <!-- Features -->
      <div
        v-if="focusedGroup && selectedGroups[featureName] && selectedGroups[featureName].length"
        class="feature-selection"
      >
        <div>
          <pep-pharos-checkbox
            :checked="
              Object.values(selectedFeatures[focusedGroup] || {}).filter((val: boolean) => val)
                .length === features.length
            "
            :indeterminate="
              Object.values(selectedFeatures[focusedGroup] || {}).filter((val: boolean) => val)
                .length &&
                Object.values(selectedFeatures[focusedGroup] || {}).filter((val: boolean) => val)
                  .length !== features.length
            "
            class="mb-4"
            @input="
              selectAllFeatures(
                Object.values(selectedFeatures[focusedGroup]).filter((val: boolean) => val)
                  .length === features.length,
              )
            "
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <span
              slot="label"
              class="text-weight-bold"
            > Select All </span>
          </pep-pharos-checkbox>
        </div>
        <div>
          <ul class="entity-features">
            <li
              v-for="(category, label, index) in categorizedFeatures"
              :key="`category_${index}`"
            >
              <pep-pharos-heading
                class=""
                preset="legend"
                :level="3"
              >
                <pep-pharos-checkbox
                  :checked="
                    category.every(
                      (feature: Feature) => (selectedFeatures[focusedGroup] || {})[feature.name],
                    )
                  "
                  :indeterminate="
                    category.some(
                      (feature: Feature) => (selectedFeatures[focusedGroup] || {})[feature.name],
                    ) &&
                      !category.every(
                        (feature: Feature) => selectedFeatures[focusedGroup][feature.name],
                      )
                  "
                  class="mb-2"
                  @input="selectCategoryFeatures(category)"
                >
                  <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                  <span
                    slot="label"
                    class="text-weight-bold"
                  >
                    {{ label }}
                  </span>
                </pep-pharos-checkbox>
              </pep-pharos-heading>
              <pep-pharos-checkbox-group
                v-if="category.length"
                @input="handleFeatureSelection"
              >
                <ul class="checkbox-group">
                  <li
                    v-for="feature in category"
                    :key="`feature_${feature.name}`"
                  >
                    <pep-pharos-checkbox
                      :checked="(selectedFeatures[focusedGroup] || {})[feature.name]"
                      :value="feature.name"
                    >
                      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                      <span slot="label">
                        <span class="display-flex align-items-center">
                          <span>{{ feature.display_name }}</span>
                          <pep-pharos-icon
                            :data-tooltip-id="`feature-manager-tooltip-${feature.name}`"
                            name="question-inverse"
                            class="mt-0 pl-2 fill-gray-40 small-icon"
                            :aria-describedby="`feature-manager-tooltip-${feature.name}`"
                          />
                          <pep-pharos-tooltip
                            :id="`feature-manager-tooltip-${feature.name}`"
                            placement="top"
                          >
                            <span class="text-none">{{ feature.description }}</span>
                          </pep-pharos-tooltip>
                        </span>
                      </span>
                    </pep-pharos-checkbox>
                  </li>
                </ul>
              </pep-pharos-checkbox-group>
            </li>
          </ul>
        </div>
      </div>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" @click.prevent.stop="handleSubmit">
        Submit
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>

<script setup lang="ts">
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { EntityActions } from '@/interfaces/AccountManagement'
import type { Feature } from '@/interfaces/Features'
import type { Entity, EntityManagerPayload } from '@/interfaces/Entities'
import type { Group, GroupSelection } from '@/interfaces/Group'
import type { PropType, Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import GroupSelector from '@/components/account/GroupSelector.vue'
import { useLogger } from '@/composables/logging/useLogger'
import { useCoreStore } from '@/stores/core'
import { useFeaturesStore } from '@/stores/features'
import { useSubdomainStore } from '@/stores/subdomains'
import { useUserStore } from '@/stores/user'
import { capitalize, isEmail } from '@/utils/helpers'

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

const emit = defineEmits(['close', 'update'])

const coreStore = useCoreStore()
const featuresStore = useFeaturesStore()
const subdomainStore = useSubdomainStore()
const userStore = useUserStore()

const { featureDetails, selectedGroups, groupMap, groupThreshold } = storeToRefs(userStore)
const { subdomains, gettingSubdomains } = storeToRefs(subdomainStore)

/**
 * The new entity being managed.
 */
const newEntity = ref({ ...props.entity })

/**
 * Compute the feature name based on the entity type and action.
 * @returns The computed feature name as a string.
 */
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

/**
 * Options for the group selector component, derived from the available groups for the current feature.
 */
const selectorGroupOptions = ref(
  featureDetails.value[featureName.value]?.groups
    .reduce((arr, id: number) => {
      const group = groupMap.value.get(id)
      if (group) {
        arr.push(group)
      }
      return arr
    }, [] as Group[])
    .sort((a, b) => a.name.localeCompare(b.name)) || [],
)

// Set the initial values for groups and options based on the entity type and action
if (props.action === 'edit') {
  if (props.entity.type === 'users') {
    selectedGroups.value[featureName.value] =
      selectorGroupOptions.value?.map((group: Group) => group.id) || []
  } else if (props.entity.type === 'facilities') {
    selectedGroups.value[featureName.value] = selectorGroupOptions.value![0]?.id
      ? [selectorGroupOptions.value![0].id]
      : []
  }
}

/**
 * Ref for the currently selected group in the modal
 */
const focusedGroup = ref(
  selectorGroupOptions.value?.length ? selectorGroupOptions.value![0]?.id : 0,
) as Ref<number>

// Automatically select the first group if there is only one available for the feature.
if (featureDetails.value[featureName.value]?.groups.length === 1) {
  selectedGroups.value[featureName.value] = selectorGroupOptions.value![0]?.id
    ? [selectorGroupOptions.value![0].id]
    : []
}

// Automatically select the first group for facilities when editing if the entity has exactly one group.
if (
  props.entity.type === 'facilities' &&
  props.action === 'edit' &&
  (props.entity.groups || []).length === 1
) {
  selectedGroups.value[featureName.value] = props.entity.groups![0]?.id
    ? [props.entity.groups![0].id]
    : []
  focusedGroup.value = props.entity.groups![0]?.id || 0
}

/**
 * The selected features of each group, keyed by group ID and feature name.
 */
const selectedFeatures = ref({} as { [group: number]: { [feature: string]: boolean } })

/**
 * Initialize selected features for each available group from the entity's current values.
 */
selectorGroupOptions.value?.forEach((group) => {
  const currentGroup = newEntity.value.groups?.find((g: Group) => g.id === group.id)
  selectedFeatures.value[group.id] = Object.entries(currentGroup?.features || {}).reduce(
    (featureMap, [name, isSelected]) => {
      featureMap[name] = !!isSelected
      return featureMap
    },
    {} as { [feature: string]: boolean },
  )
})

/**
 * The categorized features of the focused group.
 */
const categorizedFeatures = computed(() => {
  return featuresStore.categorizedFeatures(
    groupMap.value.get(focusedGroup.value),
    props.entity.type,
    true,
  )
})

/**
 * Flat list of feature names currently visible for the focused group.
 */
const focusedGroupFeatureNames = computed(() => {
  return Object.values(categorizedFeatures.value).flatMap((category) =>
    category.map((feature: Feature) => feature.name),
  )
})

/**
 * Number of enabled features in the focused group.
 */
const selectedFocusedGroupFeatureCount = computed(() => {
  return focusedGroupFeatureNames.value.filter((name) => {
    return !!selectedFeatures.value[focusedGroup.value]?.[name]
  }).length
})

/**
 * True when every visible feature in the focused group is enabled.
 */
const allFocusedGroupFeaturesSelected = computed(() => {
  return (
    focusedGroupFeatureNames.value.length > 0 &&
    selectedFocusedGroupFeatureCount.value === focusedGroupFeatureNames.value.length
  )
})

/**
 * True when the focused group has a partial feature selection (i.e., indeterminate state)
 */
const someFocusedGroupFeaturesSelected = computed(() => {
  return selectedFocusedGroupFeatureCount.value > 0 && !allFocusedGroupFeaturesSelected.value
})

/**
 * Validation state and error messages for the entity's name and contact fields.
 */
const invalidName = ref(false)
const invalidContact = ref(false)
const nameError = ref('')
const contactError = ref('')

/**
 * Validates the entity's name field.
 *
 * @param str
 */
const validateName = (str: string) => {
  str = str.trim()
  invalidName.value = !str
  nameError.value = invalidName.value ? 'Name is required' : ''
}

/**
 * Validates the entity's contact field.
 *
 * @param str
 */
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

/**
 * Handlers for input events on the entity's name and contact fields.
 *
 * @param e The input for the entity's name field.
 */
const handleNameInput = (e: InputFileEvent) => {
  newEntity.value.name = e.target.value
  validateName(newEntity.value.name || '')
}

/**
 * Handles input events for the entity's contact field.
 *
 * @param e The input for the entity's contact field.
 */
const handleContactInput = (e: InputFileEvent) => {
  newEntity.value.contact = e.target.value
  validateContact(newEntity.value.contact)
}

/**
 * Returns feature names available to a specific group for the current entity type.
 *
 * @param groupId The ID of the group for which to retrieve available feature names.
 * @returns An array of feature names available to the specified group.
 */
const getAvailableFeatureNamesForGroup = (groupId: number): string[] => {
  const group = groupMap.value.get(groupId)
  if (!group) {
    return []
  }

  return Object.values(featuresStore.categorizedFeatures(group, props.entity.type, true)).flatMap(
    (category) => category.map((feature: Feature) => feature.name),
  )
}

/**
 * We want every value to have an explicitly set value so that features being turned off are specifically
 * included in the changes sent to the server.
 *
 * @param groupId The ID of the group for which to build the feature map.
 * @param source An optional source object containing the current feature states.
 * @returns A feature map with all available features for the group explicitly set to true or false.
 */
const buildFeatureMapForGroup = (
  groupId: number,
  source: { [feature: string]: boolean } = {},
): { [feature: string]: boolean } => {
  return getAvailableFeatureNamesForGroup(groupId).reduce(
    (featureMap, featureName) => {
      featureMap[featureName] = !!source[featureName]
      return featureMap
    },
    {} as { [feature: string]: boolean },
  )
}

/**
 * Checks if any features are enabled in the given feature map.
 *
 * @param featureMap A map of feature names to their enabled/disabled state.
 * @returns True if at least one feature is enabled, false otherwise.
 */
const hasAnyEnabledFeature = (featureMap: { [feature: string]: boolean }): boolean => {
  return Object.values(featureMap).some((isEnabled) => isEnabled)
}

/**
 * Compares two feature maps, treating missing keys as false. This allows us to identify where
 * changes have been made.
 *
 * @param a The first feature map to compare.
 * @param b The second feature map to compare.
 * @returns True if the feature maps are equal, false otherwise.
 */
const areFeatureMapsEqual = (
  a: { [feature: string]: boolean },
  b: { [feature: string]: boolean },
): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (!!a[key] !== !!b[key]) {
      return false
    }
  }
  return true
}

/**
 * Get the selection status of a specific feature within the focused group.
 *
 * @param featureName The name of the feature to check.
 * @returns A boolean indicating whether the feature is selected in the focused group.
 */
const getFeatureStatusInFocusedGroup = (featureName: string): boolean => {
  return !!selectedFeatures.value[focusedGroup.value]?.[featureName]
}

/**
 * Select or deselect all features within the focused group.
 *
 * @param emptying A boolean indicating whether to deselect all features (true) or select all features (false).
 */
const selectAllFeatures = (emptying: boolean) => {
  if (!selectedFeatures.value[focusedGroup.value]) {
    selectedFeatures.value[focusedGroup.value] = {}
  }

  if (emptying) {
    selectedFeatures.value[focusedGroup.value] = {}
  } else {
    selectedFeatures.value[focusedGroup.value] = focusedGroupFeatureNames.value.reduce(
      (featureMap, featureName) => {
        featureMap[featureName] = true
        return featureMap
      },
      {} as { [feature: string]: boolean },
    )
  }
}

/**
 * Select or deselect all features within a specific category.
 *
 * @param category The array of features within the category to be toggled.
 */
const selectCategoryFeatures = (category: Array<Feature>) => {
  if (!selectedFeatures.value[focusedGroup.value]) {
    selectedFeatures.value[focusedGroup.value] = {}
  }

  const shouldEnable = !category.every((feature: Feature) => {
    return !!selectedFeatures.value[focusedGroup.value]?.[feature.name]
  })

  category.forEach((feature: Feature) => {
    selectedFeatures.value[focusedGroup.value]![feature.name] = shouldEnable
  })
}

/**
 * Toggle the selection status of a specific feature within the focused group.
 *
 * @param featureName The name of the feature to be toggled.
 */
const toggleFeatureSelection = (featureName: string) => {
  if (!selectedFeatures.value[focusedGroup.value]) {
    selectedFeatures.value[focusedGroup.value] = {}
  }
  selectedFeatures.value[focusedGroup.value]![featureName] =
    !selectedFeatures.value[focusedGroup.value]![featureName]
}

/**
 * Handle the selection of a group.
 *
 * @param event The group selection event containing the target and available groups.
 */
const handleGroupSelection = (event: GroupSelection) => {
  const hasGroup = selectedGroups.value[featureName.value]?.includes(event.target)
  const hasAny = event.groups.length
  if (hasGroup) {
    focusedGroup.value = event.target
  } else if (hasAny) {
    focusedGroup.value = event.groups[0] || 0
  } else {
    focusedGroup.value = 0
  }
}

/**
 * Handle the selection of a feature group.
 *
 * @param e The input file event containing the selected group value.
 */
const handleFeatureGroupSelection = (e: InputFileEvent) => {
  focusedGroup.value = parseInt(e.target.value, 10)
}

/**
 * Include subdomain flag and related reactive properties involving subdomain and sitecode.
 */
const includeSubdomain = ref(!!newEntity.value.subdomain && !!newEntity.value.primary_sitecode)
const primarySiteCode = ref(newEntity.value.primary_sitecode || '')
const isPrimarySiteCodeBlank = computed(() => !primarySiteCode.value.trim())
const primarySiteCodeTouched = ref(false)
const hasInvalidPrimarySiteCode = computed(
  () => includeSubdomain.value && isPrimarySiteCodeBlank.value,
)
const showInvalidPrimarySiteCode = computed(
  () => includeSubdomain.value && primarySiteCodeTouched.value && isPrimarySiteCodeBlank.value,
)
const primarySiteCodeMessage = computed(() =>
  primarySiteCodeTouched.value && isPrimarySiteCodeBlank.value
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

/**
 * Handle the input events for primary sitecode and subdomain.
 *
 * @param e The input file event containing the primary sitecode value.
 */
const handlePrimarySiteCode = (e: InputFileEvent) => {
  primarySiteCode.value = e.target.value
  primarySiteCodeTouched.value = true
}

/**
 * Handle the input event for the subdomain field.
 *
 * @param e The input file event containing the subdomain value.
 */
const handleSubdomain = (e: InputFileEvent) => {
  subdomain.value = e.target.value
  subdomainTouched.value = true
}

/**
 * Get the list of subdomains from the API.
 *
 */
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

// Fetch subdomains if the entity is a facility and subdomains have not been fetched yet.
if (props.entity.type === 'facilities' && !subdomains.value.length && !gettingSubdomains.value) {
  getSubdomains()
}

/**
 * Handles the submission of the entity form, including validation and preparation of the payload.
 */
const handleSubmit = async () => {
  // Validation
  validateName(newEntity.value.name || '')
  validateContact(newEntity.value.contact || '')
  const hasGroups = selectedGroups.value[featureName.value]?.length
  const anyInvalid =
    invalidName.value ||
    invalidContact.value ||
    !hasGroups ||
    hasInvalidPrimarySiteCode.value ||
    hasInvalidSubdomain.value
  if (anyInvalid) {
    if (includeSubdomain.value) {
      primarySiteCodeTouched.value = true
      subdomainTouched.value = true
    }
    return
  }

  // Filter and prepare the list of groups to be included in the payload.
  const groups = (selectedGroups.value[featureName.value]
    ?.map((group: number) => {
      const g = groupMap.value.get(group)

      // We want to filter out groups that don't exist in the group map
      if (!g) {
        return null
      }

      // We also want to filter out groups that don't have any enabled features
      const selectedGroupFeatures = buildFeatureMapForGroup(
        group,
        selectedFeatures.value[group] || {},
      )
      if (!hasAnyEnabledFeature(selectedGroupFeatures)) {
        return null
      }

      // We also want to filter out groups that haven't changed from the original entity
      const originalGroup = (newEntity.value.groups || []).find((entityGroup: Group) => {
        return entityGroup.id === group
      })

      // Build a feature map for the original group to compare against the selected features.
      const originalGroupFeatures = buildFeatureMapForGroup(group, originalGroup?.features || {})

      // Determine if the selected features for this group have changed compared to the original features.
      const hasChanged =
        props.action === 'add' || !areFeatureMapsEqual(selectedGroupFeatures, originalGroupFeatures)

      // If the features haven't changed, we don't need to include this group in the update.
      if (!hasChanged) {
        return null
      }

      return {
        id: g.id,
        name: g.name,
        features: selectedGroupFeatures,
      }
    })
    .filter(Boolean) || []) as Group[]

  // Prepare the payload for the API request, including the updated groups
  // and any relevant subdomain or primary sitecode information.
  const payload: EntityManagerPayload = {
    ...newEntity.value,
    groups,
    ...(props.entity.type === 'facilities' && canManageFacilities.value
      ? {
          subdomain: includeSubdomain.value ? subdomain.value : '',
          primary_sitecode: includeSubdomain.value ? primarySiteCode.value : '',
        }
      : {}),
  }

  // Send the prepared payload to the API and handle the response.
  try {
    await coreStore.$api.auth.entities[props.action](payload, props.entity.type)
    const msg = `${payload.name} successfully ${props.action === 'add' ? 'added' : 'edited'}.`
    coreStore.toast(msg, 'success')
  } catch {
    const msg = `Oops! There was an error and ${payload.name} could not be ${props.action === 'add' ? 'added' : 'edited'}.`
    coreStore.toast(msg, 'error')
  }

  emit('update')
  emit('close')
}

const { handleWithLog, logs } = useLogger()
const {
  closeEntityModalLog,
  featureCheckboxToggleLog,
  featureGroupSelectionLog,
  submitEntityFormLog,
} = logs.getEntityManagerLogs({ action: props.action, entity: newEntity })
</script>

<template>
  <Teleport to="body">
    <pep-pharos-modal
      :id="`${action}-${entityType}-modal-${entity.id || 0}`"
      :key="`${action}-${entityType}-modal-${entity.id || 0}`"
      :header="`${capitalize(action)} ${entityType}`"
      size="large"
      :open="showModal"
      @pharos-modal-closed="handleWithLog(closeEntityModalLog, () => emit('close'))"
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
          <span slot="label">{{ entity.type === 'users' ? 'Email' : 'Site Code' }}</span>
        </pep-pharos-input-group>
        <div v-if="entity.type === 'facilities' && canManageFacilities">
          <pep-pharos-checkbox
            :id="`${entity.id || entity.type}_use_subdomain`"
            :checked="includeSubdomain"
            class="mb-4"
            @change="
              handleWithLog(
                featureCheckboxToggleLog('use_subdomain', 'Use Subdomain'),
                () => (includeSubdomain = !includeSubdomain),
              )
            "
          >
            <span slot="label" class="text-weight-bold"> Use Subdomain </span>
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
            :value="primarySiteCode"
            :placeholder="'example.edu'"
            :name="`${entity.id || entity.type}_primary_sitecode`"
            :message="primarySiteCodeMessage"
            :invalidated="showInvalidPrimarySiteCode"
            @input="handlePrimarySiteCode"
          >
            <span slot="label">{{ 'Primary Sitecode' }}</span>
          </pep-pharos-input-group>
        </div>
      </div>
      <div v-if="entity.type === 'users'">
        <div v-if="action === 'add'" class="mb-4">
          <GroupSelector
            :groups="selectorGroupOptions"
            :feature-name="featureName"
            :start-full="false"
            multiple
            @change="handleGroupSelection"
          />
          <span v-if="!selectedGroups[featureName]?.length" class="error">
            At least one group must be selected
          </span>
        </div>
        <!-- Group Selector for Features -->
        <div v-if="(selectedGroups[featureName]?.length || 0) > 1" class="mb-4">
          <div v-if="(selectedGroups[featureName]?.length || 0) >= groupThreshold">
            <pep-pharos-select
              class="group-selector-dropdown"
              :value="focusedGroup"
              data-cy="feature_group_selector"
              @change="
                handleWithLog(featureGroupSelectionLog, () => handleFeatureGroupSelection($event))
              "
            >
              <div slot="label">
                <div class="display-flex align-items-center">
                  <span>Enable Features</span>
                </div>
              </div>
              <option
                v-for="group in selectorGroupOptions.filter((group: Group) =>
                  selectedGroups[featureName]?.includes(group.id),
                )"
                :key="`${entity.id}_group_${group}`"
                :value="group.id"
              >
                {{ group.name }}
              </option>
            </pep-pharos-select>
          </div>
          <div v-else>
            <pep-pharos-heading class="mb-2 pb-0" preset="legend" :level="3">
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
            <pep-pharos-dropdown-menu :id="`group_selector_manager_${entity.id}`" full-width>
              <pep-pharos-dropdown-menu-item
                v-for="group in selectorGroupOptions.filter((group: Group) =>
                  selectedGroups[featureName]?.includes(group.id),
                )"
                :key="`${entity.id}_group_${group}`"
                @click="
                  handleWithLog(featureGroupSelectionLog, () => {
                    focusedGroup = group.id
                  })
                "
              >
                {{ group.name }}
              </pep-pharos-dropdown-menu-item>
            </pep-pharos-dropdown-menu>
          </div>
        </div>
      </div>
      <div v-else-if="action === 'add'" class="mb-4">
        <GroupSelector
          :groups="selectorGroupOptions"
          :feature-name="featureName"
          :start-full="true"
          @change="handleGroupSelection"
        />
        <span v-if="!selectedGroups[featureName]?.length" class="error">
          A group must be selected
        </span>
      </div>
      <div v-else-if="selectedGroups[featureName]?.length === 1">
        <pep-pharos-heading class="mb-2 pb-0" preset="3" :level="3">
          {{ groupMap.get(selectedGroups[featureName]?.[0] || -1)?.name }}
        </pep-pharos-heading>
      </div>
      <!-- Features -->
      <div
        v-if="focusedGroup && selectedGroups[featureName] && selectedGroups[featureName]?.length"
        class="feature-selection"
      >
        <div>
          <pep-pharos-checkbox
            :checked="allFocusedGroupFeaturesSelected"
            :indeterminate="someFocusedGroupFeaturesSelected"
            class="mb-4"
            @change="
              handleWithLog(featureCheckboxToggleLog('select_all_features', 'Select All'), () =>
                selectAllFeatures(allFocusedGroupFeaturesSelected),
              )
            "
          >
            <span slot="label" class="text-weight-bold"> Select All </span>
          </pep-pharos-checkbox>
        </div>
        <div>
          <ul class="entity-features">
            <li v-for="(category, label, index) in categorizedFeatures" :key="`category_${index}`">
              <pep-pharos-heading class="" preset="legend" :level="3">
                <pep-pharos-checkbox
                  :checked="
                    category.every((feature: Feature) =>
                      getFeatureStatusInFocusedGroup(feature.name),
                    )
                  "
                  :indeterminate="
                    category.some((feature: Feature) =>
                      getFeatureStatusInFocusedGroup(feature.name),
                    ) &&
                    !category.every((feature: Feature) =>
                      getFeatureStatusInFocusedGroup(feature.name),
                    )
                  "
                  class="mb-2"
                  @change="
                    handleWithLog(
                      featureCheckboxToggleLog(`category_${label}`, String(label)),
                      () => selectCategoryFeatures(category),
                    )
                  "
                >
                  <span slot="label" class="text-weight-bold">
                    {{ label }}
                  </span>
                </pep-pharos-checkbox>
              </pep-pharos-heading>
              <pep-pharos-checkbox-group
                v-if="category.length"
                class="entity-manager__jaip-checkbox-group"
              >
                <ul class="jaip-checkbox-group">
                  <li v-for="feature in category" :key="`feature_${feature.name}`">
                    <pep-pharos-checkbox
                      :checked="getFeatureStatusInFocusedGroup(feature.name)"
                      :value="feature.name"
                      @change="
                        handleWithLog(
                          featureCheckboxToggleLog(
                            !getFeatureStatusInFocusedGroup(feature.name),
                            feature.display_name,
                          ),
                          () => toggleFeatureSelection(feature.name),
                        )
                      "
                    >
                      <span slot="label">
                        <span class="entity-manager__icon-wrapper">
                          <span>{{ feature.display_name }}</span>
                          <pep-pharos-icon
                            class="entity-manager__tooltip-icon"
                            name="question-inverse"
                            a11y-title="Hover over to see feature description"
                            a11y-hidden="false"
                            role="button"
                            tabindex="0"
                            :aria-describedby="`feature-manager-tooltip-${feature.name}`"
                            :data-tooltip-id="`feature-manager-tooltip-${feature.name}`"
                          />
                        </span>
                      </span>
                    </pep-pharos-checkbox>
                    <pep-pharos-tooltip
                      :id="`feature-manager-tooltip-${feature.name}`"
                      placement="top"
                    >
                      {{ feature.description }}
                    </pep-pharos-tooltip>
                  </li>
                </ul>
              </pep-pharos-checkbox-group>
            </li>
          </ul>
        </div>
      </div>

      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <pep-pharos-button
        slot="footer"
        @click.prevent.stop="handleWithLog(submitEntityFormLog, handleSubmit)"
      >
        Submit
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>

<style scoped lang="scss">
.entity-manager {
  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  &__tooltip-icon {
    padding-left: var(--pharos-spacing-one-quarter-x);
    width: var(--pharos-line-height-xsmall);
    cursor: pointer;
    fill: var(--pharos-color-marble-gray-40);
  }

  &__jaip-checkbox-group {
    contain: unset;
  }
}
</style>

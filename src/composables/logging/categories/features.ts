import type { Feature } from '@/interfaces/Features'
import { LogEvent, type WorkingLog } from '@/interfaces/Log'
import type { Ref } from 'vue'
import { generics } from './generic'
import type { PaginationDirections } from '@/interfaces/Queries'

const getAddFeatureLogs = (options: { feature: Ref<Feature> }) => {
  const closeAddFeatureModalLog = (): WorkingLog => ({
    ...generics.closeModal('add_feature'),
    event_description: 'user closed add feature modal',
    action: 'close_add_feature',
    feature_name: options.feature.value.name,
  })

  const submitAddFeatureLog = (): WorkingLog => ({
    ...generics.formSubmit('add_feature'),
    event_description: 'user submitted add feature form',
    action: 'submit_add_feature',
    feature_name: options.feature.value.name,
  })

  const toggleAddFeatureAdminOnlyLog = (): WorkingLog => ({
    ...generics.checkboxToggle('admin_only'),
    event_description: 'user toggled admin only checkbox',
    action: 'toggle_admin_only',
    feature_name: options.feature.value.name,
    new_value: options.feature.value.is_admin_only,
  })

  const toggleAddFeatureProtectedLog = (): WorkingLog => ({
    ...generics.checkboxToggle('protected'),
    event_description: 'user toggled protected checkbox',
    action: 'toggle_protected',
    feature_name: options.feature.value.name,
    new_value: options.feature.value.is_protected,
  })

  return {
    closeAddFeatureModalLog,
    submitAddFeatureLog,
    toggleAddFeatureAdminOnlyLog,
    toggleAddFeatureProtectedLog,
  }
}

const getEditFeatureLogs = (options: { featureId: Feature['id']; editedFeature: Ref<Feature> }) => {
  const closeEditFeatureModalLog = (): WorkingLog => ({
    ...generics.closeModal('edit_feature'),
    event_description: 'user closed edit feature modal',
    action: 'close_edit_feature',
    feature_id: options.featureId,
  })

  const submitEditFeatureLog = (): WorkingLog => ({
    ...generics.formSubmit('edit_feature'),
    event_description: 'user submitted edit feature form',
    action: 'submit_edit_feature',
    feature_id: options.featureId,
  })

  const toggleEditFeatureAdminOnlyLog = (): WorkingLog => ({
    ...generics.checkboxToggle('admin_only'),
    event_description: 'user toggled admin only checkbox',
    action: 'toggle_admin_only',
    feature_id: options.featureId,
    new_value: options.editedFeature.value.is_admin_only,
  })

  const toggleEditFeatureProtectedLog = (): WorkingLog => ({
    ...generics.checkboxToggle('protected'),
    event_description: 'user toggled protected checkbox',
    action: 'toggle_protected',
    feature_id: options.featureId,
    new_value: options.editedFeature.value.is_protected,
  })

  return {
    closeEditFeatureModalLog,
    submitEditFeatureLog,
    toggleEditFeatureAdminOnlyLog,
    toggleEditFeatureProtectedLog,
  }
}

const getDeleteFeatureLogs = (options: { featureId: Feature['id'] }) => {
  const submitDeleteFeatureLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user confirmed delete feature',
    action: 'confirm_delete_feature',
    feature_id: options.featureId,
  })

  const closeDeleteFeatureModalLog = (): WorkingLog => ({
    ...generics.closeModal('delete_feature'),
    event_description: 'user closed delete feature modal',
    action: 'close_delete_feature_modal',
    feature_id: options.featureId,
  })

  return {
    submitDeleteFeatureLog,
    closeDeleteFeatureModalLog,
  }
}

const getReactivateFeatureLogs = (options: { featureId: Feature['id'] }) => {
  const submitReactivateFeatureLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user confirmed reactivate feature',
    action: 'confirm_reactivate_feature',
    feature_id: options.featureId,
  })

  const closeReactivateFeatureModalLog = (): WorkingLog => ({
    ...generics.closeModal('reactivate_feature'),
    event_description: 'user closed reactivate feature modal',
    action: 'close_reactivate_feature_modal',
    feature_id: options.featureId,
  })

  return {
    submitReactivateFeatureLog,
    closeReactivateFeatureModalLog,
  }
}

const getFeatureManagerLogs = (options: { isActive: Ref<boolean> }) => {
  const fetchFeaturesLog = (): WorkingLog => ({
    ...generics.formSubmit('features'),
    event_description: 'Fetched features for feature manager',
    action: 'fetch_features',
  })

  const clickFeatureSearchButtonLog = (): WorkingLog => ({
    ...fetchFeaturesLog(),
    eventtype: LogEvent.button_click,
  })

  const toggleActiveFeaturesLog = (): WorkingLog => ({
    ...generics.checkboxToggle('active_features_only'),
    event_description: 'Toggled active features only checkbox',
    action: 'toggle_active_features_only',
    new_value: options.isActive.value,
  })

  const openAddFeatureModalLog = (): WorkingLog => ({
    ...generics.openModal('add_feature'),
    event_description: 'user opened add feature modal',
    action: 'open_add_feature',
  })

  const openEditFeatureModalLog =
    (featureId: Feature['id']): (() => WorkingLog) =>
    () => ({
      ...generics.openModal('edit_feature'),
      event_description: 'user opened edit feature modal',
      action: 'open_edit_feature',
      feature_id: featureId,
    })

  const openDeleteFeatureModalLog =
    (featureId: Feature['id']): (() => WorkingLog) =>
    () => ({
      ...generics.openModal('delete_feature'),
      event_description: 'user opened delete feature modal',
      action: 'open_delete_feature',
      feature_id: featureId,
    })

  const openReactivateFeatureModalLog =
    (featureId: Feature['id']): (() => WorkingLog) =>
    () => ({
      ...generics.openModal('reactivate_feature'),
      event_description: 'user opened reactivate feature modal',
      action: 'open_reactivate_feature',
      feature_id: featureId,
    })

  const changePageLog =
    (options: { direction: PaginationDirections; newPage: number }): (() => WorkingLog) =>
    () => ({
      ...generics.changePage({
        direction: options.direction,
        results_type: 'feature',
        newPage: options.newPage,
      }),
      page: options.newPage,
    })

  return {
    fetchFeaturesLog,
    clickFeatureSearchButtonLog,
    toggleActiveFeaturesLog,
    openAddFeatureModalLog,
    openEditFeatureModalLog,
    openDeleteFeatureModalLog,
    openReactivateFeatureModalLog,
    changePageLog,
  }
}

export const featureLogs = {
  getAddFeatureLogs,
  getEditFeatureLogs,
  getDeleteFeatureLogs,
  getReactivateFeatureLogs,
  getFeatureManagerLogs,
}

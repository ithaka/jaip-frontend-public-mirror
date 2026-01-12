import type { EntityActions } from '@/interfaces/AccountManagement'
import type { Entity } from '@/interfaces/Entities'
import { LogEvent, type WorkingLog } from '@/interfaces/Log'
import type { Ref } from 'vue'
import { generics } from './generic'
import type { PaginationDirections } from '@/interfaces/Queries'

// Group Selector Logs
const getGroupSelectorLogs = (options: { groups: Ref<number[]> }) => {
  const groupSelectionLog = (): WorkingLog => ({
    ...generics.dropdownMultiselect(`group_selector`),
    values: options.groups.value,
  })

  const clearSelectionsLog = (): WorkingLog => ({
    ...generics.dropdownMultiselectClear(`group_selector`),
  })

  return { clearSelectionsLog, groupSelectionLog }
}

// Entity Card Logs
const getEntityLogs = (options: {
  group: Ref<number>
  entity_type: string
  entity_id?: number
}) => {
  const openEntityModalLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: `Opened edit modal for ${options.entity_type} ${options.entity_id}`,
    entity_id: options.entity_id,
    entity_type: options.entity_type,
    action: `open_edit_${options.entity_type}_modal`,
  })

  const groupSelectionLog =
    (group_id: number): (() => WorkingLog) =>
    (): WorkingLog => ({
      ...generics.dropdownSelect(`group_${options.entity_type}_${options.entity_id}`),
      entity_id: options.entity_id,
      entity_type: options.entity_type,
      value: options.group.value,
      group_id,
    })

  const openGroupSelectionLog = (): WorkingLog =>
    generics.dropdownOpen(`group_selection_${options.entity_type}`)

  const openModalLog = (): WorkingLog => ({
    ...generics.openModal(`remove_${options.entity_type}`),
    entity_id: options.entity_id,
    entity_type: options.entity_type,
  })

  return { openEntityModalLog, groupSelectionLog, openGroupSelectionLog, openModalLog }
}

// Entity Removal Logs
const getEntityRemovalLogs = (options: { entity_id?: number; entity_type?: string }) => {
  const submitLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: `Confirmed removing ${options.entity_type} ${options.entity_id}`,
    entity_id: options.entity_id,
    entity_type: options.entity_type,
    action: `confirm_remove_${options.entity_type}`,
  })

  const closeRemoveModalLog = (): WorkingLog => ({
    ...generics.closeModal(`remove_${options.entity_type}_${options.entity_id}`),
    entity_id: options.entity_id,
    entity_type: options.entity_type,
  })

  return { submitLog, closeRemoveModalLog }
}

// Entity Search Logs
const getEntitySearchLogs = (options: { entity_type: string; query: Ref<string> }) => {
  const addEntityLog = (): WorkingLog => generics.openModal(`get_${options.entity_type}`)
  const searchEntityLog = (): WorkingLog => ({
    ...generics.searchLog(options.entity_type),
    search_query: options.query.value,
  })

  const changePageLog =
    (options: { direction: PaginationDirections; entity_type: string; newPage: number }) =>
    (): WorkingLog =>
      generics.changePage({
        direction: options.direction,
        results_type: options.entity_type,
        newPage: options.newPage,
      })
  return { addEntityLog, changePageLog, searchEntityLog }
}

const getEntityManagerLogs = (options: { action: EntityActions; entity: Ref<Entity> }) => {
  const closeEntityModalLog = (): WorkingLog => ({
    ...generics.closeModal(
      `${options.action}_${options.entity.value.type}_modal_${options.entity.value.id}`,
    ),
    entity_id: options.entity.value.id,
    entity_type: options.entity.value.type,
  })

  const featureCheckboxToggleLog =
    (value: string | number | boolean, label: string): (() => WorkingLog) =>
    (): WorkingLog => ({
      ...generics.checkboxToggle(`${options.action}_${options.entity.value.type}`),
      entity_id: options.entity.value.id,
      entity_type: options.entity.value.type,
      value: value,
      checkbox_label: label,
    })

  const featureGroupSelectionLog = (): WorkingLog => ({
    ...generics.dropdownSelect(`${options.action}_${options.entity.value.type}_feature_group`),
    entity_id: options.entity.value.id,
    entity_type: options.entity.value.type,
  })

  const submitEntityFormLog = (): WorkingLog => ({
    ...generics.formSubmit(`${options.action}_${options.entity.value.type}`),
    entity_id: options.entity.value.id,
    entity_type: options.entity.value.type,
  })

  return {
    closeEntityModalLog,
    featureCheckboxToggleLog,
    featureGroupSelectionLog,
    submitEntityFormLog,
  }
}

export const entityLogs = {
  getEntityLogs,
  getEntityRemovalLogs,
  getEntitySearchLogs,
  getGroupSelectorLogs,
  getEntityManagerLogs,
}

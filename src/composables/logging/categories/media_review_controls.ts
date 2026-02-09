import { LogEvent, type WorkingLog } from '@/interfaces/Log'
import type { Ref } from 'vue'
import { generics } from './generic'

const getMediaApprovalLogs = (options: { groups: Ref<number[]>; doi: string }) => {
  const approvalLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user approved document',
    dois: [options.doi],
    groups: options.groups.value,
  })

  const openApproveModalLog = (): WorkingLog => ({
    ...generics.openModal('approve'),
    event_description: 'user opened approve modal',
    dois: [options.doi],
    groups: options.groups.value,
  })

  const closeApproveModalLog = (): WorkingLog => ({
    ...generics.closeModal('approve'),
    eventtype: LogEvent.button_click,
    event_description: 'user closed approve modal',
    action: 'cancel_approval',
    dois: [options.doi],
    groups: options.groups.value,
  })

  return {
    approvalLog,
    openApproveModalLog,
    closeApproveModalLog,
  }
}

const getMediaDenialLogs = (options: {
  itemid: string
  groups: Ref<number[]>
  reason: Ref<string>
  comments: Ref<string>
  is_incomplete: Ref<boolean>
}) => {
  const openDenyModalLog = (): WorkingLog => ({
    ...generics.openModal('deny'),
    event_description: 'user opened deny modal',
    action: 'open_deny',
    itemid: options.itemid,
  })

  const closeDenyModalLog = (): WorkingLog => ({
    ...generics.closeModal('deny'),
    event_description: 'user closed deny modal',
    action: 'close_deny',
    itemid: options.itemid,
  })

  const cancelDenyModalLog = (): WorkingLog => ({
    ...closeDenyModalLog(),
    eventtype: LogEvent.button_click,
    action: 'cancel_deny',
  })

  const selectedReasonLog = (): WorkingLog => ({
    eventtype: LogEvent.radio_select,
    event_description: 'user selected denial reason',
    action: 'select_deny_reason',
    itemid: options.itemid,
  })

  const submitDenialLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: `user submitted ${options.is_incomplete.value ? 'incomplete' : 'deny'}`,
    action: `submit_${options.is_incomplete.value ? 'incomplete' : 'deny'}`,
    itemid: options.itemid,
    groups: options.groups.value,
    reason: options.reason.value,
    comments: options.comments.value,
  })

  return {
    openDenyModalLog,
    closeDenyModalLog,
    cancelDenyModalLog,
    submitDenialLog,
    selectedReasonLog,
  }
}

const getMediaHistoryLogs = (options: { itemid: string; is_global: Ref<boolean> }) => {
  const openHistoryModalLog = (): WorkingLog => ({
    ...generics.openModal('history'),
    event_description: 'user opened history modal',
    action: 'open_history_modal',
    itemid: options.itemid,
    is_global: options.is_global.value,
  })

  const closeHistoryModalLog = (): WorkingLog => ({
    ...generics.closeModal('history'),
    event_description: 'user closed history modal',
    action: 'close_history_modal',
    itemid: options.itemid,
    is_global: options.is_global.value,
  })

  const readButtonLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user clicked read button',
    action: 'click_read',
    itemid: options.itemid,
    is_global: options.is_global.value,
  })

  const toggleGlobalHistoryLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user toggled history scope',
    action: 'toggle_history_scope',
    itemid: options.itemid,
    is_global: options.is_global.value,
  })

  return {
    openHistoryModalLog,
    closeHistoryModalLog,
    readButtonLog,
    toggleGlobalHistoryLog,
  }
}

const getBulkApprovalLogs = (options: {
  groups: Ref<number[]>
  journals: Ref<string[]>
  disciplines: Ref<string[]>
  dois: Ref<string[]>
}) => {
  const openBulkApprovalModalLog = (): WorkingLog => ({
    ...generics.openModal('bulk_approval'),
    event_description: 'user opened bulk approval modal',
    action: 'open_bulk_approval',
    groups: options.groups.value,
    journals: options.journals.value,
    disciplines: options.disciplines.value,
    dois: options.dois.value,
  })

  const closeBulkApprovalModalLog = (): WorkingLog => ({
    ...generics.closeModal('bulk_approval'),
    event_description: 'user closed bulk approval modal',
    action: 'cancel_bulk_approval',
    groups: options.groups.value,
    journals: options.journals.value,
    disciplines: options.disciplines.value,
    dois: options.dois.value,
  })

  const submitBulkApprovalLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user submitted bulk approval',
    action: 'submit_bulk_approval',
    groups: options.groups.value,
    journals: options.journals.value,
    disciplines: options.disciplines.value,
    dois: options.dois.value,
  })

  return {
    openBulkApprovalModalLog,
    closeBulkApprovalModalLog,
    submitBulkApprovalLog,
  }
}
const getBulkUndoLogs = (options: { itemid: string; groups: Ref<number[]> }) => {
  const openBulkUndoModalLog = (): WorkingLog => ({
    ...generics.openModal('bulk_undo'),
    event_description: 'user opened bulk undo modal',
    action: 'open_bulk_undo',
    itemid: options.itemid,
    groups: options.groups.value,
  })

  const closeBulkUndoModalLog = (): WorkingLog => ({
    ...generics.closeModal('bulk_undo'),
    event_description: 'user closed bulk undo modal',
    action: 'cancel_bulk_undo',
    itemid: options.itemid,
    groups: options.groups.value,
  })

  const submitBulkUndoLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user submitted bulk undo',
    action: 'submit_bulk_undo',
    itemid: options.itemid,
    groups: options.groups.value,
  })

  return {
    openBulkUndoModalLog,
    closeBulkUndoModalLog,
    submitBulkUndoLog,
  }
}

const getRestrictLogs = (options: { doi: string; reason: Ref<string> }) => {
  const openRestrictModalLog = (): WorkingLog => ({
    ...generics.openModal('restrict'),
    event_description: 'user opened restrict modal',
    action: 'open_restrict',
    dois: [options.doi],
  })

  const closeRestrictModalLog = (): WorkingLog => ({
    ...generics.closeModal('restrict'),
    event_description: 'user closed restrict modal',
    action: 'close_restrict',
    dois: [options.doi],
  })

  const cancelRestrictModalLog = (): WorkingLog => ({
    ...closeRestrictModalLog(),
    eventtype: LogEvent.button_click,
    action: 'cancel_restrict',
  })

  const selectedReasonLog = (): WorkingLog => ({
    eventtype: LogEvent.radio_select,
    event_description: 'user selected restrict reason',
    action: 'select_restrict_reason',
    dois: [options.doi],
  })

  const confirmRestrictLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user confirmed restrict',
    action: 'confirm_restrict',
    dois: [options.doi],
    reason: options.reason.value,
  })

  return {
    openRestrictModalLog,
    closeRestrictModalLog,
    cancelRestrictModalLog,
    selectedReasonLog,
    handleRestrictLog: confirmRestrictLog,
  }
}

const getUnrestrictLogs = (options: { doi: string }) => {
  const openUnrestrictModalLog = (): WorkingLog => ({
    ...generics.openModal('unrestrict'),
    event_description: 'user opened unrestrict modal',
    action: 'open_unrestrict',
    dois: [options.doi],
  })

  const closeUnrestrictModalLog = (): WorkingLog => ({
    ...generics.closeModal('unrestrict'),
    event_description: 'user closed unrestrict modal',
    action: 'close_unrestrict',
    dois: [options.doi],
  })

  const cancelUnrestrictModalLog = (): WorkingLog => ({
    ...closeUnrestrictModalLog(),
    eventtype: LogEvent.button_click,
    action: 'cancel_unrestrict',
  })

  const confirmUnrestrictLog = (): WorkingLog => ({
    eventtype: LogEvent.button_click,
    event_description: 'user confirmed unrestrict',
    action: 'confirm_unrestrict',
    dois: [options.doi],
  })

  return {
    openUnrestrictModalLog,
    closeUnrestrictModalLog,
    cancelUnrestrictModalLog,
    handleUnrestrictLog: confirmUnrestrictLog,
  }
}

export const mediaReviewLogs = {
  getMediaApprovalLogs,
  getMediaDenialLogs,
  getMediaHistoryLogs,
  getBulkUndoLogs,
  getBulkApprovalLogs,
  getRestrictLogs,
  getUnrestrictLogs,
}

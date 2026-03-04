import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'
import type { Collections } from '@/interfaces/Collections'

const getAccessButtonLogs = (options: {
  iid?: string
  filename?: string
  collection?: Collections
}) => {
  const printButtonClickLog = (): WorkingLog => ({
    ...generics.buttonClick('print_button'),
    event_description: 'Clicked print button',
    itemid: options.iid,
    filename: options.filename,
    collection: options.collection,
  })

  const downloadButtonClickLog = (): WorkingLog => ({
    ...generics.buttonClick('download_button'),
    event_description: 'Clicked download button',
    itemid: options.iid,
    filename: options.filename,
    collection: options.collection,
  })

  return {
    printButtonClickLog,
    downloadButtonClickLog,
  }
}

export const accessLogs = {
  getAccessButtonLogs,
}

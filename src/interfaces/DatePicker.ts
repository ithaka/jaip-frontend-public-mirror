export enum DatePickerRangeDirection {
  Past = 'past',
  Future = 'future',
}

export interface DatePickerPresetRange {
  label: string
  value: Date[]
  slot: string
}

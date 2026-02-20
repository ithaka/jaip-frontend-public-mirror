export type CsvCell = string | number | null | undefined
export type CsvRow = CsvCell[]

const serializeCsvCell = (value: CsvCell) => {
  const normalized = value === null || value === undefined ? '' : String(value)
  const escaped = normalized.replace(/"/g, '""')
  return `"${escaped}"`
}

export const buildCsvContent = (header: CsvRow, rows: CsvRow[]) => {
  return [header, ...rows]
    .map((row) => row.map((cell) => serializeCsvCell(cell)).join(','))
    .join('\n')
}

export const downloadCsvFile = (fileName: string, header: CsvRow, rows: CsvRow[]) => {
  const csv = buildCsvContent(header, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface VersionData {
  version: string
  lastUpdate: string
}

export default interface VersionResponse {
  data: VersionData
  code: number
  message: string
}

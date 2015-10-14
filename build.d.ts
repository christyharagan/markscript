declare interface BuildConfig {
  databaseConnection: {
    host: string
    httpPort: number
    adminPort?: number
    configPort?: number
    user: string
    password?: string
  }
}

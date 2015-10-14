declare interface BuildConfig {
  database: {
    host: string
    httpPort: number
    adminPort?: number
    configPort?: number
    user: string
    password?: string
  }
}

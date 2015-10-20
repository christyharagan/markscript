import {DatabaseClient, createDatabaseClient} from 'marklogic'
import * as os from 'os'

export interface Runtime {
  getClient(portOrDatabase?: number | string): DatabaseClient
}

export class CoreRuntime implements Runtime {
  buildConfig: MarkScript.BuildConfig
  constructor(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig) {
    this.buildConfig = buildConfig
  }

  getClient(portOrDatabase?: number | string): DatabaseClient {
    return createDatabaseClient({
      host: this.buildConfig.databaseConnection.host || os.hostname(),
      port: (!portOrDatabase || typeof portOrDatabase === 'string') ? this.buildConfig.databaseConnection.httpPort : <number>portOrDatabase,
      user: this.buildConfig.databaseConnection.user,
      password: this.buildConfig.databaseConnection.password,
      database: (portOrDatabase && typeof portOrDatabase === 'string') ? <string>portOrDatabase : null
    })
  }
}

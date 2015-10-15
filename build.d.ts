/// <reference path="./model.d.ts" />

declare module MarkScript {
  interface Build {
    buildConfig: BuildConfig
    plugins?: any[]
    pkgDir?: string
    runtime?: RuntimeConstructor
    tasks?: { [name: string]: Task }
    buildModelPersistanceFolder?: string
  }

  type BuildModel = Model & AssetModel

  interface RuntimeConstructor {
    new (buildModel: BuildModel, buildConfig: BuildConfig, pkgDir?: string): any
  }

  interface Task {
    execute(buildModel: BuildModel, buildConfig: BuildConfig, runtime: any): Promise<any>
    description?: string
    requiresFreshModel?: boolean
  }

  enum BuildModelPersistance {
    NONE,
    NO_SOURCE,
    ALL
  }

  interface BuildConfig {
    databaseConnection: {
      host: string
      httpPort: number
      adminPort?: number
      configPort?: number
      user: string
      password?: string
    }
    model?:BuildModel
    buildModelPersistance?: BuildModelPersistance
  }
}

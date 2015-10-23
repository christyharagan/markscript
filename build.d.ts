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
    new (buildModel: BuildModel, buildConfig: BuildConfig, pkgDir?: string): Runtime
  }
  interface Runtime {
    start?():Promise<boolean>
    stop?():Promise<boolean>
  }

  interface Task {
    execute(buildModel: BuildModel, buildConfig: BuildConfig, runtime: any): Promise<any>
    description?: string
    requiresFreshModel?: boolean
  }

  interface BuildConfig {
    databaseConnection: {
      host?: string
      httpPort?: number
      adminPort?: number
      configPort?: number
      user: string
      password?: string
    }
    model?:BuildModel
    assetBaseDir?: string
  }
}

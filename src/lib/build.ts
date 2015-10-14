import * as m from './model'
import * as d from './deployer'
import * as s from 'typescript-schema'
import * as p from 'typescript-package'
import {DatabaseClient, createDatabaseClient} from 'marklogic'
import * as path from 'path'
import * as fs from 'fs'

export interface BuildModelPlugin<O, M> {
  generate(buildModel: BuildModel, options: BuildConfig & O, pkgDir?:string, typeModel?: s.KeyValue<s.reflective.Module>): BuildModel & M
  jsonify?(buildModel: M): any
  dejsonify?(jsonifiedModel: any): M
}
export type TypeModel = s.KeyValue<s.reflective.Module>
export type BuildModel = m.Model & m.AssetModel
export type Task<S extends Server> = ((buildModel: BuildModel, buildConfig: BuildConfig, server: S) => void) & { requiresFreshModel?: boolean }

export interface Server {
  getClient(portOrDatabase?: number | string): DatabaseClient
}

export interface ServerConstructor<S extends Server> {
  new (buildModel: BuildModel, buildConfig: BuildConfig, pkgDir?: string): S
}

export interface BuildConfig {
  database: {
    host: string
    httpPort: number
    adminPort?: number
    configPort?: number
    user: string
    password?: string
  }
}

export enum BuildModelPersistance {
  NONE,
  NO_SOURCE,
  ALL
}
export interface BuildOptions {
  buildConfig: BuildConfig
  pkgDir: string
  isTypeScript?: boolean
  plugins: BuildModelPlugin<any, any>[]
  server?: ServerConstructor<any>
  tasks?: Task<any>[]
  typeModel?: s.KeyValue<s.reflective.Module>
  buildModelPersistance?: BuildModelPersistance
  buildModelPersistanceFolder?: string
}

export class Build {
  options: BuildOptions

  constructor(options: BuildOptions) {
    this.options = options
  }
  runTasks(names: string | string[]) {
    let persistsModel = this.options.buildModelPersistance === BuildModelPersistance.NO_SOURCE || this.options.buildModelPersistance === BuildModelPersistance.ALL
    let persistedModelFileName: string
    if (persistsModel) {
      let dirName = path.join(this.options.pkgDir, this.options.buildModelPersistanceFolder || 'deployed')
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName)
      }
      persistedModelFileName = path.join(dirName, 'build-model.json')
    }

    let self = this
    let buildModel: BuildModel
    let server: Server

    if (!Array.isArray(names)) {
      names = [<string>names]
    }
    (<string[]>names).forEach(function(name) {
      let task = getTask(name)
      let rebuildServer = false

      if (!buildModel && !task.requiresFreshModel && persistedModelFileName && fs.existsSync(persistedModelFileName)) {
        buildModel = deserialiseBuildModel(fs.readFileSync(persistedModelFileName).toString(), self.options.plugins)
        rebuildServer = true
      } else if (!buildModel || task.requiresFreshModel) {
        let typeModel: s.KeyValue<s.reflective.Module> = self.options.typeModel
        if (!typeModel && self.options.isTypeScript) {
          let rawPackage: s.PackageFactory = p.packageAstToFactory(self.options.pkgDir)
          typeModel = rawPackage.construct(s.factoryToReflective())().modules
        }
        buildModel = generateBuildModel(self.options.buildConfig, self.options.plugins, typeModel)

        if (persistsModel) {
          fs.writeFileSync(persistedModelFileName, serialiseBuildModel(buildModel, self.options.plugins, self.options.buildModelPersistance))
        }
        rebuildServer = true
      }

      if (rebuildServer) {
        server = new self.options.server(buildModel, self.options.buildConfig, self.options.pkgDir)
      }

      task(buildModel, self.options.buildConfig, server)
    })
  }
}

function getTask(taskName: string, tasks?: Task<any>[]): Task<any> {
  if (tasks && tasks[name]) {
    return tasks[name]
  } else {
    name = name.toLowerCase()
    switch (name) {
      case 'create':
        return createTask
      case 'remove':
        return removeTask
      case 'deploy':
        return deployTask
      case 'undeploy':
        return undeployTask
    }
  }
}

function createTask(buildModel: BuildModel, buildConfig: BuildConfig, server: Server) {
  let configClient = server.getClient(buildConfig.database.configPort || 8002)
  return d.deploy(configClient, new d.StandardDeployer(), m.IF_EXISTS.clear, buildModel)
}
(<Task<any>>createTask).requiresFreshModel = true

function removeTask(buildModel: BuildModel, buildConfig: BuildConfig, server: Server) {
  let configClient = server.getClient(buildConfig.database.configPort || 8002)
  return d.undeploy(configClient, new d.StandardDeployer(), buildModel)
}

function deployTask(buildModel: BuildModel, buildConfig: BuildConfig, server: Server) {
  let adminClient = server.getClient(buildConfig.database.adminPort || 8001)
  let configClient = server.getClient(buildConfig.database.configPort || 8002)
  return d.deployAssets(adminClient, configClient, function(database) {
    return server.getClient(database)
  }, new d.StandardAssetDeployer(), buildModel, buildModel)
}
(<Task<any>>deployTask).requiresFreshModel = true

function undeployTask(buildModel: BuildModel, buildConfig: BuildConfig, server: Server) {
  let client = server.getClient(buildConfig.database.httpPort || 8000)
  return d.undeployAssets(client, new d.StandardDeployer(), this.options.database.model)
}

export class CoreServer implements Server {
  buildConfig: BuildConfig
  constructor(buildModel: BuildModel, buildConfig: BuildConfig) {
    this.buildConfig = buildConfig
  }

  getClient(portOrDatabase?: number | string): DatabaseClient {
    return createDatabaseClient({
      host: this.buildConfig.database.host,
      port: typeof portOrDatabase === 'string' ? 8000 : <number>portOrDatabase,
      user: this.buildConfig.database.user,
      password: this.buildConfig.database.password,
      database: typeof portOrDatabase === 'string' ? <string>portOrDatabase : 'Documents'
    })
  }
}

function serialiseBuildModel(buildModel: BuildModel, plugins: BuildModelPlugin<any, any>[], buildModelPersistance: BuildModelPersistance): string {
  let serialisable: any = {
    databases: buildModel.databases,
    servers: buildModel.servers,
    ruleSets: buildModel.ruleSets,
    tasks: buildModel.tasks,
    alerts: buildModel.alerts
  }
  if (buildModelPersistance === BuildModelPersistance.ALL) {
    serialisable.modules = buildModel.modules
    serialisable.extensions = buildModel.extensions
  } else {
    serialisable.modules = {}
    serialisable.extensions = {}
    Object.keys(buildModel.modules).forEach(function(name) {
      serialisable.modules[name] = { name: name, code: '' }
    })
    Object.keys(buildModel.extensions).forEach(function(name) {
      serialisable.extensions[name] = { name: name, code: '' }
    })
  }

  plugins.forEach(function(plugin) {
    if (plugin.jsonify) {
      let s = plugin.jsonify(buildModel)
      Object.keys(s).forEach(function(key) {
        serialisable[key] = s[key]
      })
    }
  })

  return JSON.stringify(serialisable)
}

function deserialiseBuildModel(buildModelString: string, plugins: BuildModelPlugin<any, any>[]): BuildModel {
  let serialisable = JSON.parse(buildModelString)
  let buildModel: BuildModel = {
    databases: serialisable.databases,
    servers: serialisable.servers,
    ruleSets: serialisable.ruleSets,
    modules: serialisable.modules,
    extensions: serialisable.extensions,
    tasks: serialisable.tasks,
    alerts: serialisable.alerts
  }

  plugins.forEach(function(plugin) {
    if (plugin.dejsonify) {
      let s = plugin.dejsonify(buildModelString)
      Object.keys(s).forEach(function(key) {
        buildModel[key] = s[key]
      })
    }
  })

  return buildModel
}

function generateBuildModel(buildConfig: BuildConfig, plugins: BuildModelPlugin<any, any>[], typeModel?: s.KeyValue<s.reflective.Module>) {
  let buildModel: BuildModel = {
    databases: {},
    servers: {},
    ruleSets: [],
    modules: {},
    extensions: {},
    tasks: {},
    alerts: {}
  }

  plugins.forEach(function(plugin) {
    buildModel = plugin.generate(buildModel, buildConfig, typeModel)
  })

  return buildModel
}

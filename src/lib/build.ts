import * as s from 'typescript-schema'
import * as p from 'typescript-package'
import {DatabaseClient} from 'marklogic'
import * as path from 'path'
import * as fs from 'fs'

export const enum BuildModelPersistance {
  NONE,
  NO_SOURCE,
  ALL
}

export interface BuildModelPlugin<C, M> {
  generate?(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig & C, pkgDir?: string, buildTypeModel?: s.KeyValue<s.reflective.Module>, runtimeTypeModel?: s.KeyValue<s.reflective.Module>, buildDir?:string): MarkScript.BuildModel & M
  jsonify?(buildModel: M, buildConfig?: MarkScript.BuildConfig & C, pkgDir?: string, typeModel?: s.KeyValue<s.reflective.Module>, assetTypeModel?: s.KeyValue<s.reflective.Module>, buildModelPersistance?: BuildModelPersistance): any
  dejsonify?(jsonifiedModel: any): M
  tasks?: { [name: string]: MarkScript.Task }
}
export type TypeModel = s.KeyValue<s.reflective.Module>

export interface BuildOptions extends MarkScript.Build {
  plugins: BuildModelPlugin<any, any>[]
  isTypeScript?: boolean
  buildTypeModel?: s.KeyValue<s.reflective.Module>
  runtimeTypeModel?: s.KeyValue<s.reflective.Module>
  buildModelPersistance?: BuildModelPersistance
}

export class Build {
  options: BuildOptions
  tasks: { [name: string]: MarkScript.Task } = {}

  constructor(options: BuildOptions) {
    let self = this
    this.options = options
    options.plugins.forEach(function(plugin) {
      if (plugin.tasks) {
        Object.keys(plugin.tasks).forEach(function(key) {
          self.tasks[key] = plugin.tasks[key]
        })
      }
    })
    if (options.tasks) {
      Object.keys(options.tasks).forEach(function(key) {
        self.tasks[key] = options.tasks[key]
      })
    }
  }

  runTasks(names: string | string[]) {
    let persistsModel = this.options.buildModelPersistance === BuildModelPersistance.NO_SOURCE || this.options.buildModelPersistance === BuildModelPersistance.ALL
    let persistedModelFileName: string
    let buildDir = path.join(this.options.pkgDir, this.options.buildModelPersistanceFolder || '.build')
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir)
    }
    if (persistsModel) {
      persistedModelFileName = path.join(buildDir, 'build-model.json')
    }

    let self = this
    let buildModel: MarkScript.BuildModel
    let server:MarkScript.Runtime

    if (!Array.isArray(names)) {
      names = [<string>names]
    }
    let i = -1
    function executeTask(): Promise<any> {
      i++
      if (i === (<string[]>names).length) {
        return Promise.resolve(true)
      }
      let name = (<string[]>names)[i]
      let task = self.tasks[name]
      if (!task) {
        throw new Error(`Task "${name}" not in list of tasks: ${Object.keys(self.tasks) }`)
      }
      let rebuildServer = false

      if (!buildModel && !task.requiresFreshModel && persistedModelFileName && fs.existsSync(persistedModelFileName)) {
        buildModel = deserialiseBuildModel(fs.readFileSync(persistedModelFileName).toString(), self.options.plugins)
        rebuildServer = true
      } else if (!buildModel || task.requiresFreshModel) {
        let buildTypeModel: s.KeyValue<s.reflective.Module> = self.options.buildTypeModel
        if (!buildTypeModel && self.options.isTypeScript) {
          let rawPackage = p.packageAstToFactory(self.options.pkgDir)
          buildTypeModel = rawPackage.construct(s.factoryToReflective())().modules
        }

        let runtimeTypeModel: s.KeyValue<s.reflective.Module> = self.options.buildTypeModel
        if (!runtimeTypeModel && self.options.isTypeScript) {
          var rawPackage = p.packageAstToFactory(self.options.buildConfig.assetBaseDir ? path.join(self.options.pkgDir, self.options.buildConfig.assetBaseDir) : self.options.pkgDir);
          runtimeTypeModel = rawPackage.construct(s.factoryToReflective())().modules
        }
        buildModel = generateBuildModel(self.options.buildConfig, self.options.plugins, self.options.pkgDir, buildTypeModel, runtimeTypeModel, buildDir)

        if (persistsModel) {
          fs.writeFileSync(persistedModelFileName, serialiseBuildModel(buildModel, self.options.plugins, self.options.buildModelPersistance))
        }
        rebuildServer = true
      }

      if (rebuildServer) {
        server = new self.options.runtime(buildModel, self.options.buildConfig, self.options.pkgDir)
      }

      let serverPromise = (server && server.start) ? server.start() : Promise.resolve(true)
      return serverPromise.then(function(){
        return task.execute(buildModel, self.options.buildConfig, server)
      }).then(executeTask)
    }
    return executeTask()
  }
}

function serialiseBuildModel(buildModel: MarkScript.BuildModel, plugins: BuildModelPlugin<any, any>[], buildModelPersistance: BuildModelPersistance): string {
  let serialisable: any = {}

  plugins.forEach(function(plugin) {
    if (plugin.jsonify) {
      let s = plugin.jsonify(buildModel)
      Object.keys(s).forEach(function(key) {
        serialisable[key] = s[key]
      })
    }
  })

  return JSON.stringify(serialisable, null, '  ')
}

function deserialiseBuildModel(buildModelString: string, plugins: BuildModelPlugin<any, any>[]): MarkScript.BuildModel {
  let serialisable = JSON.parse(buildModelString)
  let buildModel = <MarkScript.BuildModel>{}

  plugins.forEach(function(plugin) {
    if (plugin.dejsonify) {
      let s = plugin.dejsonify(serialisable)
      Object.keys(s).forEach(function(key) {
        buildModel[key] = s[key]
      })
    }
  })

  return buildModel
}

function generateBuildModel(buildConfig: MarkScript.BuildConfig, plugins: BuildModelPlugin<any, any>[], pkgDir: string, typeModel: s.KeyValue<s.reflective.Module>, assetTypeModel: s.KeyValue<s.reflective.Module>, buildDir: string) {
  let buildModel: MarkScript.BuildModel = {
    databases: {},
    servers: {},
    ruleSets: [],
    modules: {},
    extensions: {},
    tasks: {},
    alerts: {}
  }

  plugins.forEach(function(plugin) {
    buildModel = plugin.generate(buildModel, buildConfig, pkgDir, typeModel, assetTypeModel, buildDir)
  })

  return buildModel
}

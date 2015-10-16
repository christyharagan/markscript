import * as s from 'typescript-schema'
import * as p from 'typescript-package'
import {DatabaseClient} from 'marklogic'
import * as path from 'path'
import * as fs from 'fs'

export enum BuildModelPersistance {
  NONE,
  NO_SOURCE,
  ALL
}

export interface BuildModelPlugin<C, M> {
  generate?(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig & C, pkgDir?: string, typeModel?: s.KeyValue<s.reflective.Module>): MarkScript.BuildModel & M
  jsonify?(buildModel: M, buildConfig?: MarkScript.BuildConfig & C, pkgDir?: string, typeModel?: s.KeyValue<s.reflective.Module>, buildModelPersistance?: BuildModelPersistance): any
  dejsonify?(jsonifiedModel: any): M
  tasks?: { [name: string]: MarkScript.Task }
}
export type TypeModel = s.KeyValue<s.reflective.Module>

export interface BuildOptions extends MarkScript.Build {
  plugins: BuildModelPlugin<any, any>[]
  isTypeScript?: boolean
  typeModel?: s.KeyValue<s.reflective.Module>
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
    if (persistsModel) {
      let dirName = path.join(this.options.pkgDir, this.options.buildModelPersistanceFolder || 'deployed')
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName)
      }
      persistedModelFileName = path.join(dirName, 'build-model.json')
    }

    let self = this
    let buildModel: MarkScript.BuildModel
    let server

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
        let typeModel: s.KeyValue<s.reflective.Module> = self.options.typeModel
        if (!typeModel && self.options.isTypeScript) {
          let rawPackage: s.PackageFactory = p.packageAstToFactory(self.options.pkgDir)
          typeModel = rawPackage.construct(s.factoryToReflective())().modules
        }
        buildModel = generateBuildModel(self.options.buildConfig, self.options.plugins, self.options.pkgDir, typeModel)

        if (persistsModel) {
          fs.writeFileSync(persistedModelFileName, serialiseBuildModel(buildModel, self.options.plugins, self.options.buildModelPersistance))
        }
        rebuildServer = true
      }

      if (rebuildServer) {
        server = new self.options.runtime(buildModel, self.options.buildConfig, self.options.pkgDir)
      }

      return task.execute(buildModel, self.options.buildConfig, server).then(executeTask)
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

function generateBuildModel(buildConfig: MarkScript.BuildConfig, plugins: BuildModelPlugin<any, any>[], pkgDir: string, typeModel: s.KeyValue<s.reflective.Module>) {
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
    buildModel = plugin.generate(buildModel, buildConfig, pkgDir, typeModel)
  })

  return buildModel
}

// TODO: Currently, the logic doesn't work well when chaining commands together (e.g. for a redeploy)

import * as s from 'typescript-schema'
import * as p from 'typescript-package'
import * as a from 'ml-admin'
import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import * as m from './model'
import * as d from './deployer'
import * as mg from './modelGenerator'

let resolve = require('resolve')

export interface Plugin<Options> {
  generateModel(databaseModel: m.Model&m.AssetModel, pluginOptions?: Options, options?: BuildOptions)
  serialiseModel(databaseModel: m.Model&m.AssetModel, pluginOptions?: Options, options?: BuildOptions): { [modelName: string]: string }
}

export type PluginAndOptions<Options> = [Plugin<Options>, Options]

export interface BuildOptions {
  database: {
    host: string
    httpPort: number
    adminPort?: number
    configPort?: number
    user: string
    password: string
    modelObject?: Object
    model?: m.Model&m.AssetModel
    defaultTaskUser?: string

    modules?: string|string[]//|{ [fileName: string]: string }
    ruleSets?: m.RuleSetSpec[]
    tasks?: m.TaskSpec[]
    alerts?: m.AlertSpec[]
    extensions?: { [extensionName: string]: string }
  }
  middle: {
    host: string
    port: number
  }
  plugins?: { [pluginName: string]: PluginAndOptions<any> },
  pkgDir?: string,
  typeModel?: s.Map<s.Module>
}

export class Build {
  protected options: BuildOptions

  constructor(options: BuildOptions) {
    this.options = options
  }

  loadModel(dirName?: string) {
    if (!dirName && !this.options.pkgDir) {
      throw new Error('To load the database model, either a file name must be provided, or a pkg directory to read a database-model.json file from')
    }
    dirName = dirName || this.options.pkgDir
    let fileName = path.join(dirName, 'database-model.json')
    if (!fs.existsSync(fileName)) {
      throw new Error('The database model file "' + fileName + '" does not exist')
    }
    this.options.database.model = JSON.parse(fs.readFileSync(fileName).toString())
  }

  writeModel(dirName?: string) {
    this.buildModel()
    let self = this
    if (!dirName && !this.options.pkgDir) {
      throw new Error('To write the database model, either a file name must be provided, or a pkg directory to read a database-model.json file from')
    }
    dirName = dirName || path.join(this.options.pkgDir, 'deployed')

    let model: m.Model&m.AssetModel = {
      databases: {},
      servers: {},
      ruleSets: [],
      modules: {},
      extensions: {},
      tasks: {},
      alerts: {}
    }

    if (this.options.database.model.databases) {
      model.databases = this.options.database.model.databases
    }
    if (this.options.database.model.servers) {
      model.servers = this.options.database.model.servers
    }
    if (this.options.database.model.tasks) {
      model.tasks = this.options.database.model.tasks
    }
    if (this.options.database.model.alerts) {
      model.alerts = this.options.database.model.alerts
    }
    if (this.options.database.model.ruleSets) {
      model.ruleSets = this.options.database.model.ruleSets
    }
    model.contentDatabase = this.options.database.model.contentDatabase
    model.modulesDatabase = this.options.database.model.modulesDatabase
    model.securityDatabase = this.options.database.model.securityDatabase
    model.schemaDatabase = this.options.database.model.schemaDatabase
    model.triggersDatabase = this.options.database.model.triggersDatabase

    if (this.options.database.model.modules) {
      Object.keys(this.options.database.model.modules).forEach(function(name) {
        model.modules[name] = { name: name, code: '' }
      })
    }
    if (this.options.database.model.extensions) {
      Object.keys(this.options.database.model.extensions).forEach(function(name) {
        model.extensions[name] = { name: name, code: '' }
      })
    }

    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName)
    }
    fs.writeFileSync(path.join(dirName, 'database-model.json'), JSON.stringify(model, null, '  '))

    if (this.options.plugins) {
      Object.keys(this.options.plugins).forEach(function(name) {
        let [plugin, pluginOptions] = self.options.plugins[name]
        let serialisedModels = plugin.serialiseModel(self.options.database.model, pluginOptions, self.options)
        Object.keys(serialisedModels).forEach(function(modelName) {
          fs.writeFileSync(path.join(dirName, modelName + '.json'), serialisedModels[modelName])
        })
      })
    }
  }

  buildModel() {
    let self = this
    if (!this.options.database.model) {
      if (this.options.database.modelObject) {
        if (!this.options.typeModel && !this.options.pkgDir) {
          throw new Error('To build the database model, either a type model must be provided, or a package directory from which to generate one')
        }

        if (!this.options.typeModel) {
          fs.writeFileSync(path.join(this.options.pkgDir, 'type-model.json'), s.stringifyModules(s.filterRawModules((moduleName: string) => moduleName.indexOf(p.getPackageJson(this.options.pkgDir).name) === 0, p.generateRawPackage(this.options.pkgDir))))

          this.options.typeModel = s.convertRawModules(s.filterRawModules((moduleName: string) => moduleName.indexOf(p.getPackageJson(this.options.pkgDir).name) === 0, p.generateRawPackage(this.options.pkgDir)))
        }

        this.options.database.model = mg.generateModel(this.options.typeModel, this.options.database.modelObject, this.options.database.host)
        mg.generateAssetModel(this.options.typeModel, this.options.database.modelObject, this.options.database.model, this.options.database.defaultTaskUser || this.options.database.user)
      } else {
        if (!fs.existsSync(path.join(this.options.pkgDir, 'database-model.json'))) {
          throw new Error('To build, a database-model.json file is required to exist in the package directory, or a database model object provided')
        }
        this.options.database.model = JSON.parse(fs.readFileSync(path.join(this.options.pkgDir, 'database-model.json')).toString())
      }
    }
    // if (!this.options.database.modelObject) {
    //   throw new Error('To build the database model, a correctly annotated object specifing the database information must be provided')
    // }

    if (this.options.database.modules) {
      if (Array.isArray(this.options.database.modules)) {
        if (!this.options.pkgDir) {
          throw new Error('To load modules, a package directory must be specified')
        }
        mg.addModules(this.options.database.model, this.options.pkgDir, <string[]>this.options.database.modules)
      } else if (typeof this.options.database.modules === 'string') {
        if (!this.options.pkgDir) {
          throw new Error('To load modules, a package directory must be specified')
        }
        mg.addModules(this.options.database.model, this.options.pkgDir, glob.sync(<string>this.options.database.modules, { cwd: this.options.pkgDir }))
        // } else {
        //   let moduleMap = <{ [fileName: string]: string }>this.options.database.modulesToDeploy
        //   if (!this.options.database.model.modules) {
        //     this.options.database.model.modules = {}
        //   }
        //   Object.keys(moduleMap).forEach(function(name) {
        //     self.options.database.model.modules[name] = { name: name, code: moduleMap[name] }
        //   })
      }
    }
    if (this.options.database.extensions) {
      mg.addExtensions(this.options.database.model, this.options.pkgDir, this.options.database.extensions)
    }
    if (this.options.database.tasks) {
      if (!this.options.database.model.tasks) {
        this.options.database.model.tasks = {}
      }
      this.options.database.tasks.forEach(function(taskSpec) {
        self.options.database.model.tasks[taskSpec.name] = taskSpec
      })
    }
    if (this.options.database.alerts) {
      if (!this.options.database.model.alerts) {
        this.options.database.model.alerts = {}
      }
      this.options.database.alerts.forEach(function(alertSpec) {
        self.options.database.model.alerts[alertSpec.name] = alertSpec
      })
    }
    if (this.options.database.ruleSets) {
      if (!this.options.database.model.ruleSets) {
        this.options.database.model.ruleSets = []
      }
      this.options.database.ruleSets.forEach(function(ruleSetSpec) {
        self.options.database.model.ruleSets.push(ruleSetSpec)
      })
    }

    if (this.options.plugins) {
      Object.keys(this.options.plugins).forEach(function(name) {
        let [plugin, pluginOptions] = self.options.plugins[name]
        plugin.generateModel(self.options.database.model, pluginOptions, self.options)
      })
    }
  }

  createDatabase(): Promise<boolean> {
    this.buildModel()
    let configClient = getClient(this.options, this.options.database.configPort)
    return d.deploy(configClient, new d.StandardDeployer(), m.IF_EXISTS.clear, this.options.database.model)
  }

  removeDatabase(): Promise<boolean> {
    if (!this.options.database.model) {
      if (this.options.pkgDir && fs.existsSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json'))) {
        this.options.database.model = JSON.parse(fs.readFileSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json')).toString())
      } else {
        this.buildModel()
      }
    }
    return d.undeploy(getClient(this.options, this.options.database.configPort), new d.StandardDeployer(), this.options.database.model)
  }

  deployAssets(): Promise<boolean> {
    this.buildModel()
    let self = this
    return d.deployAssets(getClient(this.options, this.options.database.adminPort), getClient(this.options, this.options.database.configPort), function(database) {
      return getClient(self.options, self.options.database.httpPort, database)
    }, new d.StandardAssetDeployer(), this.options.database.model, this.options.database.model)
  }

  undeployAssets(): Promise<boolean> {
    if (!this.options.database.model) {
      if (this.options.pkgDir && fs.existsSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json'))) {
        this.options.database.model = JSON.parse(fs.readFileSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json')).toString())
      } else {
        this.buildModel()
      }
    }
    return d.undeployAssets(getClient(this.options, this.options.database.httpPort), new d.StandardDeployer(), this.options.database.model)
  }
}

function getClient(options: BuildOptions, port: number, database?: string) {
  let params: a.AdminConnectionParams = {
    host: options.database.host,
    port: port,
    user: options.database.user,
    password: options.database.password,
  }
  if (database) {
    params.database = database
  }
  return a.createAdminClient(params)
}

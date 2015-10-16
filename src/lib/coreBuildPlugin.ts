import * as s from 'typescript-schema'
import {BuildModelPlugin, BuildModelPersistance} from './build'
import {Runtime} from './coreRuntime'
import * as d from './deployer'

export const coreBuildPlugin:BuildModelPlugin<MarkScript.BuildConfig, MarkScript.BuildModel> = {
  generate: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig): MarkScript.BuildModel {
    return buildModel
  },

  jsonify: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, pkgDir?:string, typeModel?: s.KeyValue<s.reflective.Module>, buildModelPersistance?: BuildModelPersistance): any {
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
    return serialisable
  },

  dejsonify: function(serialisable:any) {
    return <MarkScript.BuildModel> {
      databases: serialisable.databases,
      servers: serialisable.servers,
      ruleSets: serialisable.ruleSets,
      modules: serialisable.modules,
      extensions: serialisable.extensions,
      tasks: serialisable.tasks,
      alerts: serialisable.alerts
    }
  },

  tasks: {
    create: {
      execute: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, server: Runtime) {
        let configClient = server.getClient(buildConfig.databaseConnection.configPort || 8002)
        return d.deploy(configClient, new d.StandardDeployer(), d.IF_EXISTS.clear, buildModel)
      },
      requiresFreshModel: true,
      description: 'Create the MarkLogic HTTP server and databases defined by the database model'
    },
    delete: {
      execute: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, server: Runtime) {
        let configClient = server.getClient(buildConfig.databaseConnection.configPort || 8002)
        return d.undeploy(configClient, new d.StandardDeployer(), buildModel)
      },
      description: 'Delete the previously created MarkLogic HTTP server and databases defined by the database model'
    },
    deploy : {
      execute: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, server: Runtime) {
        let adminClient = server.getClient(buildConfig.databaseConnection.adminPort || 8001)
        let configClient = server.getClient(buildConfig.databaseConnection.configPort || 8002)
        return d.deployAssets(adminClient, configClient, function(database) {
          return server.getClient(database)
        }, new d.StandardAssetDeployer(), buildModel, buildModel)
      },
      requiresFreshModel:true,
      description: 'Deploy the assets (modules, extensions, alerts, etc.) to the MarkLogic HTTP server and databases'
    },
    undeploy: {
      execute: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, server: Runtime) {
        let client = server.getClient(buildConfig.databaseConnection.httpPort || 8000)
        return d.undeployAssets(client, new d.StandardDeployer(), this.options.database.model)
      },
      description: 'Remove the previously deployed assets (modules, extensions, alerts, etc.) to the MarkLogic HTTP server and databases'
    },
    build: {
      execute: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, server: Runtime) {
        return coreBuildPlugin.tasks['create'].execute(buildModel, buildConfig, server).then(function(){
          return coreBuildPlugin.tasks['deploy'].execute(buildModel, buildConfig, server)
        })
      },
      description: 'Create then deploy'
    },
    redeploy: {
      execute: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, server: Runtime) {
        return coreBuildPlugin.tasks['undeploy'].execute(buildModel, buildConfig, server).then(function(){
          return coreBuildPlugin.tasks['deploy'].execute(buildModel, buildConfig, server)
        })
      },
      description: 'Undeploy then deploy'
    },
    rebuild: {
      execute: function(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig, server: Runtime) {
        return coreBuildPlugin.tasks['delete'].execute(buildModel, buildConfig, server).then(function(){
          return coreBuildPlugin.tasks['build'].execute(buildModel, buildConfig, server)
        })
      },
      description: 'Delete then build'
    }
  }
}

var m = require('./model');
var d = require('./deployer');
var s = require('typescript-schema');
var p = require('typescript-package');
var marklogic_1 = require('marklogic');
var path = require('path');
var fs = require('fs');
(function (BuildModelPersistance) {
    BuildModelPersistance[BuildModelPersistance["NONE"] = 0] = "NONE";
    BuildModelPersistance[BuildModelPersistance["NO_SOURCE"] = 1] = "NO_SOURCE";
    BuildModelPersistance[BuildModelPersistance["ALL"] = 2] = "ALL";
})(exports.BuildModelPersistance || (exports.BuildModelPersistance = {}));
var BuildModelPersistance = exports.BuildModelPersistance;
var Build = (function () {
    function Build(options) {
        this.options = options;
    }
    Build.prototype.runTasks = function (names) {
        var persistsModel = this.options.buildModelPersistance === BuildModelPersistance.NO_SOURCE || this.options.buildModelPersistance === BuildModelPersistance.ALL;
        var persistedModelFileName;
        if (persistsModel) {
            var dirName = path.join(this.options.pkgDir, this.options.buildModelPersistanceFolder || 'deployed');
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName);
            }
            persistedModelFileName = path.join(dirName, 'build-model.json');
        }
        var self = this;
        var buildModel;
        var server;
        if (!Array.isArray(names)) {
            names = [names];
        }
        names.forEach(function (name) {
            var task = getTask(name);
            var rebuildServer = false;
            if (!buildModel && !task.requiresFreshModel && persistedModelFileName && fs.existsSync(persistedModelFileName)) {
                buildModel = deserialiseBuildModel(fs.readFileSync(persistedModelFileName).toString(), self.options.plugins);
                rebuildServer = true;
            }
            else if (!buildModel || task.requiresFreshModel) {
                var typeModel = self.options.typeModel;
                if (!typeModel && self.options.isTypeScript) {
                    var rawPackage = p.packageAstToFactory(self.options.pkgDir);
                    typeModel = rawPackage.construct(s.factoryToReflective())().modules;
                }
                buildModel = generateBuildModel(self.options.buildConfig, self.options.plugins, self.options.pkgDir, typeModel);
                if (persistsModel) {
                    fs.writeFileSync(persistedModelFileName, serialiseBuildModel(buildModel, self.options.plugins, self.options.buildModelPersistance));
                }
                rebuildServer = true;
            }
            if (rebuildServer) {
                server = new self.options.server(buildModel, self.options.buildConfig, self.options.pkgDir);
            }
            task(buildModel, self.options.buildConfig, server);
        });
    };
    return Build;
})();
exports.Build = Build;
function getTask(taskName, tasks) {
    if (tasks && tasks[name]) {
        return tasks[name];
    }
    else {
        name = name.toLowerCase();
        switch (name) {
            case 'create':
                return createTask;
            case 'remove':
                return removeTask;
            case 'deploy':
                return deployTask;
            case 'undeploy':
                return undeployTask;
        }
    }
}
function createTask(buildModel, buildConfig, server) {
    var configClient = server.getClient(buildConfig.databaseConnection.configPort || 8002);
    return d.deploy(configClient, new d.StandardDeployer(), m.IF_EXISTS.clear, buildModel);
}
createTask.requiresFreshModel = true;
function removeTask(buildModel, buildConfig, server) {
    var configClient = server.getClient(buildConfig.databaseConnection.configPort || 8002);
    return d.undeploy(configClient, new d.StandardDeployer(), buildModel);
}
function deployTask(buildModel, buildConfig, server) {
    var adminClient = server.getClient(buildConfig.databaseConnection.adminPort || 8001);
    var configClient = server.getClient(buildConfig.databaseConnection.configPort || 8002);
    return d.deployAssets(adminClient, configClient, function (database) {
        return server.getClient(database);
    }, new d.StandardAssetDeployer(), buildModel, buildModel);
}
deployTask.requiresFreshModel = true;
function undeployTask(buildModel, buildConfig, server) {
    var client = server.getClient(buildConfig.databaseConnection.httpPort || 8000);
    return d.undeployAssets(client, new d.StandardDeployer(), this.options.database.model);
}
var CoreServer = (function () {
    function CoreServer(buildModel, buildConfig) {
        this.buildConfig = buildConfig;
    }
    CoreServer.prototype.getClient = function (portOrDatabase) {
        return marklogic_1.createDatabaseClient({
            host: this.buildConfig.databaseConnection.host,
            port: typeof portOrDatabase === 'string' ? 8000 : portOrDatabase,
            user: this.buildConfig.databaseConnection.user,
            password: this.buildConfig.databaseConnection.password,
            database: typeof portOrDatabase === 'string' ? portOrDatabase : 'Documents'
        });
    };
    return CoreServer;
})();
exports.CoreServer = CoreServer;
function serialiseBuildModel(buildModel, plugins, buildModelPersistance) {
    var serialisable = {
        databases: buildModel.databases,
        servers: buildModel.servers,
        ruleSets: buildModel.ruleSets,
        tasks: buildModel.tasks,
        alerts: buildModel.alerts
    };
    if (buildModelPersistance === BuildModelPersistance.ALL) {
        serialisable.modules = buildModel.modules;
        serialisable.extensions = buildModel.extensions;
    }
    else {
        serialisable.modules = {};
        serialisable.extensions = {};
        Object.keys(buildModel.modules).forEach(function (name) {
            serialisable.modules[name] = { name: name, code: '' };
        });
        Object.keys(buildModel.extensions).forEach(function (name) {
            serialisable.extensions[name] = { name: name, code: '' };
        });
    }
    plugins.forEach(function (plugin) {
        if (plugin.jsonify) {
            var s_1 = plugin.jsonify(buildModel);
            Object.keys(s_1).forEach(function (key) {
                serialisable[key] = s_1[key];
            });
        }
    });
    return JSON.stringify(serialisable);
}
function deserialiseBuildModel(buildModelString, plugins) {
    var serialisable = JSON.parse(buildModelString);
    var buildModel = {
        databases: serialisable.databases,
        servers: serialisable.servers,
        ruleSets: serialisable.ruleSets,
        modules: serialisable.modules,
        extensions: serialisable.extensions,
        tasks: serialisable.tasks,
        alerts: serialisable.alerts
    };
    plugins.forEach(function (plugin) {
        if (plugin.dejsonify) {
            var s_2 = plugin.dejsonify(buildModelString);
            Object.keys(s_2).forEach(function (key) {
                buildModel[key] = s_2[key];
            });
        }
    });
    return buildModel;
}
function generateBuildModel(buildConfig, plugins, pkgDir, typeModel) {
    var buildModel = {
        databases: {},
        servers: {},
        ruleSets: [],
        modules: {},
        extensions: {},
        tasks: {},
        alerts: {}
    };
    plugins.forEach(function (plugin) {
        buildModel = plugin.generate(buildModel, buildConfig, pkgDir, typeModel);
    });
    return buildModel;
}
//# sourceMappingURL=build.js.map
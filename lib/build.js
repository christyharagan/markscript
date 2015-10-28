var s = require('typescript-schema');
var p = require('typescript-package');
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
        this.tasks = {};
        var self = this;
        this.options = options;
        options.plugins.forEach(function (plugin) {
            if (plugin.tasks) {
                Object.keys(plugin.tasks).forEach(function (key) {
                    self.tasks[key] = plugin.tasks[key];
                });
            }
        });
        if (options.tasks) {
            Object.keys(options.tasks).forEach(function (key) {
                self.tasks[key] = options.tasks[key];
            });
        }
    }
    Build.prototype.runTasks = function (names) {
        var persistsModel = this.options.buildModelPersistance === 1 || this.options.buildModelPersistance === 2;
        var persistedModelFileName;
        var buildDir = path.join(this.options.pkgDir, this.options.buildModelPersistanceFolder || '.build');
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir);
        }
        if (persistsModel) {
            persistedModelFileName = path.join(buildDir, 'build-model.json');
        }
        var self = this;
        var buildModel;
        var server;
        if (!Array.isArray(names)) {
            names = [names];
        }
        var i = -1;
        function executeTask() {
            i++;
            if (i === names.length) {
                return Promise.resolve(true);
            }
            var name = names[i];
            var task = self.tasks[name];
            if (!task) {
                throw new Error("Task \"" + name + "\" not in list of tasks: " + Object.keys(self.tasks));
            }
            var rebuildServer = false;
            if (!buildModel && !task.requiresFreshModel && persistedModelFileName && fs.existsSync(persistedModelFileName)) {
                buildModel = deserialiseBuildModel(fs.readFileSync(persistedModelFileName).toString(), self.options.plugins);
                rebuildServer = true;
            }
            else if (!buildModel || task.requiresFreshModel) {
                var buildTypeModel = self.options.buildTypeModel;
                if (!buildTypeModel && self.options.isTypeScript) {
                    var rawPackage_1 = p.packageAstToFactory(self.options.pkgDir);
                    buildTypeModel = rawPackage_1.construct(s.factoryToReflective())().modules;
                }
                var runtimeTypeModel = self.options.buildTypeModel;
                if (!runtimeTypeModel && self.options.isTypeScript) {
                    var rawPackage = p.packageAstToFactory(self.options.buildConfig.assetBaseDir ? path.join(self.options.pkgDir, self.options.buildConfig.assetBaseDir) : self.options.pkgDir);
                    runtimeTypeModel = rawPackage.construct(s.factoryToReflective())().modules;
                }
                buildModel = generateBuildModel(self.options.buildConfig, self.options.plugins, self.options.pkgDir, buildTypeModel, runtimeTypeModel, buildDir);
                if (persistsModel) {
                    fs.writeFileSync(persistedModelFileName, serialiseBuildModel(buildModel, self.options.plugins, self.options.buildModelPersistance));
                }
                rebuildServer = true;
            }
            if (rebuildServer) {
                server = new self.options.runtime(buildModel, self.options.buildConfig, self.options.pkgDir);
            }
            var serverPromise = (server && server.start) ? server.start() : Promise.resolve(true);
            return serverPromise.then(function () {
                return task.execute(buildModel, self.options.buildConfig, server);
            }).then(executeTask);
        }
        return executeTask();
    };
    return Build;
})();
exports.Build = Build;
function serialiseBuildModel(buildModel, plugins, buildModelPersistance) {
    var serialisable = {};
    plugins.forEach(function (plugin) {
        if (plugin.jsonify) {
            var s_1 = plugin.jsonify(buildModel);
            Object.keys(s_1).forEach(function (key) {
                serialisable[key] = s_1[key];
            });
        }
    });
    return JSON.stringify(serialisable, null, '  ');
}
function deserialiseBuildModel(buildModelString, plugins) {
    var serialisable = JSON.parse(buildModelString);
    var buildModel = {};
    plugins.forEach(function (plugin) {
        if (plugin.dejsonify) {
            var s_2 = plugin.dejsonify(serialisable);
            Object.keys(s_2).forEach(function (key) {
                buildModel[key] = s_2[key];
            });
        }
    });
    return buildModel;
}
function generateBuildModel(buildConfig, plugins, pkgDir, typeModel, assetTypeModel, buildDir) {
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
        buildModel = plugin.generate(buildModel, buildConfig, pkgDir, typeModel, assetTypeModel, buildDir);
    });
    return buildModel;
}
//# sourceMappingURL=build.js.map
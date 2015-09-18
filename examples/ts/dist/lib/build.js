// TODO: Currently, the logic doesn't work well when chaining commands together (e.g. for a redeploy)
var s = require('typescript-schema');
var p = require('typescript-package');
var a = require('ml-admin');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var m = require('./model');
var d = require('./deployer');
var mg = require('./modelGenerator');
var resolve = require('resolve');
var Build = (function () {
    function Build(options) {
        this.options = options;
    }
    Build.prototype.loadModel = function (dirName) {
        if (!dirName && !this.options.pkgDir) {
            throw new Error('To load the database model, either a file name must be provided, or a pkg directory to read a database-model.json file from');
        }
        dirName = dirName || this.options.pkgDir;
        var fileName = path.join(dirName, 'database-model.json');
        if (!fs.existsSync(fileName)) {
            throw new Error('The database model file "' + fileName + '" does not exist');
        }
        this.options.database.model = JSON.parse(fs.readFileSync(fileName).toString());
    };
    Build.prototype.writeModel = function (dirName) {
        this.buildModel();
        var self = this;
        if (!dirName && !this.options.pkgDir) {
            throw new Error('To write the database model, either a file name must be provided, or a pkg directory to read a database-model.json file from');
        }
        dirName = dirName || path.join(this.options.pkgDir, 'deployed');
        var model = {
            databases: {},
            servers: {},
            ruleSets: [],
            modules: {},
            extensions: {},
            tasks: {},
            alerts: {}
        };
        model.databases = this.options.database.model.databases;
        model.servers = this.options.database.model.servers;
        model.tasks = this.options.database.model.tasks;
        model.alerts = this.options.database.model.alerts;
        model.ruleSets = this.options.database.model.ruleSets;
        model.contentDatabase = this.options.database.model.contentDatabase;
        model.modulesDatabase = this.options.database.model.modulesDatabase;
        model.securityDatabase = this.options.database.model.securityDatabase;
        model.schemaDatabase = this.options.database.model.schemaDatabase;
        model.triggersDatabase = this.options.database.model.triggersDatabase;
        Object.keys(this.options.database.model.modules).forEach(function (name) {
            model.modules[name] = { name: name, code: '' };
        });
        Object.keys(this.options.database.model.extensions).forEach(function (name) {
            model.extensions[name] = { name: name, code: '' };
        });
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
        fs.writeFileSync(path.join(dirName, 'database-model.json'), JSON.stringify(model, null, '  '));
        if (this.options.plugins) {
            Object.keys(this.options.plugins).forEach(function (name) {
                var _a = self.options.plugins[name], plugin = _a[0], pluginOptions = _a[1];
                var serialisedModels = plugin.serialiseModel(self.options.database.model, pluginOptions, self.options);
                Object.keys(serialisedModels).forEach(function (modelName) {
                    fs.writeFileSync(path.join(dirName, modelName + '.json'), serialisedModels[modelName]);
                });
            });
        }
    };
    Build.prototype.buildModel = function () {
        var _this = this;
        var self = this;
        if (!this.options.database.model) {
            if (this.options.database.modelObject) {
                if (!this.options.typeModel && !this.options.pkgDir) {
                    throw new Error('To build the database model, either a type model must be provided, or a package directory from which to generate one');
                }
                if (!this.options.typeModel) {
                    fs.writeFileSync(path.join(this.options.pkgDir, 'type-model.json'), s.stringifyModules(s.filterRawModules(function (moduleName) { return moduleName.indexOf(p.getPackageJson(_this.options.pkgDir).name) === 0; }, p.generateRawPackage(this.options.pkgDir))));
                    this.options.typeModel = s.convertRawModules(s.filterRawModules(function (moduleName) { return moduleName.indexOf(p.getPackageJson(_this.options.pkgDir).name) === 0; }, p.generateRawPackage(this.options.pkgDir)));
                }
                this.options.database.model = mg.generateModel(this.options.typeModel, this.options.database.modelObject, this.options.database.host);
                mg.generateAssetModel(this.options.typeModel, this.options.database.modelObject, this.options.database.model, this.options.database.defaultTaskUser || this.options.database.user);
            }
            else {
                if (!fs.existsSync(path.join(this.options.pkgDir, 'database-model.json'))) {
                    throw new Error('To build, a database-model.json file is required to exist in the package directory, or a database model object provided');
                }
                this.options.database.model = JSON.parse(fs.readFileSync(path.join(this.options.pkgDir, 'database-model.json')).toString());
            }
        }
        if (this.options.database.modules) {
            if (Array.isArray(this.options.database.modules)) {
                if (!this.options.pkgDir) {
                    throw new Error('To load modules, a package directory must be specified');
                }
                mg.addModules(this.options.database.model, this.options.pkgDir, this.options.database.modules);
            }
            else if (typeof this.options.database.modules === 'string') {
                if (!this.options.pkgDir) {
                    throw new Error('To load modules, a package directory must be specified');
                }
                mg.addModules(this.options.database.model, this.options.pkgDir, glob.sync(this.options.database.modules, { cwd: this.options.pkgDir }));
            }
        }
        if (this.options.database.extensions) {
            mg.addExtensions(this.options.database.model, this.options.pkgDir, this.options.database.extensions);
        }
        if (this.options.database.tasks) {
            if (!this.options.database.model.tasks) {
                this.options.database.model.tasks = {};
            }
            this.options.database.tasks.forEach(function (taskSpec) {
                self.options.database.model.tasks[taskSpec.name] = taskSpec;
            });
        }
        if (this.options.database.alerts) {
            if (!this.options.database.model.alerts) {
                this.options.database.model.alerts = {};
            }
            this.options.database.alerts.forEach(function (alertSpec) {
                self.options.database.model.alerts[alertSpec.name] = alertSpec;
            });
        }
        if (this.options.database.ruleSets) {
            if (!this.options.database.model.ruleSets) {
                this.options.database.model.ruleSets = [];
            }
            this.options.database.ruleSets.forEach(function (ruleSetSpec) {
                self.options.database.model.ruleSets.push(ruleSetSpec);
            });
        }
        if (this.options.plugins) {
            Object.keys(this.options.plugins).forEach(function (name) {
                var _a = self.options.plugins[name], plugin = _a[0], pluginOptions = _a[1];
                plugin.generateModel(self.options.database.model, pluginOptions, self.options);
            });
        }
    };
    Build.prototype.createDatabase = function () {
        this.buildModel();
        var configClient = getClient(this.options, this.options.database.configPort);
        return d.deploy(configClient, new d.StandardDeployer(), m.IF_EXISTS.clear, this.options.database.model);
    };
    Build.prototype.removeDatabase = function () {
        if (!this.options.database.model) {
            if (this.options.pkgDir && fs.existsSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json'))) {
                this.options.database.model = JSON.parse(fs.readFileSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json')).toString());
            }
            else {
                this.buildModel();
            }
        }
        return d.undeploy(getClient(this.options, this.options.database.configPort), new d.StandardDeployer(), this.options.database.model);
    };
    Build.prototype.deployAssets = function () {
        this.buildModel();
        var self = this;
        return d.deployAssets(getClient(this.options, this.options.database.adminPort), getClient(this.options, this.options.database.configPort), function (database) {
            return getClient(self.options, self.options.database.httpPort, database);
        }, new d.StandardAssetDeployer(), this.options.database.model, this.options.database.model);
    };
    Build.prototype.undeployAssets = function () {
        if (!this.options.database.model) {
            if (this.options.pkgDir && fs.existsSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json'))) {
                this.options.database.model = JSON.parse(fs.readFileSync(path.join(this.options.pkgDir, 'deployed', 'database-model.json')).toString());
            }
            else {
                this.buildModel();
            }
        }
        return d.undeployAssets(getClient(this.options, this.options.database.httpPort), new d.StandardDeployer(), this.options.database.model);
    };
    return Build;
})();
exports.Build = Build;
function getClient(options, port, database) {
    var params = {
        host: options.database.host,
        port: port,
        user: options.database.user,
        password: options.database.password,
    };
    if (database) {
        params.database = database;
    }
    return a.createAdminClient(params);
}
//# sourceMappingURL=build.js.map
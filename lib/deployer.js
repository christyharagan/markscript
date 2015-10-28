var v = require('./modelVisitor');
var a = require('ml-admin');
var path = require('path');
var installAlert_1 = require('./admin/alerts/installAlert');
var deleteAlert_1 = require('./admin/alerts/deleteAlert');
(function (IF_EXISTS) {
    IF_EXISTS[IF_EXISTS["recreate"] = 0] = "recreate";
    IF_EXISTS[IF_EXISTS["clear"] = 1] = "clear";
    IF_EXISTS[IF_EXISTS["ignore"] = 2] = "ignore";
    IF_EXISTS[IF_EXISTS["fail"] = 3] = "fail";
})(exports.IF_EXISTS || (exports.IF_EXISTS = {}));
var IF_EXISTS = exports.IF_EXISTS;
function deploy(client, deployer, ifExists, model) {
    var promise;
    if (model.securityDatabase) {
        promise = deployDatabase(client, deployer, ifExists, model.databases[model.securityDatabase]);
    }
    else {
        promise = Promise.resolve(true);
    }
    promise = promise.then(function (result) {
        if (result) {
            var promises = [];
            v.visitModel({
                onDatabase: function (database) {
                    if (database.name !== model.contentDatabase && database.name !== model.securityDatabase) {
                        promises.push(deployDatabase(client, deployer, ifExists, database));
                    }
                }
            }, model);
            return toPromise(promises);
        }
        else {
            return false;
        }
    });
    if (model.contentDatabase) {
        promise = promise.then(function (result) {
            if (result) {
                return deployDatabase(client, deployer, ifExists, model.databases[model.contentDatabase]);
            }
            else {
                return false;
            }
        });
    }
    return promise.then(function (result) {
        if (result) {
            var promises = [];
            v.visitModel({
                onServer: function (server) {
                    promises.push(deployer.deployServer(client, ifExists, server));
                }
            }, model);
            return toPromise(promises);
        }
        else {
            return false;
        }
    });
}
exports.deploy = deploy;
function undeploy(client, deployer, model) {
    var promises = [];
    v.visitModel({
        onServer: function (server) {
            promises.push(deployer.undeployServer(client, server));
        }
    }, model);
    return toPromise(promises).then(function (result) {
        if (result) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    var promise;
                    if (model.contentDatabase) {
                        promise = undeployDatabase(client, deployer, model.databases[model.contentDatabase]);
                    }
                    else {
                        promise = Promise.resolve(true);
                    }
                    promise = promise.then(function (result) {
                        if (result) {
                            var promises_1 = [];
                            v.visitModel({
                                onDatabase: function (database) {
                                    if (database.name !== model.contentDatabase && database.name !== model.securityDatabase) {
                                        promises_1.push(undeployDatabase(client, deployer, database));
                                    }
                                }
                            }, model);
                            return toPromise(promises_1);
                        }
                        else {
                            return false;
                        }
                    });
                    if (model.securityDatabase) {
                        promise = promise.then(function (result) {
                            if (result) {
                                return undeployDatabase(client, deployer, model.databases[model.securityDatabase]);
                            }
                            else {
                                return false;
                            }
                        });
                    }
                    promise.then(resolve, reject);
                }, 5000);
            });
        }
        else {
            return false;
        }
    });
}
exports.undeploy = undeploy;
var markscriptCode = "function createCounter(uri) {\n  xdmp.documentInsert(uri, {\n    count: 0\n  });\n}\nexports.createCounter = createCounter;\nfunction incrementCounter(uri) {\n  var counterDoc = cts.doc(uri);\n  var counter = counterDoc.root.toObject();\n  var count = counter.count + 1;\n  xdmp.nodeReplace(counterDoc, {\n      count: count\n  });\n  return count;\n}\nexports.incrementCounter = incrementCounter;\nfunction deleteAll(dir) {\n    var docs = xdmp.directory(dir);\n    while (true) {\n        var doc = docs.next();\n        if (doc.done) {\n            break;\n        }\n        else {\n            xdmp.documentDelete(doc.value.baseURI);\n        }\n    }\n}\nexports.deleteAll = deleteAll;\nfunction deleteGraph(graph) {\n    var sem = require('/MarkLogic/semantics.xqy');\n    graph = graph || 'http://marklogic.com/semantics#default-graph';\n    sem.graphDelete(sem.iri(graph));\n}\nexports.deleteGraph = deleteGraph;";
var speckleCode = "\nfunction prefix(name, prefix) {\n    var self = {\n        name: name,\n        prefix: prefix,\n        uri: function (suffix) {\n            return {\n                prefix: self,\n                curi: name + \":\" + suffix\n            };\n        }\n    };\n    return self;\n}\nexports.prefix = prefix;\nvar PrefixBuilder = (function () {\n    function PrefixBuilder() {\n        this.prefixes = {};\n    }\n    PrefixBuilder.prototype.addValue = function (value) {\n        if (value.curi) {\n            var prefix_1 = value.prefix;\n            this.prefixes[prefix_1.name] = prefix_1;\n        }\n        return this;\n    };\n    PrefixBuilder.prototype.toSparql = function (sparql) {\n        var prefixes = this.prefixes;\n        var s = '';\n        Object.keys(this.prefixes).forEach(function (name) {\n            var prefix = prefixes[name];\n            s += \"PREFIX \" + prefix.name + \": <\" + prefix.prefix + \">\\n\";\n        });\n        return s + sparql;\n    };\n    return PrefixBuilder;\n})();\nexports.PrefixBuilder = PrefixBuilder;\n\nfunction variable(name) {\n    return {\n        name: name\n    };\n}\nexports.variable = variable;\n\nfunction v(vsc) {\n    if (vsc.curi) {\n        var curi = vsc;\n        return \"\" + curi.curi;\n    }\n    else if (vsc.name) {\n        return \"?\" + vsc.name;\n    }\n    else {\n        return \"<\" + vsc + \">\";\n    }\n}\nexports.v = v;\n\nvar value_1 = {\n  v:v\n};\nvar prefix_1 = {\n  PrefixBuilder:PrefixBuilder\n};\nfunction rule(name) {\n    return _rule('', new prefix_1.PrefixBuilder(), name);\n}\nexports.rule = rule;\nfunction _rule(ruleSet, pb, name) {\n    return {\n        when: _when.bind(null, ruleSet, name, [], pb)\n    };\n}\nfunction _when(ruleSet, ruleName, ands, pb, src, pred, obj) {\n    pb.addValue(src).addValue(pred).addValue(obj);\n    ands.push([src, pred, obj]);\n    return {\n        and: _when.bind(null, ruleSet, ruleName, ands, pb),\n        then: function (src, pred, obj) {\n            pb.addValue(src).addValue(pred).addValue(obj);\n            ruleSet += \"\\nrule \\\"\" + ruleName + \"\\\" CONSTRUCT {\\n  \" + value_1.v(src) + \" \" + value_1.v(pred) + \" \" + value_1.v(obj) + \"\\n}{\";\n            for (var i = 0; i < ands.length - 1; i++) {\n                var and_1 = ands[i];\n                ruleSet += \"\\n  \" + value_1.v(and_1[0]) + \" \" + value_1.v(and_1[1]) + \" \" + value_1.v(and_1[2]) + \" .\";\n            }\n            var and = ands[ands.length - 1];\n            ruleSet += \"\\n  \" + value_1.v(and[0]) + \" \" + value_1.v(and[1]) + \" \" + value_1.v(and[2]) + \"\\n}\";\n            return {\n                toSparql: function () {\n                    return pb.toSparql(ruleSet);\n                },\n                rule: _rule.bind(null, ruleSet, pb)\n            };\n        }\n    };\n}\n\nfunction _where(variables, prefixBuilder, statements, src, pred, obj) {\n    prefixBuilder = prefixBuilder.addValue(src).addValue(pred).addValue(obj);\n    statements.push([src, pred, obj]);\n    return {\n        toSparql: function () {\n            var query = 'SELECT ';\n            variables.forEach(function (variable) {\n                query += \"?\" + variable.name + \" \";\n            });\n            query += \"WHERE {\\n\";\n            for (var i = 0; i < statements.length - 1; i++) {\n                var statement_1 = statements[i];\n                query += value_1.v(statement_1[0]) + \" \" + value_1.v(statement_1[1]) + \" \" + value_1.v(statement_1[2]) + \" .\\n\";\n            }\n            var statement = statements[statements.length - 1];\n            query += value_1.v(statement[0]) + \" \" + value_1.v(statement[1]) + \" \" + value_1.v(statement[2]) + \";\\n}\";\n            return prefixBuilder.toSparql(query);\n        },\n        and: _where.bind(null, variables, prefixBuilder, statements)\n    };\n}\nfunction select() {\n    var variables = [];\n    for (var _i = 0; _i < arguments.length; _i++) {\n        variables[_i - 0] = arguments[_i];\n    }\n    return {\n        where: _where.bind(null, variables, new prefix_1.PrefixBuilder(), [])\n    };\n}\nexports.select = select;";
var rfpCode = "function resolve(value) {\n    return new BasicPromise(value);\n}\nexports.resolve = resolve;\nfunction resolveIterator(valueIterator) {\n    return new BasicPromise(valueIterator);\n}\nexports.resolveIterator = resolveIterator;\nfunction reject(error) {\n    return new BasicPromise(null, error);\n}\nexports.reject = reject;\nvar AbstractMLService = (function () {\n    function AbstractMLService() {\n        this.observableFactory = function () {\n            return new BasicSubject();\n        };\n    }\n    return AbstractMLService;\n})();\nexports.AbstractMLService = AbstractMLService;\nvar BasicSubject = (function () {\n    function BasicSubject() {\n        this.observers = [];\n        this.index = 0;\n        this.unsubscribed = false;\n    }\n    BasicSubject.prototype.map = function (selector) {\n        var observable = new BasicSubject();\n        var self = this;\n        var onNext = observable.next;\n        var onError = observable.error;\n        var onCompleted = observable.complete;\n        this.subscribe({\n            next: function (value) {\n                onNext.call(observable, selector(value));\n            },\n            error: function (exception) {\n                onError.call(observable, exception);\n            },\n            complete: function () {\n                onCompleted.call(observable);\n            }\n        });\n        observable.next = this.next.bind(this);\n        observable.error = this.error.bind(this);\n        observable.complete = this.complete.bind(this);\n        return observable;\n    };\n    BasicSubject.prototype.next = function (value) {\n        if (!this.unsubscribed) {\n            this.observers.forEach(function (observer) {\n                observer.next(value);\n            });\n        }\n    };\n    BasicSubject.prototype.error = function (e) {\n        if (!this.unsubscribed) {\n            this.observers.forEach(function (observer) {\n                observer.error(e);\n            });\n        }\n    };\n    BasicSubject.prototype.complete = function () {\n        if (!this.unsubscribed) {\n            this.observers.forEach(function (observer) {\n                observer.complete();\n            });\n        }\n    };\n    BasicSubject.prototype.subscribe = function (observer) {\n        if (!this.unsubscribed) {\n            this.observers.push(observer);\n        }\n        var self = this;\n        return function () {\n            self.unsubscribed = true;\n            self.observers = [];\n        };\n    };\n    return BasicSubject;\n})();\nexports.BasicSubject = BasicSubject;\nvar BasicPromise = (function () {\n    function BasicPromise(value, error) {\n        if (Array.isArray(value)) {\n            value = xdmp.arrayValues(value);\n        }\n        this.value = value;\n        this.error = error;\n    }\n    BasicPromise.prototype.then = function (onfulfilled, onrejected) {\n        return this._then(onfulfilled, onrejected, true);\n    };\n    BasicPromise.prototype._then = function (onfulfilled, onrejected, convertArrays) {\n        try {\n            if (this.value !== undefined) {\n                if (onfulfilled) {\n                    var value = this.value;\n                    if (convertArrays && value instanceof ValueIterator) {\n                        value = value.toArray().map(function (obj) {\n                            if (obj.root && obj.root.toObject) {\n                                return obj.root.toObject();\n                            }\n                            else if (obj.toObject) {\n                                return obj.toObject();\n                            }\n                            else {\n                                return obj;\n                            }\n                        });\n                    }\n                    var ret = onfulfilled(value);\n                    if (ret && ret.then) {\n                        return ret;\n                    }\n                    else {\n                        return new BasicPromise(ret);\n                    }\n                }\n                else {\n                    return this;\n                }\n            }\n            else {\n                if (onrejected) {\n                    var ret = onrejected(this.error);\n                    if (ret && ret.then) {\n                        return ret;\n                    }\n                    else {\n                        return new BasicPromise(ret);\n                    }\n                }\n                else {\n                    return this;\n                }\n            }\n        }\n        catch (e) {\n            return new BasicPromise(undefined, e);\n        }\n    };\n    BasicPromise.prototype.catch = function (onrejected) {\n        if (this.error) {\n            try {\n                var ret = onrejected(this.error);\n                if (ret && ret.then) {\n                    return ret;\n                }\n                else {\n                    return new BasicPromise(ret);\n                }\n            }\n            catch (e) {\n                return new BasicPromise(undefined, e);\n            }\n        }\n        else {\n            return this;\n        }\n    };\n    return BasicPromise;\n})();\nexports.BasicPromise = BasicPromise;\nvar RemoteProxy = (function () {\n    function RemoteProxy(uri, options) {\n        this.uri = uri;\n        this.options = options || {};\n    }\n    RemoteProxy.prototype.invokeMethod = function (methodName) {\n        var args = [];\n        for (var _i = 1; _i < arguments.length; _i++) {\n            args[_i - 1] = arguments[_i];\n        }\n        var ret = xdmp.httpPost(this.uri + '-' + methodName, this.options, args).toArray();\n        var status = ret[0];\n        if (status.code === 200) {\n            var value = ret[1].toObject();\n            return resolve(value);\n        }\n        else {\n            return reject(status.message);\n        }\n    };\n    return RemoteProxy;\n})();\nexports.RemoteProxy = RemoteProxy;\nvar HttpObserver = (function () {\n    function HttpObserver(uri, options) {\n        this.uri = uri;\n        if (this.uri.indexOf('://') === -1) {\n            this.uri = 'http://' + this.uri;\n        }\n        this.options = options || {};\n    }\n    HttpObserver.prototype.next = function (value) {\n        xdmp.httpPost(this.uri, this.options, { value: value });\n    };\n    HttpObserver.prototype.error = function (exception) {\n        xdmp.httpPost(this.uri, this.options, { error: exception });\n    };\n    HttpObserver.prototype.complete = function () {\n    };\n    return HttpObserver;\n})();\nexports.HttpObserver = HttpObserver;\n";
function deployAssets(adminClient, configClient, createClient, deployer, model, assetModel) {
    var promises = [];
    if (assetModel.ruleSets) {
        var schemaClient = createClient(model.schemaDatabase);
        assetModel.ruleSets.forEach(function (ruleSet) {
            promises.push(deployer.deployRuleSet(schemaClient, ruleSet));
        });
    }
    if (!assetModel.modules) {
        assetModel.modules = {};
    }
    if (!assetModel.modules['markscript-basic']) {
        assetModel.modules['markscript-basic'] = {
            name: 'markscript-basic',
            code: markscriptCode
        };
    }
    if (!assetModel.modules['speckle']) {
        assetModel.modules['speckle'] = {
            name: 'speckle',
            code: speckleCode
        };
    }
    if (!assetModel.modules['markscript-uservices']) {
        assetModel.modules['markscript-uservices'] = {
            name: 'markscript-uservices',
            code: rfpCode
        };
    }
    var promise;
    if (assetModel.modules) {
        var modulePromises = [];
        var modulesClient = createClient(model.modulesDatabase);
        Object.keys(assetModel.modules).forEach(function (name) {
            modulePromises.push(deployer.deployModule(modulesClient, assetModel.modules[name]));
        });
        promise = toPromise(modulePromises);
    }
    else {
        promise = Promise.resolve(true);
    }
    return promise.then(function (result) {
        if (result) {
            if (assetModel.extensions) {
                var modulesClient = createClient(model.modulesDatabase);
                Object.keys(assetModel.extensions).forEach(function (name) {
                    promises.push(deployer.deployExtension(modulesClient, assetModel.extensions[name]));
                });
            }
            if (assetModel.tasks) {
                Object.keys(assetModel.tasks).forEach(function (name) {
                    promises.push(deployer.deployTask(configClient, assetModel.tasks[name], model));
                });
            }
            if (assetModel.alerts) {
                Object.keys(assetModel.alerts).forEach(function (name) {
                    promises.push(deployer.deployAlert(createClient(model.contentDatabase), assetModel.alerts[name]));
                });
            }
            return toPromise(promises);
        }
        else {
            return false;
        }
    });
}
exports.deployAssets = deployAssets;
function undeployAssets(client, deployer, model) {
    var promise;
    v.visitModel({
        onDatabase: function (database) {
            var f = function (resolve, reject) {
                client.xqueryEval('xdmp:forest-clear(xdmp:database-forests(xdmp:database("' + database.name + '")))').result(function () {
                    resolve(true);
                }, function (e) {
                    reject(e);
                });
            };
            if (promise) {
                promise = promise.then(function () {
                    return new Promise(f);
                });
            }
            else {
                promise = new Promise(f);
            }
        }
    }, model);
    return promise;
}
exports.undeployAssets = undeployAssets;
function toModuleName(name) {
    name = name.replace(/\\/g, '/');
    if (name.indexOf('.js') === name.length - 3) {
        name = name.substring(0, name.length - 3);
    }
    if (name.indexOf('.sjs') !== name.length - 4) {
        name += '.sjs';
    }
    if (name.charAt(0) === '.') {
        name = name.substring(1);
    }
    if (name.charAt(0) !== '/') {
        name = '/' + name;
    }
    return name;
}
var StandardAssetDeployer = (function () {
    function StandardAssetDeployer() {
    }
    StandardAssetDeployer.prototype.deployRuleSet = function (client, spec) {
        return new Promise(function (resolve, reject) {
            client.documents.write({
                uri: spec.path,
                content: spec.rules
            }).result(function () {
                resolve(true);
            }, reject);
        });
    };
    StandardAssetDeployer.prototype.undeployRuleSet = function (client, spec) {
        return new Promise(function (resolve, reject) {
            client.documents.remove(spec.path).result(function () {
                resolve(true);
            }, reject);
        });
    };
    StandardAssetDeployer.prototype.deployModule = function (client, spec) {
        var name = toModuleName(spec.name);
        if (!spec.code) {
            spec.code = '// EMPTY MODULE';
        }
        return new Promise(function (resolve, reject) {
            client.documents.write([{
                    uri: name,
                    content: normaliseRequires(spec.name, spec.code),
                    contentType: 'application/vnd.marklogic-javascript'
                }]).result(function () {
                resolve(true);
            }, reject);
        });
    };
    StandardAssetDeployer.prototype.undeployModule = function (client, spec) {
        return new Promise(function (resolve, reject) {
            client.documents.remove(toModuleName(spec.name)).result(function () {
                resolve(true);
            }, reject);
        });
    };
    StandardAssetDeployer.prototype.deployExtension = function (client, spec) {
        return new Promise(function (resolve, reject) {
            client.config.resources.write(spec.name, 'javascript', normaliseRequires(spec.name, spec.code)).result(function () {
                resolve(true);
            }, reject);
        });
    };
    StandardAssetDeployer.prototype.undeployExtension = function (client, spec) {
        return new Promise(function (resolve, reject) {
            client.config.resources.remove(spec.name).result(function () {
                resolve(true);
            }, reject);
        });
    };
    StandardAssetDeployer.prototype.deployAlert = function (client, spec) {
        var states;
        if (!spec.states) {
            states = ['create', 'modify'];
        }
        else {
            states = spec.states.map(function (state) {
                switch (state) {
                    case 0:
                        return 'create';
                    case 1:
                        return 'modify';
                    case 2:
                        return 'delete';
                    default:
                        throw new Error('Invalid alert state: ' + state);
                }
            });
        }
        var commit;
        if (!spec.commit || spec.commit === 0) {
            commit = 'pre';
        }
        else {
            commit = 'post';
        }
        return installAlert_1.installAlert(client, {
            alertUri: spec.name,
            alertName: spec.name,
            actionName: spec.name + 'Action',
            actionModule: toModuleName(spec.actionModule),
            triggerStates: states,
            triggerScope: spec.scope,
            triggerCommit: commit,
            triggerDepth: spec.depth
        });
    };
    StandardAssetDeployer.prototype.undeployAlert = function (client, spec) {
        return deleteAlert_1.deleteAlert(client, spec.name);
    };
    StandardAssetDeployer.prototype.deployTask = function (client, spec, model) {
        var type;
        switch (spec.type) {
            case 0:
                type = 'minutely';
                break;
            case 1:
                type = 'hourly';
                break;
            case 2:
                type = 'daily';
                break;
        }
        return a.createTask(client, {
            'task-enabled': true,
            'task-path': toModuleName(spec.module),
            'task-root': '/',
            'task-type': type,
            'task-period': spec.frequency,
            'task-database': model.contentDatabase,
            'task-modules': model.modulesDatabase,
            'task-user': spec.user
        }, 'Default');
    };
    StandardAssetDeployer.prototype.undeployTask = function (client, spec) {
        return a.deleteTask(client, toModuleName(spec.module));
    };
    return StandardAssetDeployer;
})();
exports.StandardAssetDeployer = StandardAssetDeployer;
var StandardDeployer = (function () {
    function StandardDeployer() {
    }
    StandardDeployer.prototype.deployDatabase = function (client, ifExists, database) {
        function _createDatabase() {
            var databaseConfig = {
                'database-name': database.name,
                'triggers-database': database.triggersDatabase,
                'security-database': database.securityDatabase,
                'schema-database': database.schemaDatabase
            };
            if (database.rangeIndices) {
                databaseConfig['range-path-index'] = database.rangeIndices.map(function (rangeIndex) {
                    return {
                        'path-expression': rangeIndex.path,
                        'scalar-type': rangeIndex.scalarType,
                        collation: rangeIndex.collation || (rangeIndex.scalarType === 'string' ? 'http://marklogic.com/collation/' : ''),
                        'invalid-values': rangeIndex.invalidValues || 'reject',
                        'range-value-positions': rangeIndex.rangeValuePositions || false
                    };
                });
            }
            if (database.geoIndices) {
                databaseConfig['geospatial-path-index'] = database.geoIndices.map(function (geoIndex) {
                    return {
                        'path-expression': geoIndex.path,
                        'coordinate-system': geoIndex.coordinateSystem || 'wgs84',
                        'point-format': geoIndex.pointFormat,
                        'invalid-values': geoIndex.invalidValues || 'reject',
                        'range-value-positions': geoIndex.rangeValuePositions || false
                    };
                });
            }
            if (database.triples) {
                databaseConfig['triple-index'] = true;
                databaseConfig['collection-lexicon'] = true;
            }
            if (database.defaultRulesets) {
                databaseConfig['default-ruleset'] = database.defaultRulesets.map(function (ruleSet) {
                    return { location: ruleSet };
                });
            }
            return a.createDatabase(client, databaseConfig).then(function () {
                return true;
            });
        }
        var undeploy = this.undeployDatabase;
        var clear = this.cleanDatabase;
        return a.getDatabase(client, database.name).then(function () {
            switch (ifExists) {
                case 0:
                    return undeploy(client, database).then(_createDatabase);
                case 1:
                    return clear(client, database);
                case 2:
                    return false;
                case 3:
                    throw "Database " + database.name + " already exists";
            }
        }, _createDatabase);
    };
    StandardDeployer.prototype.cleanDatabase = function (client, database) {
        return a.clearOrConfigureDatabase(client, database.name, new a.ClearDatabaseOperation());
    };
    StandardDeployer.prototype.undeployDatabase = function (client, database) {
        return a.deleteDatabase(client, database.name).then(function () {
            return true;
        });
    };
    StandardDeployer.prototype.deployForest = function (client, ifExists, forest) {
        function _createForest() {
            return a.createForest(client, {
                'forest-name': forest.name,
                host: forest.host,
                database: forest.database
            }).then(function () {
                return true;
            });
        }
        var undeploy = this.undeployForest;
        return a.getForest(client, forest.name).then(function () {
            switch (ifExists) {
                case 0:
                case 1:
                    return undeploy(client, forest).then(_createForest);
                case 2:
                    return false;
                case 3:
                    throw "Forest " + forest.name + " already exists";
            }
        }, _createForest);
    };
    StandardDeployer.prototype.undeployForest = function (client, forest) {
        return a.deleteForest(client, forest.name).then(function () {
            return true;
        });
    };
    StandardDeployer.prototype.deployServer = function (client, ifExists, server) {
        function _createServer() {
            return a.createAppServer(client, {
                'server-name': server.name,
                'server-type': 'http',
                root: '/',
                port: server.port,
                'content-database': server.contentDatabase,
                'modules-database': server.modulesDatabase,
                'group-name': server.group,
                'log-errors': true,
                'default-error-format': 'json',
                'error-handler': '/MarkLogic/rest-api/error-handler.xqy',
                'url-rewriter': '/MarkLogic/rest-api/rewriter.xml',
                'rewrite-resolves-globally': true
            }).then(function () {
                return true;
            });
        }
        var undeploy = this.undeployServer;
        return a.getAppServer(client, server.name).then(function () {
            switch (ifExists) {
                case 0:
                case 1:
                    return undeploy(client, server).then(_createServer);
                case 2:
                    return false;
                case 3:
                    throw "Server " + server.name + " already exists";
            }
        }, _createServer);
    };
    StandardDeployer.prototype.undeployServer = function (client, server) {
        return a.deleteAppServer(client, server.name, server.group).then(function () {
            return true;
        });
    };
    return StandardDeployer;
})();
exports.StandardDeployer = StandardDeployer;
function toPromise(promises) {
    return Promise.all(promises).then(function (results) {
        for (var i = 0; i < results.length; i++) {
            if (!results[i]) {
                return false;
            }
        }
        return true;
    });
}
function deployDatabase(client, deployer, ifExists, database) {
    return deployer.deployDatabase(client, ifExists, database).then(function () {
        var promises = [];
        database.forests.forEach(function (forest) {
            promises.push(deployer.deployForest(client, ifExists, forest));
        });
        return toPromise(promises);
    });
}
function undeployDatabase(client, deployer, database) {
    return deployer.undeployDatabase(client, database).then(function (result) {
        if (result) {
            var promises = [];
            database.forests.forEach(function (forest) {
                promises.push(deployer.undeployForest(client, forest));
            });
            return toPromise(promises);
        }
        else {
            return false;
        }
    });
}
function normaliseRequires(refModuleName, source) {
    source = source.replace(/require[ \t]*\([ |\t]*['"]([\w./-]+)['"][ \t]*\)/g, function (f, v) {
        if (v.charAt(0) === '.') {
            v = path.posix.join(path.posix.dirname(refModuleName), v);
        }
        if (v.charAt(0) !== '/') {
            v = '/' + v;
        }
        return 'require("' + v + '")';
    });
    return source;
}
//# sourceMappingURL=deployer.js.map
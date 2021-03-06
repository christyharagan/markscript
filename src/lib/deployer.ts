import * as v from './modelVisitor'
import {DatabaseClient} from 'marklogic'
import * as a from 'ml-admin'
import * as path from 'path'
import {installAlert} from './admin/alerts/installAlert'
import {deleteAlert} from './admin/alerts/deleteAlert'

export const enum IF_EXISTS {
  recreate = 0,
  clear = 1,
  ignore = 2,
  fail = 3,
}

export interface Deployer {
  deployDatabase(client: DatabaseClient, ifExists: IF_EXISTS, database: MarkScript.DatabaseSpec): Promise<boolean>
  undeployDatabase(client: DatabaseClient, database: MarkScript.DatabaseSpec): Promise<boolean>

  deployForest(client: DatabaseClient, ifExists: IF_EXISTS, forest: MarkScript.ForestSpec): Promise<boolean>
  undeployForest(client: DatabaseClient, forest: MarkScript.ForestSpec): Promise<boolean>

  deployServer(client: DatabaseClient, ifExists: IF_EXISTS, server: MarkScript.ServerSpec): Promise<boolean>
  undeployServer(client: DatabaseClient, server: MarkScript.ServerSpec): Promise<boolean>
}

export interface AssetDeployer {
  deployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean>
  undeployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean>

  deployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean>
  undeployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean>

  deployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean>
  undeployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean>

  deployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean>
  undeployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean>

  deployTask(client: DatabaseClient, spec: MarkScript.TaskSpec, model: MarkScript.Model): Promise<boolean>
  undeployTask(client: DatabaseClient, spec: MarkScript.TaskSpec, model: MarkScript.Model): Promise<boolean>
}

export function deploy(client: DatabaseClient, deployer: Deployer, ifExists: IF_EXISTS, model: MarkScript.Model): Promise<boolean> {
  let promise: Promise<boolean>
  if (model.securityDatabase) {
    promise = deployDatabase(client, deployer, ifExists, model.databases[model.securityDatabase])
  } else {
    promise = Promise.resolve(true)
  }
  promise = promise.then(function(result) {
    if (result) {
      let promises: Promise<boolean>[] = []
      v.visitModel({
        onDatabase: function(database: MarkScript.DatabaseSpec): void {
          if (database.name !== model.contentDatabase && database.name !== model.securityDatabase) {
            promises.push(deployDatabase(client, deployer, ifExists, database))
          }
        }
      }, model)
      return toPromise(promises)
    } else {
      return false
    }
  })
  if (model.contentDatabase) {
    promise = promise.then(function(result) {
      if (result) {
        return deployDatabase(client, deployer, ifExists, model.databases[model.contentDatabase])
      } else {
        return false
      }
    })
  }

  return promise.then(function(result) {
    if (result) {
      let promises: Promise<boolean>[] = []
      v.visitModel({
        onServer: function(server) {
          promises.push(deployer.deployServer(client, ifExists, server))
        }
      }, model)
      return toPromise(promises)
    } else {
      return false
    }
  })
}

export function undeploy(client: DatabaseClient, deployer: Deployer, model: MarkScript.Model): Promise<boolean> {
  let promises: Promise<boolean>[] = []

  v.visitModel({
    onServer: function(server) {
      promises.push(deployer.undeployServer(client, server))
    }
  }, model)

  return toPromise(promises).then(function(result) {
    if (result) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          let promise: Promise<boolean>
          if (model.contentDatabase) {
            promise = undeployDatabase(client, deployer, model.databases[model.contentDatabase])
          } else {
            promise = Promise.resolve(true)
          }
          promise = promise.then(function(result) {
            if (result) {
              let promises: Promise<boolean>[] = []
              v.visitModel({
                onDatabase: function(database: MarkScript.DatabaseSpec): void {
                  if (database.name !== model.contentDatabase && database.name !== model.securityDatabase) {
                    promises.push(undeployDatabase(client, deployer, database))
                  }
                }
              }, model)
              return toPromise(promises)
            } else {
              return false
            }
          })
          if (model.securityDatabase) {
            promise = promise.then(function(result) {
              if (result) {
                return undeployDatabase(client, deployer, model.databases[model.securityDatabase])
              } else {
                return false
              }
            })
          }

          promise.then(resolve, reject)
        }, 5000)
      })
    } else {
      return false
    }
  })
}

// Unfortunate temporary hack: TODO: Do this properly
let markscriptCode = `function createCounter(uri) {
  xdmp.documentInsert(uri, {
    count: 0
  });
}
exports.createCounter = createCounter;
function incrementCounter(uri) {
  var counterDoc = cts.doc(uri);
  var counter = counterDoc.root.toObject();
  var count = counter.count + 1;
  xdmp.nodeReplace(counterDoc, {
      count: count
  });
  return count;
}
exports.incrementCounter = incrementCounter;
function deleteAll(dir) {
    var docs = xdmp.directory(dir);
    while (true) {
        var doc = docs.next();
        if (doc.done) {
            break;
        }
        else {
            xdmp.documentDelete(doc.value.baseURI);
        }
    }
}
exports.deleteAll = deleteAll;
function deleteGraph(graph) {
    var sem = require('/MarkLogic/semantics.xqy');
    graph = graph || 'http://marklogic.com/semantics#default-graph';
    sem.graphDelete(sem.iri(graph));
}
exports.deleteGraph = deleteGraph;`

let speckleCode = `
function prefix(name, prefix) {
    var self = {
        name: name,
        prefix: prefix,
        uri: function (suffix) {
            return {
                prefix: self,
                curi: name + ":" + suffix
            };
        }
    };
    return self;
}
exports.prefix = prefix;
var PrefixBuilder = (function () {
    function PrefixBuilder() {
        this.prefixes = {};
    }
    PrefixBuilder.prototype.addValue = function (value) {
        if (value.curi) {
            var prefix_1 = value.prefix;
            this.prefixes[prefix_1.name] = prefix_1;
        }
        return this;
    };
    PrefixBuilder.prototype.toSparql = function (sparql) {
        var prefixes = this.prefixes;
        var s = '';
        Object.keys(this.prefixes).forEach(function (name) {
            var prefix = prefixes[name];
            s += "PREFIX " + prefix.name + ": <" + prefix.prefix + ">\\n";
        });
        return s + sparql;
    };
    return PrefixBuilder;
})();
exports.PrefixBuilder = PrefixBuilder;

function variable(name) {
    return {
        name: name
    };
}
exports.variable = variable;

function v(vsc) {
    if (vsc.curi) {
        var curi = vsc;
        return "" + curi.curi;
    }
    else if (vsc.name) {
        return "?" + vsc.name;
    }
    else {
        return "<" + vsc + ">";
    }
}
exports.v = v;

var value_1 = {
  v:v
};
var prefix_1 = {
  PrefixBuilder:PrefixBuilder
};
function rule(name) {
    return _rule('', new prefix_1.PrefixBuilder(), name);
}
exports.rule = rule;
function _rule(ruleSet, pb, name) {
    return {
        when: _when.bind(null, ruleSet, name, [], pb)
    };
}
function _when(ruleSet, ruleName, ands, pb, src, pred, obj) {
    pb.addValue(src).addValue(pred).addValue(obj);
    ands.push([src, pred, obj]);
    return {
        and: _when.bind(null, ruleSet, ruleName, ands, pb),
        then: function (src, pred, obj) {
            pb.addValue(src).addValue(pred).addValue(obj);
            ruleSet += "\\nrule \\"" + ruleName + "\\" CONSTRUCT {\\n  " + value_1.v(src) + " " + value_1.v(pred) + " " + value_1.v(obj) + "\\n}{";
            for (var i = 0; i < ands.length - 1; i++) {
                var and_1 = ands[i];
                ruleSet += "\\n  " + value_1.v(and_1[0]) + " " + value_1.v(and_1[1]) + " " + value_1.v(and_1[2]) + " .";
            }
            var and = ands[ands.length - 1];
            ruleSet += "\\n  " + value_1.v(and[0]) + " " + value_1.v(and[1]) + " " + value_1.v(and[2]) + "\\n}";
            return {
                toSparql: function () {
                    return pb.toSparql(ruleSet);
                },
                rule: _rule.bind(null, ruleSet, pb)
            };
        }
    };
}

function _where(variables, prefixBuilder, statements, src, pred, obj) {
    prefixBuilder = prefixBuilder.addValue(src).addValue(pred).addValue(obj);
    statements.push([src, pred, obj]);
    return {
        toSparql: function () {
            var query = 'SELECT ';
            variables.forEach(function (variable) {
                query += "?" + variable.name + " ";
            });
            query += "WHERE {\\n";
            for (var i = 0; i < statements.length - 1; i++) {
                var statement_1 = statements[i];
                query += value_1.v(statement_1[0]) + " " + value_1.v(statement_1[1]) + " " + value_1.v(statement_1[2]) + " .\\n";
            }
            var statement = statements[statements.length - 1];
            query += value_1.v(statement[0]) + " " + value_1.v(statement[1]) + " " + value_1.v(statement[2]) + ";\\n}";
            return prefixBuilder.toSparql(query);
        },
        and: _where.bind(null, variables, prefixBuilder, statements)
    };
}
function select() {
    var variables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        variables[_i - 0] = arguments[_i];
    }
    return {
        where: _where.bind(null, variables, new prefix_1.PrefixBuilder(), [])
    };
}
exports.select = select;`

let rfpCode = `function resolve(value) {
    return new BasicPromise(value);
}
exports.resolve = resolve;
function resolveIterator(valueIterator) {
    return new BasicPromise(valueIterator);
}
exports.resolveIterator = resolveIterator;
function reject(error) {
    return new BasicPromise(null, error);
}
exports.reject = reject;
var AbstractMLService = (function () {
    function AbstractMLService() {
        this.observableFactory = function () {
            return new BasicSubject();
        };
    }
    return AbstractMLService;
})();
exports.AbstractMLService = AbstractMLService;
var BasicSubject = (function () {
    function BasicSubject() {
        this.observers = [];
        this.index = 0;
        this.unsubscribed = false;
    }
    BasicSubject.prototype.map = function (selector) {
        var observable = new BasicSubject();
        var self = this;
        var onNext = observable.next;
        var onError = observable.error;
        var onCompleted = observable.complete;
        this.subscribe({
            next: function (value) {
                onNext.call(observable, selector(value));
            },
            error: function (exception) {
                onError.call(observable, exception);
            },
            complete: function () {
                onCompleted.call(observable);
            }
        });
        observable.next = this.next.bind(this);
        observable.error = this.error.bind(this);
        observable.complete = this.complete.bind(this);
        return observable;
    };
    BasicSubject.prototype.next = function (value) {
        if (!this.unsubscribed) {
            this.observers.forEach(function (observer) {
                observer.next(value);
            });
        }
    };
    BasicSubject.prototype.error = function (e) {
        if (!this.unsubscribed) {
            this.observers.forEach(function (observer) {
                observer.error(e);
            });
        }
    };
    BasicSubject.prototype.complete = function () {
        if (!this.unsubscribed) {
            this.observers.forEach(function (observer) {
                observer.complete();
            });
        }
    };
    BasicSubject.prototype.subscribe = function (observer) {
        if (!this.unsubscribed) {
            this.observers.push(observer);
        }
        var self = this;
        return function () {
            self.unsubscribed = true;
            self.observers = [];
        };
    };
    return BasicSubject;
})();
exports.BasicSubject = BasicSubject;
var BasicPromise = (function () {
    function BasicPromise(value, error) {
        if (Array.isArray(value)) {
            value = xdmp.arrayValues(value);
        }
        this.value = value;
        this.error = error;
    }
    BasicPromise.prototype.then = function (onfulfilled, onrejected) {
        return this._then(onfulfilled, onrejected, true);
    };
    BasicPromise.prototype._then = function (onfulfilled, onrejected, convertArrays) {
        try {
            if (this.value !== undefined) {
                if (onfulfilled) {
                    var value = this.value;
                    if (convertArrays && value instanceof ValueIterator) {
                        value = value.toArray().map(function (obj) {
                            if (obj.root && obj.root.toObject) {
                                return obj.root.toObject();
                            }
                            else if (obj.toObject) {
                                return obj.toObject();
                            }
                            else {
                                return obj;
                            }
                        });
                    }
                    var ret = onfulfilled(value);
                    if (ret && ret.then) {
                        return ret;
                    }
                    else {
                        return new BasicPromise(ret);
                    }
                }
                else {
                    return this;
                }
            }
            else {
                if (onrejected) {
                    var ret = onrejected(this.error);
                    if (ret && ret.then) {
                        return ret;
                    }
                    else {
                        return new BasicPromise(ret);
                    }
                }
                else {
                    return this;
                }
            }
        }
        catch (e) {
            return new BasicPromise(undefined, e);
        }
    };
    BasicPromise.prototype.catch = function (onrejected) {
        if (this.error) {
            try {
                var ret = onrejected(this.error);
                if (ret && ret.then) {
                    return ret;
                }
                else {
                    return new BasicPromise(ret);
                }
            }
            catch (e) {
                return new BasicPromise(undefined, e);
            }
        }
        else {
            return this;
        }
    };
    return BasicPromise;
})();
exports.BasicPromise = BasicPromise;
var RemoteProxy = (function () {
    function RemoteProxy(uri, options) {
        this.uri = uri;
        this.options = options || {};
    }
    RemoteProxy.prototype.invokeMethod = function (methodName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var ret = xdmp.httpPost(this.uri + '-' + methodName, this.options, args).toArray();
        var status = ret[0];
        if (status.code === 200) {
            var value = ret[1].toObject();
            return resolve(value);
        }
        else {
            return reject(status.message);
        }
    };
    return RemoteProxy;
})();
exports.RemoteProxy = RemoteProxy;
var HttpObserver = (function () {
    function HttpObserver(uri, options) {
        this.uri = uri;
        if (this.uri.indexOf('://') === -1) {
            this.uri = 'http://' + this.uri;
        }
        this.options = options || {};
    }
    HttpObserver.prototype.next = function (value) {
        xdmp.httpPost(this.uri, this.options, { value: value });
    };
    HttpObserver.prototype.error = function (exception) {
        xdmp.httpPost(this.uri, this.options, { error: exception });
    };
    HttpObserver.prototype.complete = function () {
    };
    return HttpObserver;
})();
exports.HttpObserver = HttpObserver;
`

export function deployAssets(adminClient: DatabaseClient, configClient: DatabaseClient, createClient: (database: string) => DatabaseClient, deployer: AssetDeployer, model: MarkScript.Model, assetModel: MarkScript.AssetModel): Promise<boolean> {
  let promises: Promise<boolean>[] = []

  if (assetModel.ruleSets) {
    let schemaClient = createClient(model.schemaDatabase)
    assetModel.ruleSets.forEach(function(ruleSet) {
      promises.push(deployer.deployRuleSet(schemaClient, ruleSet))
    })
  }
  // TODO: Remove this temporary hack
  if (!assetModel.modules) {
    assetModel.modules = {}
  }
  if (!assetModel.modules['markscript-basic']) {
    assetModel.modules['markscript-basic'] = {
      name: 'markscript-basic',
      code: markscriptCode
    }
  }
  if (!assetModel.modules['speckle']) {
    assetModel.modules['speckle'] = {
      name: 'speckle',
      code: speckleCode
    }
  }
  if (!assetModel.modules['markscript-uservices']) {
    assetModel.modules['markscript-uservices'] = {
      name: 'markscript-uservices',
      code: rfpCode
    }
  }
  let promise: Promise<boolean>
  if (assetModel.modules) {
    let modulePromises: Promise<boolean>[] = []
    let modulesClient = createClient(model.modulesDatabase)
    Object.keys(assetModel.modules).forEach(function(name) {
      modulePromises.push(deployer.deployModule(modulesClient, assetModel.modules[name]))
    })
    promise = toPromise(modulePromises)
  } else {
    promise = Promise.resolve(true)
  }

  return promise.then(function(result) {
    if (result) {
      if (assetModel.extensions) {
        let modulesClient = createClient(model.modulesDatabase)
        Object.keys(assetModel.extensions).forEach(function(name) {
          promises.push(deployer.deployExtension(modulesClient, assetModel.extensions[name]))
        })
      }
      if (assetModel.tasks) {
        Object.keys(assetModel.tasks).forEach(function(name) {
          promises.push(deployer.deployTask(configClient, assetModel.tasks[name], model))
        })
      }
      if (assetModel.alerts) {
        Object.keys(assetModel.alerts).forEach(function(name) {
          promises.push(deployer.deployAlert(createClient(model.contentDatabase), assetModel.alerts[name]))
        })
      }
      return toPromise(promises)
    } else {
      return false
    }
  })
}

export function undeployAssets(client: DatabaseClient, deployer: Deployer, model: MarkScript.Model): Promise<boolean> {
  let promise: Promise<boolean>

  v.visitModel({
    onDatabase: function(database: MarkScript.DatabaseSpec): void {
      let f = function(resolve, reject) {
        client.xqueryEval('xdmp:forest-clear(xdmp:database-forests(xdmp:database("' + database.name + '")))').result(function() {
          resolve(true)
        }, function(e) {
          reject(e)
        })
      }

      if (promise) {
        promise = promise.then(function() {
          return new Promise(f)
        })
      } else {
        promise = new Promise(f)
      }
    }
  }, model)

  return promise
}

function toModuleName(name: string) {
  name = name.replace(/\\/g, '/')
  if (name.indexOf('.js') === name.length - 3) {
    name = name.substring(0, name.length - 3)
  }
  if (name.indexOf('.sjs') !== name.length - 4) {
    name += '.sjs'
  }
  if (name.charAt(0) === '.') {
    name = name.substring(1)
  }
  if (name.charAt(0) !== '/') {
    name = '/' + name
  }
  return name
}

export class StandardAssetDeployer implements AssetDeployer {
  deployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean> {
    return new Promise(function(resolve, reject) {
      client.documents.write({
        uri: spec.path,
        content: spec.rules
      }).result(function() {
        resolve(true)
      }, reject)
    })
  }
  undeployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean> {
    return new Promise(function(resolve, reject) {
      client.documents.remove(spec.path).result(function() {
        resolve(true)
      }, reject)
    })
  }

  deployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean> {
    let name = toModuleName(spec.name)
    if (!spec.code) {
      spec.code = '// EMPTY MODULE'
    }
    return new Promise(function(resolve, reject) {
      client.documents.write([{
        uri: name,
        content: normaliseRequires(spec.name, spec.code),
        contentType: 'application/vnd.marklogic-javascript'
      }]).result(function() {
        resolve(true)
      }, reject)
    })
  }
  undeployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean> {
    return new Promise(function(resolve, reject) {
      client.documents.remove(toModuleName(spec.name)).result(function() {
        resolve(true)
      }, reject)
    })
  }

  deployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean> {
    return new Promise(function(resolve, reject) {
      client.config.resources.write(spec.name, 'javascript', normaliseRequires(spec.name, spec.code)).result(function() {
        resolve(true)
      }, reject)
    })
  }
  undeployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean> {
    return new Promise(function(resolve, reject) {
      client.config.resources.remove(spec.name).result(function() {
        resolve(true)
      }, reject)
    })
  }

  deployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean> {
    let states: string[]
    if (!spec.states) {
      states = ['create', 'modify']
    } else {
      states = spec.states.map(function(state) {
        switch (state) {
          case MarkScript.TRIGGER_STATE.CREATE:
            return 'create'
          case MarkScript.TRIGGER_STATE.MODIFY:
            return 'modify'
          case MarkScript.TRIGGER_STATE.DELETE:
            return 'delete'
          default:
            throw new Error('Invalid alert state: ' + state)
        }
      })
    }
    let commit: string
    if (!spec.commit || spec.commit === MarkScript.TRIGGER_COMMIT.PRE) {
      commit = 'pre'
    } else {
      commit = 'post'
    }
    return installAlert(client, {
      alertUri: spec.name,
      alertName: spec.name,
      actionName: spec.name + 'Action',
      actionModule: toModuleName(spec.actionModule),
      triggerStates: states,
      triggerScope: spec.scope,
      triggerCommit: commit,
      triggerDepth: spec.depth
    })
  }
  undeployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean> {
    return deleteAlert(client, spec.name)
  }

  deployTask(client: DatabaseClient, spec: MarkScript.TaskSpec, model: MarkScript.Model): Promise<boolean> {
    let type: string
    switch (spec.type) {
      case MarkScript.FrequencyType.MINUTES:
        type = 'minutely'
        break
      case MarkScript.FrequencyType.HOURS:
        type = 'hourly'
        break
      case MarkScript.FrequencyType.DAYS:
        type = 'daily'
        break
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
    }, 'Default')
  }

  undeployTask(client: DatabaseClient, spec: MarkScript.TaskSpec): Promise<boolean> {
    return a.deleteTask(client, toModuleName(spec.module))
  }
}

export class StandardDeployer implements Deployer {
  deployDatabase(client: DatabaseClient, ifExists: IF_EXISTS, database: MarkScript.DatabaseSpec): Promise<boolean> {
    function _createDatabase() {
      let databaseConfig: a.DatabaseConfiguration = {
        'database-name': database.name,
        'triggers-database': database.triggersDatabase,
        'security-database': database.securityDatabase,
        'schema-database': database.schemaDatabase
      }
      if (database.rangeIndices) {
        databaseConfig['range-path-index'] = database.rangeIndices.map(function(rangeIndex) {
          return <a.RangePathIndex>{
            'path-expression': rangeIndex.path,
            'scalar-type': rangeIndex.scalarType,
            collation: rangeIndex.collation || (rangeIndex.scalarType === 'string' ? 'http://marklogic.com/collation/' : ''),
            'invalid-values': rangeIndex.invalidValues || 'reject',
            'range-value-positions': rangeIndex.rangeValuePositions || false
          }
        })
      }
      if (database.geoIndices) {
        databaseConfig['geospatial-path-index'] = database.geoIndices.map(function(geoIndex) {
          return <a.GeoPathIndex>{
            'path-expression': geoIndex.path,
            'coordinate-system': geoIndex.coordinateSystem || 'wgs84',
            'point-format': geoIndex.pointFormat,
            'invalid-values': geoIndex.invalidValues || 'reject',
            'range-value-positions': geoIndex.rangeValuePositions || false
          }
        })
      }
      if (database.triples) {
        databaseConfig['triple-index'] = true
        databaseConfig['collection-lexicon'] = true
      }
      if (database.defaultRulesets) {
        databaseConfig['default-ruleset'] = database.defaultRulesets.map(function(ruleSet) {
          return { location: ruleSet }
        })
      }

      return a.createDatabase(client, databaseConfig).then(function() {
        return true
      })
    }

    let undeploy = this.undeployDatabase
    let clear = this.cleanDatabase
    return a.getDatabase(client, database.name).then(function() {
      switch (ifExists) {
        case IF_EXISTS.recreate:
          return undeploy(client, database).then(_createDatabase)
        case IF_EXISTS.clear:
          return clear(client, database)
        case IF_EXISTS.ignore:
          return false
        case IF_EXISTS.fail:
          throw `Database ${database.name} already exists`
      }
    }, _createDatabase)

  }
  cleanDatabase(client: DatabaseClient, database: MarkScript.DatabaseSpec): Promise<boolean> {
    return a.clearOrConfigureDatabase(client, database.name, new a.ClearDatabaseOperation())
  }
  undeployDatabase(client: DatabaseClient, database: MarkScript.DatabaseSpec): Promise<boolean> {
    return a.deleteDatabase(client, database.name).then(function() {
      return true
    })
  }

  deployForest(client: DatabaseClient, ifExists: IF_EXISTS, forest: MarkScript.ForestSpec): Promise<boolean> {
    function _createForest() {
      return a.createForest(client, {
        'forest-name': forest.name,
        host: forest.host,
        database: forest.database
      }).then(function() {
        return true
      })
    }

    let undeploy = this.undeployForest
    return a.getForest(client, forest.name).then(function() {
      switch (ifExists) {
        case IF_EXISTS.recreate:
        case IF_EXISTS.clear:
          return undeploy(client, forest).then(_createForest)
        case IF_EXISTS.ignore:
          return false
        case IF_EXISTS.fail:
          throw `Forest ${forest.name} already exists`
      }
    }, _createForest)

  }
  undeployForest(client: DatabaseClient, forest: MarkScript.ForestSpec): Promise<boolean> {
    return a.deleteForest(client, forest.name).then(function() {
      return true
    })
  }

  deployServer(client: DatabaseClient, ifExists: IF_EXISTS, server: MarkScript.ServerSpec): Promise<boolean> {
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
      }).then(function() {
        return true
      })
    }

    let undeploy = this.undeployServer
    return a.getAppServer(client, server.name).then(function() {
      switch (ifExists) {
        case IF_EXISTS.recreate:
        case IF_EXISTS.clear:
          return undeploy(client, server).then(_createServer)
        case IF_EXISTS.ignore:
          return false
        case IF_EXISTS.fail:
          throw `Server ${server.name} already exists`
      }
    }, _createServer)
  }
  undeployServer(client: DatabaseClient, server: MarkScript.ServerSpec): Promise<boolean> {
    return a.deleteAppServer(client, server.name, server.group).then(function() {
      return true
    })
  }
}

function toPromise(promises: Promise<boolean>[]) {
  return Promise.all(promises).then(function(results) {
    for (let i = 0; i < results.length; i++) {
      if (!results[i]) {
        return false
      }
    }
    return true
  })
}

function deployDatabase(client: DatabaseClient, deployer: Deployer, ifExists: IF_EXISTS, database: MarkScript.DatabaseSpec) {
  return deployer.deployDatabase(client, ifExists, database).then(function() {
    let promises = []
    database.forests.forEach(function(forest) {
      promises.push(deployer.deployForest(client, ifExists, forest))
    })
    return toPromise(promises)
  })
}

function undeployDatabase(client: DatabaseClient, deployer: Deployer, database: MarkScript.DatabaseSpec) {
  return deployer.undeployDatabase(client, database).then(function(result) {
    if (result) {
      let promises: Promise<boolean>[] = []
      database.forests.forEach(function(forest) {
        promises.push(deployer.undeployForest(client, forest))
      })
      return toPromise(promises)
    } else {
      return false
    }
  })
}

function normaliseRequires(refModuleName: string, source: string): string {
  source = source.replace(/require[ \t]*\([ |\t]*['"]([\w./-]+)['"][ \t]*\)/g, function(f, v) {
    if (v.charAt(0) === '.') {
      v = path.posix.join(path.posix.dirname(refModuleName), v)
    }
    if (v.charAt(0) !== '/') {
      v = '/' + v
    }
    return 'require("' + v + '")'
  })

  return source
}

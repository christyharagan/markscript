var s = require('typescript-schema');
var d = require('./decorators');
var t = require('typescript');
var p = require('typescript-package');
var path = require('path');
var fs = require('fs');
var babel = require('babel');
function toScalarType(rangeOptions, member) {
    if (rangeOptions.scalarType) {
        switch (rangeOptions.scalarType) {
            case d.ScalarType.int:
                return 'int';
            case d.ScalarType.unsignedInt:
                return 'unsignedInt';
            case d.ScalarType.long:
                return 'long';
            case d.ScalarType.unsignedLong:
                return 'unsignedLong';
            case d.ScalarType.float:
                return 'float';
            case d.ScalarType.double:
                return 'double';
            case d.ScalarType.decimal:
                return 'decimal';
            case d.ScalarType.dateTime:
                return 'dateTime';
            case d.ScalarType.time:
                return 'time';
            case d.ScalarType.date:
                return 'date';
            case d.ScalarType.gYearMonth:
                return 'gYearMonth';
            case d.ScalarType.gYear:
                return 'gYear';
            case d.ScalarType.gMonth:
                return 'gMonth';
            case d.ScalarType.gDay:
                return 'gDay';
            case d.ScalarType.yearMonthDuration:
                return 'yearMonthDuration';
            case d.ScalarType.dayTimeDuration:
                return 'dayTimeDuration';
            case d.ScalarType.string:
                return 'string';
            case d.ScalarType.anyURI:
                return 'anyURI';
        }
    }
    else {
        var value;
        s.visitType(member.type, {
            onString: function () {
                value = 'string';
            },
            onNumber: function () {
                value = 'float';
            },
            onArrayType: function (arr) {
                return {
                    onString: function () {
                        value = 'string';
                    },
                    onNumber: function () {
                        value = 'float';
                    }
                };
            }
        });
        return value;
    }
    return null;
}
function toModuleName(name, packageName) {
    name = name.replace(/\\/g, '/');
    var suffix = name.substring(name.length - 3).toLowerCase();
    if (suffix === '.js' || suffix === '.ts') {
        name = name.substring(0, name.length - 3);
    }
    if (packageName) {
        name = path.join(packageName, name);
    }
    if (name.charAt(0) !== '/') {
        name = '/' + name;
    }
    return name;
}
function generateAssetModel(schema, definition, assetModel, defaultTaskUser) {
    if (assetModel) {
        if (!assetModel.ruleSets) {
            assetModel.ruleSets = [];
        }
        if (!assetModel.alerts) {
            assetModel.alerts = {};
        }
        if (!assetModel.modules) {
            assetModel.modules = {};
        }
        if (!assetModel.extensions) {
            assetModel.extensions = {};
        }
        if (!assetModel.tasks) {
            assetModel.tasks = {};
        }
    }
    else {
        assetModel = {
            ruleSets: [],
            modules: {},
            extensions: {},
            tasks: {},
            alerts: {}
        };
    }
    s.visitModules(schema, {
        onModule: function (module) {
            return {
                onClassConstructor: function (cc) {
                    return {
                        onClassConstructorDecorator: function (decorator) {
                            switch (decorator.decoratorType.name) {
                                case 'mlExtension':
                                    var methods = [];
                                    var isValid = false;
                                    s.visitClassConstructor(cc, {
                                        onImplement: function (impl) {
                                            if (s.interfaceConstructorToString(impl.typeConstructor) === 'markscript-core/lib/server/extension:Extension') {
                                                isValid = true;
                                            }
                                        },
                                        onInstanceType: function (it) {
                                            return {
                                                onMember: function (member) {
                                                    switch (member.name) {
                                                        case 'get':
                                                        case 'post':
                                                        case 'put':
                                                        case 'delete':
                                                            methods.push(member.name);
                                                    }
                                                }
                                            };
                                        }
                                    });
                                    if (!isValid) {
                                        throw new Error('A class annotated as a MarkLogic extension should implement markscript-core.Extension, at: ' + module.name + ':' + cc.name);
                                    }
                                    var code = 'var ExtensionClass = r' + ("equire(\"" + toModuleName(module.name) + "\")." + cc.name + ";\nvar extensionObject = new ExtensionClass();\n");
                                    methods.forEach(function (method) {
                                        code += "exports." + method + " = extensionObject." + method + ".bind(extensionObject)";
                                    });
                                    var extensionModuleName = '/_extensions/' + s.classConstructorToString(cc).replace(/:/g, '/');
                                    assetModel.extensions[extensionModuleName] = {
                                        name: extensionModuleName,
                                        code: code
                                    };
                            }
                        },
                        onInstanceType: function (it) {
                            return {
                                onMember: function (member) {
                                    return {
                                        onMemberDecorator: function (decorator) {
                                            switch (decorator.decoratorType.name) {
                                                case 'mlRuleSet':
                                                    if (member.type.primitiveTypeKind !== s.PrimitiveTypeKind.STRING && !(member.type.typeKind === s.TypeKind.FUNCTION && member.type.type.primitiveTypeKind === s.PrimitiveTypeKind.STRING)) {
                                                        throw new Error('A class member annotated as a MarkLogic rule set must be a string property, at: ' + module.name + ':' + cc.name + ':' + member.name);
                                                    }
                                                    var path_1 = s.expressionToLiteral(decorator.parameters[0]).path;
                                                    var rules = definition[decorator.parent.name]();
                                                    assetModel.ruleSets.push({
                                                        path: path_1,
                                                        rules: rules
                                                    });
                                                    break;
                                                case 'mlAlert':
                                                    if (cc.staticType.calls && cc.staticType.calls.length === 1 && cc.staticType.calls[0].parameters.length > 0) {
                                                        throw new Error('A class annotated with a MarkLogic alert must have a zero arg constructor, at: ' + module.name + ':' + cc.name + ':' + member.name);
                                                    }
                                                    if (member.type.typeKind !== s.TypeKind.FUNCTION || member.type.parameters.length !== 2) {
                                                        throw new Error('A class member annotated as a MarkLogic alert must be a method of type (uri?:string, content?:cts.DocumentNode)=>void, at: ' + module.name + ':' + cc.name + ':' + member.name);
                                                    }
                                                    var alertOptions = s.expressionToLiteral(decorator.parameters[0]);
                                                    var alertModuleName = '/_alerts/' + s.classConstructorToString(cc).replace(/:/g, '/') + '/' + member.name;
                                                    var alertName = alertOptions.name || (s.classConstructorToString(cc).replace(/:/g, '-') + '-' + member.name);
                                                    assetModel.alerts[alertName] = {
                                                        name: alertName,
                                                        scope: alertOptions.scope,
                                                        states: alertOptions.states,
                                                        depth: alertOptions.depth,
                                                        commit: alertOptions.commit,
                                                        actionModule: alertModuleName
                                                    };
                                                    assetModel.modules[alertModuleName] = {
                                                        name: alertModuleName,
                                                        code: 'var AlertClass = r' + ("equire(\"" + toModuleName(module.name) + "\")." + cc.name + ";\nvar alertObject = new AlertClass();\nmodule.exports = function(uri, content){\n  alertObject." + member.name + "(uri, content);\n}")
                                                    };
                                                    break;
                                                case 'mlTask':
                                                    if (cc.staticType.calls && cc.staticType.calls.length === 1 && cc.staticType.calls[0].parameters.length > 0) {
                                                        throw new Error('A class annotated with a MarkLogic task must have a zero arg constructor, at: ' + module.name + ':' + cc.name + ':' + member.name);
                                                    }
                                                    if (member.type.typeKind !== s.TypeKind.FUNCTION || member.type.parameters.length > 0) {
                                                        throw new Error('A class member annotated as a MarkLogic task must be a method with zero parameters, at: ' + module.name + ':' + cc.name + ':' + member.name);
                                                    }
                                                    var taskOptions = s.expressionToLiteral(decorator.parameters[0]);
                                                    var taskModuleName = '/_tasks/' + s.classConstructorToString(cc).replace(/:/g, '/') + '/' + member.name;
                                                    var taskName = taskOptions.name || s.classConstructorToString(cc) + ':' + member.name;
                                                    assetModel.tasks[taskName] = {
                                                        type: taskOptions.type,
                                                        frequency: taskOptions.frequency,
                                                        user: taskOptions.user || defaultTaskUser,
                                                        name: taskName,
                                                        module: taskModuleName
                                                    };
                                                    assetModel.modules[taskModuleName] = {
                                                        name: taskModuleName,
                                                        code: 'var TaskClass = r' + ("equire(\"" + toModuleName(module.name) + "\")." + cc.name + ";\nvar taskObject = new TaskClass();\ntaskObject." + member.name + "();")
                                                    };
                                            }
                                        }
                                    };
                                }
                            };
                        }
                    };
                }
            };
        }
    });
    return assetModel;
}
exports.generateAssetModel = generateAssetModel;
function loadCode(packageDir, modulePath) {
    var fileName = path.join(packageDir, modulePath);
    var code = fs.readFileSync(fileName).toString();
    if (fileName.substring(fileName.length - 3).toLowerCase() === '.ts') {
        code = removeDecorators(code);
        code = t.transpile(code, {
            target: 1,
            module: 1
        });
    }
    else {
        code = babel.transform(code, {
            optional: ['es6.spec.templateLiterals', 'es6.spec.blockScoping', 'es6.spec.symbols']
        }).code;
    }
    return code;
}
function addExtensions(assetModel, packageDir, extensions) {
    if (!assetModel.extensions) {
        assetModel.extensions = {};
    }
    Object.keys(extensions).forEach(function (name) {
        var extensionCode = loadCode(packageDir, extensions[name]);
        assetModel.extensions[name] = {
            name: name,
            code: extensionCode
        };
    });
}
exports.addExtensions = addExtensions;
function addModules(assetModel, packageDir, modulePaths) {
    if (!assetModel.modules) {
        assetModel.modules = {};
    }
    var packageJson = p.getPackageJson(packageDir);
    modulePaths.forEach(function (moduleToDeploy) {
        if (!assetModel.modules[moduleToDeploy]) {
            var moduleCode = loadCode(packageDir, moduleToDeploy);
            var moduleName = toModuleName(moduleToDeploy, packageJson.name);
            assetModel.modules[moduleName] = {
                name: moduleName,
                code: moduleCode
            };
            if (packageJson.main && packageJson.main === moduleToDeploy) {
                var packageModuleName = toModuleName(packageJson.name);
                assetModel.modules[packageModuleName] = {
                    name: packageModuleName,
                    code: moduleName
                };
            }
        }
    });
}
exports.addModules = addModules;
function removeDecorators(source) {
    var count = 0;
    var sf = t.createSourceFile('blah.ts', source, 1);
    function _removeDecorators(node) {
        t.forEachChild(node, function (node) {
            if (node.decorators) {
                node.decorators.forEach(function (decorator) {
                    var start = decorator.getStart(sf) - count;
                    var end = decorator.getEnd() - count;
                    count += (end - start);
                    var before = source.substring(0, start);
                    var after = source.substring(end);
                    source = before + after;
                });
            }
            _removeDecorators(node);
        });
    }
    _removeDecorators(sf);
    return source;
}
function generateModel(schema, definition, defaultHost) {
    var model = {
        databases: {},
        servers: {}
    };
    var rangeIndices = [];
    var geoIndices = [];
    var databasesByType = {
        content: null,
        triggers: null,
        schema: null,
        security: null,
        modules: null
    };
    var databases = {};
    s.visitModules(schema, {
        onModule: function (module) {
            return {
                onClassConstructor: function (cc) {
                    var isDeployable = false;
                    return {
                        onClassConstructorDecorator: function (decorator) {
                            if (decorator.decoratorType.name === 'mlDeploy') {
                                isDeployable = true;
                            }
                        },
                        onInstanceType: function (it) {
                            return {
                                onMember: function (member) {
                                    if (isDeployable) {
                                        var name_1 = member.type.name;
                                        switch (name_1) {
                                            case 'DatabaseSpec':
                                                var databaseSpec = definition[member.name];
                                                model.databases[databaseSpec.name] = databaseSpec;
                                                databases[member.name] = databaseSpec.name;
                                                if (!databaseSpec.forests || databaseSpec.forests.length === 0) {
                                                    databaseSpec.forests = [{
                                                            name: databaseSpec.name,
                                                            database: databaseSpec.name,
                                                            host: defaultHost
                                                        }];
                                                }
                                                break;
                                            case 'ServerSpec':
                                                var serverSpec = definition[member.name];
                                                if (!serverSpec.group) {
                                                    serverSpec.group = 'Default';
                                                }
                                                model.servers[serverSpec.name] = serverSpec;
                                                break;
                                        }
                                    }
                                    return {
                                        onMemberDecorator: function (decorator) {
                                            switch (decorator.decoratorType.name) {
                                                case 'rangeIndexed':
                                                    var rangeOptions = (decorator.parameters && decorator.parameters.length > 0) ? s.expressionToLiteral(decorator.parameters[0]) : {};
                                                    var scalarType = toScalarType(rangeOptions, decorator.parent);
                                                    if (scalarType) {
                                                        rangeIndices.push({
                                                            path: rangeOptions.path || "/" + decorator.parent.name,
                                                            collation: rangeOptions.collation,
                                                            scalarType: scalarType
                                                        });
                                                    }
                                                    break;
                                                case 'geoIndexed':
                                                    var geoOptions = (decorator.parameters && decorator.parameters.length > 0) ? s.expressionToLiteral(decorator.parameters[0]) : {};
                                                    var geoIndex = {
                                                        path: geoOptions.path || "/" + decorator.parent.name,
                                                        pointFormat: geoOptions.pointFormat || 'point'
                                                    };
                                                    if (geoOptions.coordinateSystem) {
                                                        geoIndex.coordinateSystem = geoOptions.coordinateSystem;
                                                    }
                                                    geoIndices.push(geoIndex);
                                                    break;
                                                case 'contentDatabase':
                                                    databasesByType.content = decorator.parent.name;
                                                    break;
                                                case 'triggersDatabase':
                                                    databasesByType.triggers = decorator.parent.name;
                                                    break;
                                                case 'schemaDatabase':
                                                    databasesByType.schema = decorator.parent.name;
                                                    break;
                                                case 'securityDatabase':
                                                    databasesByType.security = decorator.parent.name;
                                                    break;
                                                case 'modulesDatabase':
                                                    databasesByType.modules = decorator.parent.name;
                                                    break;
                                            }
                                        }
                                    };
                                }
                            };
                        }
                    };
                }
            };
        }
    });
    if (databasesByType.security) {
        model.securityDatabase = databases[databasesByType.security];
        Object.keys(databasesByType).forEach(function (key) {
            if (key !== 'security' && databasesByType[key]) {
                model.databases[databasesByType[key]].securityDatabase = databases[databasesByType.security];
            }
        });
    }
    if (databasesByType.modules) {
        model.modulesDatabase = databases[databasesByType.modules];
        Object.keys(model.servers).forEach(function (serverName) {
            model.servers[serverName].modulesDatabase = databases[databasesByType.modules];
        });
    }
    if (databasesByType.schema) {
        model.schemaDatabase = databases[databasesByType.schema];
    }
    if (databasesByType.triggers) {
        model.triggersDatabase = databases[databasesByType.triggers];
    }
    if (databasesByType.content) {
        model.contentDatabase = databases[databasesByType.content];
        Object.keys(model.servers).forEach(function (serverName) {
            model.servers[serverName].contentDatabase = databases[databasesByType.content];
        });
        var contentDatabase = model.databases[databases[databasesByType.content]];
        if (databasesByType.schema) {
            contentDatabase.schemaDatabase = databases[databasesByType.schema];
        }
        if (databasesByType.triggers) {
            contentDatabase.triggersDatabase = databases[databasesByType.triggers];
        }
        contentDatabase.rangeIndices = contentDatabase.rangeIndices || [];
        contentDatabase.geoIndices = contentDatabase.geoIndices || [];
        rangeIndices.forEach(function (rangeIndex) {
            contentDatabase.rangeIndices.push(rangeIndex);
        });
        geoIndices.forEach(function (geoIndex) {
            contentDatabase.geoIndices.push(geoIndex);
        });
    }
    return model;
}
exports.generateModel = generateModel;
//# sourceMappingURL=modelGenerator.js.map
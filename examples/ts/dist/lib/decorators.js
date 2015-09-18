function contentDatabase() {
    return function (target, propertyKey) {
    };
}
exports.contentDatabase = contentDatabase;
function triggersDatabase() {
    return function (target, propertyKey) {
    };
}
exports.triggersDatabase = triggersDatabase;
function schemaDatabase() {
    return function (target, propertyKey) {
    };
}
exports.schemaDatabase = schemaDatabase;
function modulesDatabase() {
    return function (target, propertyKey) {
    };
}
exports.modulesDatabase = modulesDatabase;
function securityDatabase() {
    return function (target, propertyKey) {
    };
}
exports.securityDatabase = securityDatabase;
(function (ScalarType) {
    ScalarType[ScalarType["int"] = 0] = "int";
    ScalarType[ScalarType["unsignedInt"] = 1] = "unsignedInt";
    ScalarType[ScalarType["long"] = 2] = "long";
    ScalarType[ScalarType["unsignedLong"] = 3] = "unsignedLong";
    ScalarType[ScalarType["float"] = 4] = "float";
    ScalarType[ScalarType["double"] = 5] = "double";
    ScalarType[ScalarType["decimal"] = 6] = "decimal";
    ScalarType[ScalarType["dateTime"] = 7] = "dateTime";
    ScalarType[ScalarType["time"] = 8] = "time";
    ScalarType[ScalarType["date"] = 9] = "date";
    ScalarType[ScalarType["gYearMonth"] = 10] = "gYearMonth";
    ScalarType[ScalarType["gYear"] = 11] = "gYear";
    ScalarType[ScalarType["gMonth"] = 12] = "gMonth";
    ScalarType[ScalarType["gDay"] = 13] = "gDay";
    ScalarType[ScalarType["yearMonthDuration"] = 14] = "yearMonthDuration";
    ScalarType[ScalarType["dayTimeDuration"] = 15] = "dayTimeDuration";
    ScalarType[ScalarType["string"] = 16] = "string";
    ScalarType[ScalarType["anyURI"] = 17] = "anyURI";
})(exports.ScalarType || (exports.ScalarType = {}));
var ScalarType = exports.ScalarType;
function mlDeploy() {
    return function (target) {
    };
}
exports.mlDeploy = mlDeploy;
function geoIndexed(definition) {
    return function (target, propertyKey) {
    };
}
exports.geoIndexed = geoIndexed;
function rangeIndexed(definition) {
    return function (target, propertyKey) {
    };
}
exports.rangeIndexed = rangeIndexed;
function mlRuleSet(definition) {
    return function (target, propertyKey, method) {
    };
}
exports.mlRuleSet = mlRuleSet;
function mlTask(definition) {
    return function (target, propertyKey) {
    };
}
exports.mlTask = mlTask;
function mlAlert(definition) {
    return function (target, propertyKey) {
    };
}
exports.mlAlert = mlAlert;
function mlExtension() {
    return function (target) {
        return target;
    };
}
exports.mlExtension = mlExtension;
//# sourceMappingURL=decorators.js.map
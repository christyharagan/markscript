(function (IF_EXISTS) {
    IF_EXISTS[IF_EXISTS["recreate"] = 0] = "recreate";
    IF_EXISTS[IF_EXISTS["clear"] = 1] = "clear";
    IF_EXISTS[IF_EXISTS["ignore"] = 2] = "ignore";
    IF_EXISTS[IF_EXISTS["fail"] = 3] = "fail";
})(exports.IF_EXISTS || (exports.IF_EXISTS = {}));
var IF_EXISTS = exports.IF_EXISTS;
(function (TRIGGER_COMMIT) {
    TRIGGER_COMMIT[TRIGGER_COMMIT["PRE"] = 0] = "PRE";
    TRIGGER_COMMIT[TRIGGER_COMMIT["POST"] = 1] = "POST";
})(exports.TRIGGER_COMMIT || (exports.TRIGGER_COMMIT = {}));
var TRIGGER_COMMIT = exports.TRIGGER_COMMIT;
(function (TRIGGER_STATE) {
    TRIGGER_STATE[TRIGGER_STATE["CREATE"] = 0] = "CREATE";
    TRIGGER_STATE[TRIGGER_STATE["MODIFY"] = 1] = "MODIFY";
    TRIGGER_STATE[TRIGGER_STATE["DELETE"] = 2] = "DELETE";
})(exports.TRIGGER_STATE || (exports.TRIGGER_STATE = {}));
var TRIGGER_STATE = exports.TRIGGER_STATE;
(function (FrequencyType) {
    FrequencyType[FrequencyType["MINUTES"] = 0] = "MINUTES";
    FrequencyType[FrequencyType["HOURS"] = 1] = "HOURS";
    FrequencyType[FrequencyType["DAYS"] = 2] = "DAYS";
})(exports.FrequencyType || (exports.FrequencyType = {}));
var FrequencyType = exports.FrequencyType;
//# sourceMappingURL=model.js.map
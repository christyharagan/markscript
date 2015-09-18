var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var decorators_1 = require('../../../lib/decorators');
var model_1 = require('../../../lib/model');
var SampleTask = (function () {
    function SampleTask() {
    }
    SampleTask.prototype.task = function () {
        xdmp.log('Sample Task ran');
    };
    Object.defineProperty(SampleTask.prototype, "task",
        __decorate([
            decorators_1.mlTask({
                type: model_1.FrequencyType.MINUTES,
                frequency: 1,
                user: 'admin'
            })
        ], SampleTask.prototype, "task", Object.getOwnPropertyDescriptor(SampleTask.prototype, "task")));
    return SampleTask;
})();
exports.SampleTask = SampleTask;
//# sourceMappingURL=sampleTask.js.map
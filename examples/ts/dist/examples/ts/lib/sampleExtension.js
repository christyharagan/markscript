var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var decorators_1 = require('../../../lib/decorators');
var sampleModule = require('./sampleModule');
var SampleExtension = (function () {
    function SampleExtension() {
    }
    SampleExtension.prototype.get = function (context, params) {
        return sampleModule.sayHello(params['world']);
    };
    SampleExtension.prototype.post = function (context, params, input) {
    };
    SampleExtension.prototype.put = function (context, params, input) {
    };
    SampleExtension.prototype.delete = function (context, params) {
    };
    SampleExtension = __decorate([
        decorators_1.mlExtension()
    ], SampleExtension);
    return SampleExtension;
})();
exports.SampleExtension = SampleExtension;
//# sourceMappingURL=sampleExtension.js.map
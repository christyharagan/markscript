var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var decorators_1 = require('../../../lib/decorators');
var SampleAlert = (function () {
    function SampleAlert() {
    }
    SampleAlert.prototype.alert = function (uri, content) {
        xdmp.log('The Sample Alert Ran for document: ' + uri + ' with contents: ' + JSON.stringify(content.toObject()));
    };
    Object.defineProperty(SampleAlert.prototype, "alert",
        __decorate([
            decorators_1.mlAlert({
                scope: '/sampleDir'
            })
        ], SampleAlert.prototype, "alert", Object.getOwnPropertyDescriptor(SampleAlert.prototype, "alert")));
    return SampleAlert;
})();
exports.SampleAlert = SampleAlert;
//# sourceMappingURL=sampleAlert.js.map
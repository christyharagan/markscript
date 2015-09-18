var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var decorators_1 = require('../../../lib/decorators');
var speckle_1 = require('speckle');
var SampleRuleSet = (function () {
    function SampleRuleSet() {
    }
    SampleRuleSet.prototype.customerRuleSet = function () {
        var megaStore = speckle_1.prefix('ms', 'http://megastore.com/');
        var customer = speckle_1.variable('customer');
        var tweet = speckle_1.variable('tweet');
        return speckle_1.rule('isHighValueCustomer')
            .when(customer, megaStore.uri('tweeted'), tweet)
            .and(tweet, megaStore.uri('sentiment'), megaStore.uri('positiveSentiment'))
            .then(customer, megaStore.uri('is'), megaStore.uri('highValue')).toSparql();
    };
    Object.defineProperty(SampleRuleSet.prototype, "customerRuleSet",
        __decorate([
            decorators_1.mlRuleSet({
                path: '/rules/twitter.rules'
            })
        ], SampleRuleSet.prototype, "customerRuleSet", Object.getOwnPropertyDescriptor(SampleRuleSet.prototype, "customerRuleSet")));
    return SampleRuleSet;
})();
exports.SampleRuleSet = SampleRuleSet;
//# sourceMappingURL=sampleRuleSet.js.map
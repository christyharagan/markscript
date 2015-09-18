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
var TypeScriptExample = (function () {
    function TypeScriptExample(name, host, port) {
        this.name = name;
        this.host = host;
        this.port = port;
    }
    Object.defineProperty(TypeScriptExample.prototype, "server", {
        get: function () {
            return {
                name: this.name,
                host: this.host,
                port: this.port
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TypeScriptExample.prototype, "contentDatabase", {
        get: function () {
            return {
                name: this.name + '-content',
                triples: true
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TypeScriptExample.prototype, "triggersDatabase", {
        get: function () {
            return {
                name: this.name + '-triggers'
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TypeScriptExample.prototype, "modulesDatabase", {
        get: function () {
            return {
                name: this.name + '-modules'
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TypeScriptExample.prototype, "schemaDatabase", {
        get: function () {
            return {
                name: this.name + '-schema'
            };
        },
        enumerable: true,
        configurable: true
    });
    TypeScriptExample.prototype.customerRuleSet = function () {
        var megaStore = speckle_1.prefix('ms', 'http://megastore.com/');
        var customer = speckle_1.variable('customer');
        var tweet = speckle_1.variable('tweet');
        return speckle_1.rule('isHighValueCustomer')
            .when(customer, megaStore.uri('tweeted'), tweet)
            .and(tweet, megaStore.uri('sentiment'), megaStore.uri('positiveSentiment'))
            .then(customer, megaStore.uri('is'), megaStore.uri('highValue')).toSparql();
    };
    Object.defineProperty(TypeScriptExample.prototype, "contentDatabase",
        __decorate([
            decorators_1.contentDatabase()
        ], TypeScriptExample.prototype, "contentDatabase", Object.getOwnPropertyDescriptor(TypeScriptExample.prototype, "contentDatabase")));
    Object.defineProperty(TypeScriptExample.prototype, "triggersDatabase",
        __decorate([
            decorators_1.triggersDatabase()
        ], TypeScriptExample.prototype, "triggersDatabase", Object.getOwnPropertyDescriptor(TypeScriptExample.prototype, "triggersDatabase")));
    Object.defineProperty(TypeScriptExample.prototype, "modulesDatabase",
        __decorate([
            decorators_1.modulesDatabase()
        ], TypeScriptExample.prototype, "modulesDatabase", Object.getOwnPropertyDescriptor(TypeScriptExample.prototype, "modulesDatabase")));
    Object.defineProperty(TypeScriptExample.prototype, "schemaDatabase",
        __decorate([
            decorators_1.schemaDatabase()
        ], TypeScriptExample.prototype, "schemaDatabase", Object.getOwnPropertyDescriptor(TypeScriptExample.prototype, "schemaDatabase")));
    Object.defineProperty(TypeScriptExample.prototype, "customerRuleSet",
        __decorate([
            decorators_1.mlRuleSet({
                path: '/rules/twitter.rules'
            })
        ], TypeScriptExample.prototype, "customerRuleSet", Object.getOwnPropertyDescriptor(TypeScriptExample.prototype, "customerRuleSet")));
    TypeScriptExample = __decorate([
        decorators_1.mlDeploy()
    ], TypeScriptExample);
    return TypeScriptExample;
})();
exports.TypeScriptExample = TypeScriptExample;
//# sourceMappingURL=sampleDatabaseModel.js.map
var marklogic_1 = require('marklogic');
var os = require('os');
var CoreRuntime = (function () {
    function CoreRuntime(buildModel, buildConfig) {
        this.buildConfig = buildConfig;
    }
    CoreRuntime.prototype.getClient = function (portOrDatabase) {
        return marklogic_1.createDatabaseClient({
            host: this.buildConfig.databaseConnection.host || os.hostname(),
            port: (!portOrDatabase || typeof portOrDatabase === 'string') ? this.buildConfig.databaseConnection.httpPort : portOrDatabase,
            user: this.buildConfig.databaseConnection.user,
            password: this.buildConfig.databaseConnection.password,
            database: (portOrDatabase && typeof portOrDatabase === 'string') ? portOrDatabase : null
        });
    };
    return CoreRuntime;
})();
exports.CoreRuntime = CoreRuntime;
//# sourceMappingURL=coreRuntime.js.map
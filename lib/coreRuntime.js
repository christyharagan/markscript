var marklogic_1 = require('marklogic');
var os = require('os');
var CoreRuntime = (function () {
    function CoreRuntime(buildModel, buildConfig) {
        this.buildConfig = buildConfig;
    }
    CoreRuntime.prototype.getClient = function (portOrDatabase) {
        return marklogic_1.createDatabaseClient({
            host: this.buildConfig.databaseConnection.host || os.hostname(),
            port: typeof portOrDatabase === 'string' ? 8000 : portOrDatabase,
            user: this.buildConfig.databaseConnection.user,
            password: this.buildConfig.databaseConnection.password,
            database: typeof portOrDatabase === 'string' ? portOrDatabase : 'Documents'
        });
    };
    return CoreRuntime;
})();
exports.CoreRuntime = CoreRuntime;
//# sourceMappingURL=coreRuntime.js.map
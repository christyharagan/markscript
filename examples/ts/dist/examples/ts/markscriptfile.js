var sampleDatabaseModel_1 = require('./lib/sampleDatabaseModel');
var COMMON = {
    appName: 'markscript-ts-examples',
    ml: {
        port: 8005,
        host: 'christys-macbook-pro.local',
        user: 'admin',
        password: 'passw0rd'
    }
};
exports.buildOptions = {
    database: {
        host: COMMON.ml.host,
        httpPort: COMMON.ml.port,
        adminPort: 8001,
        configPort: 8002,
        user: COMMON.ml.user,
        password: COMMON.ml.password,
        modelObject: new sampleDatabaseModel_1.TypeScriptExample(COMMON.appName, COMMON.ml.host, COMMON.ml.port),
        modules: './lib/**/*.ts'
    },
    middle: {
        host: 'localhost',
        port: 8080
    }
};
//# sourceMappingURL=markscriptfile.js.map
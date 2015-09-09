var logicRuleSet = require('./lib/logicRuleSet').logicRuleSet
var databaseModel = require('./lib/sampleDatabaseModel').databaseModel

var COMMON = {
  appName: 'markscript-js-examples',
  ml: {
    port: 8005,
    host: 'christys-macbook-pro.local',
    user: 'admin',
    password: 'passw0rd'
  },
  koa: {
    host: 'localhost',
    port: 8080
  }
}

exports.COMMON = COMMON

exports.buildOptions = {
  database: {
    host: COMMON.ml.host,
    httpPort: COMMON.ml.port,
    adminPort: 8001,
    configPort: 8002,
    user: COMMON.ml.user,
    password: COMMON.ml.password,
    modules: './lib/**/*.js',
    ruleSets: [logicRuleSet()],
    extensions: {
      'sampleExtension': './lib/sampleExtension.js'
    },
    alerts: [{
      name: 'sampleAlert',
      scope: '/sampleDir/',
      actionModule: '/markscript-typescript-example/lib/sampleAlert'
    }],
    tasks: [{
      name: 'sampleTask',
      frequency: 1,
      type: 0,
      user: 'admin',
      module: '/markscript-typescript-example/lib/sampleTask'
    }],
    model: databaseModel(COMMON)
  },
  middle: {
    host: 'localhost',
    port: 8080
  }
}

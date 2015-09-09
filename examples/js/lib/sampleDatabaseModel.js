exports.databaseModel = function(common) {
  var content = common.appName + '-content'
  var modules = common.appName + '-modules'
  var schema = common.appName + '-schema'
  var triggers = common.appName + '-triggers'

  var model = {
    databases: {
    },
    servers: {
    },
    contentDatabase: content,
    modulesDatabase: modules,
    schemaDatabase: schema,
    triggersDatabase: triggers
  }

  model.servers[common.appName] = {
    name: common.appName,
    host: common.ml.host,
    port: common.ml.port,
    group: 'Default',
    modulesDatabase: modules,
    contentDatabase: content
  }

  model.databases[content] = {
    name: content,
    triples: true,
    forests: [
      {
        name: content,
        database: content,
        host: common.ml.host,
      }
    ],
    schemaDatabase: schema,
    triggersDatabase: triggers
  }

  model.databases[triggers] = {
    name: triggers,
    forests: [
      {
        name: triggers,
        database: triggers,
        host: common.ml.host,
      }
    ]
  }

  model.databases[modules] = {
    name: modules,
    forests: [
      {
        name: modules,
        database: modules,
        host: common.ml.host,
      }
    ]
  }

  model.databases[schema] = {
    name: schema,
    forests: [
      {
        name: schema,
        database: schema,
        host: common.ml.host,
      }
    ]
  }

  return model
}

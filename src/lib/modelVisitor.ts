import * as m from './model'

export interface ModelVisitor {
  onDatabase?(database:m.DatabaseSpec):void

  onServer?(server:m.ServerSpec):void
}

export function visitModel(modelVisitor: ModelVisitor, model:m.Model) {
  interface Seen {
    [name:string]:boolean
  }
  let seen:Seen = {}

  function handleDatabase(name:string) {
    if (!seen[name]) {
      seen[name] = true
      let database = model.databases[name]
      if (database.triggersDatabase) {
        handleDatabase(<string>database.triggersDatabase)
      }
      if (database.schemaDatabase) {
        handleDatabase(<string>database.schemaDatabase)
      }
      if (database.securityDatabase) {
        handleDatabase(<string>database.securityDatabase)
      }

      modelVisitor.onDatabase(database)
    }
  }
  if (modelVisitor.onDatabase) {
    Object.keys(model.databases).forEach(handleDatabase)
  }
  if (modelVisitor.onServer) {
    Object.keys(model.servers).forEach(function(name){
      modelVisitor.onServer(model.servers[name])
    })
  }
}

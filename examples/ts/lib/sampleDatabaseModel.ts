import {ServerSpec, DatabaseSpec} from '../../../lib/model'
import {mlDeploy, contentDatabase, triggersDatabase, modulesDatabase, schemaDatabase} from '../../../lib/decorators'
import {rule, variable, prefix} from 'speckle'
import {BuildOptions} from '../../../lib/build'

@mlDeploy()
export class TypeScriptExample {
  buildOptions: BuildOptions
  name = 'typescript-example'

  constructor(connectionParams: BuildOptions) {
    this.buildOptions = connectionParams
  }

  get server(): ServerSpec {
    return {
      name: this.name,
      host: this.buildOptions.database.host,
      port: this.buildOptions.database.httpPort
    }
  }

  @contentDatabase()
  get contentDatabase(): DatabaseSpec {
    return {
      name: this.name + '-content',
      triples: true
    }
  }

  @triggersDatabase()
  get triggersDatabase(): DatabaseSpec {
    return {
      name: this.name + '-triggers'
    }
  }

  @modulesDatabase()
  get modulesDatabase(): DatabaseSpec {
    return {
      name: this.name + '-modules'
    }
  }

  @schemaDatabase()
  get schemaDatabase(): DatabaseSpec {
    return {
      name: this.name + '-schema'
    }
  }
}

import {ServerSpec, DatabaseSpec} from '../../../lib/model'
import {mlDeploy, contentDatabase, triggersDatabase, modulesDatabase, schemaDatabase, mlRuleSet} from '../../../lib/decorators'
import {rule, variable, prefix} from 'speckle'
import {BuildOptions} from '../../../lib/build'

@mlDeploy()
export class TypeScriptExample {
  private name: string
  private host: string
  private port: number

  constructor(name: string, host: string, port: number) {
    this.name = name
    this.host = host
    this.port = port
  }

  get server(): ServerSpec {
    return {
      name: this.name,
      host: this.host,
      port: this.port
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

  @mlRuleSet({
    path: '/rules/twitter.rules'
  })
  customerRuleSet(): string {
    let megaStore = prefix('ms', 'http://megastore.com/')
    let customer = variable('customer')
    let tweet = variable('tweet')
    return rule('isHighValueCustomer')
      .when(customer, megaStore.uri('tweeted'), tweet)
      .and(tweet, megaStore.uri('sentiment'), megaStore.uri('positiveSentiment'))
      .then(customer, megaStore.uri('is'), megaStore.uri('highValue')).toSparql()
  }
}

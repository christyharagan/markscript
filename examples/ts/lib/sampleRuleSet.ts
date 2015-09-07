import {mlRuleSet} from '../../../../lib/decorators'
import {prefix, variable, rule} from 'speckle'

export class SampleRuleSet {
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

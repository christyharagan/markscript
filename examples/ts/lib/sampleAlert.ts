import {mlAlert} from '../../../lib/decorators'

export class SampleAlert {
  @mlAlert({
    scope: '/sampleDir'
  })
  alert(uri: string, content: cts.DocumentNode<any>) {
    xdmp.log('The Sample Alert Ran for document: ' + uri + ' with contents: ' + JSON.stringify(content.toObject()))
  }
}

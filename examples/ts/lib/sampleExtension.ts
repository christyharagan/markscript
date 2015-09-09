import {mlExtension} from '../../../lib/decorators'
import {Extension, Context, Parameters} from '../../../lib/server/extension'
import * as sampleModule from './sampleModule'

@mlExtension()
export class SampleExtension implements Extension {
  get(context: Context, params: Parameters) {
    return sampleModule.sayHello(<string>params['world'])
  }

  post(context: Context, params: Parameters, input: cts.DocumentNode<any>|cts.ValueIterator<any>) {

  }

  put(context: Context, params: Parameters, input: cts.DocumentNode<any>|cts.ValueIterator<any>) {

  }

  delete(context: Context, params: Parameters) {

  }
}

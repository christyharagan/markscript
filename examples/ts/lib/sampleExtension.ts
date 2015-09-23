import {mlExtension} from 'markscript-core'
import {Extension, Context, Parameters} from 'markscript-core'
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

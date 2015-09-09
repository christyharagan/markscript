import {mlTask} from '../../../lib/decorators'
import {FrequencyType} from '../../../lib/model'

export class SampleTask {
  @mlTask({
    type: FrequencyType.MINUTES,
    frequency: 1,
    user: 'admin'
  })
  task() {
    xdmp.log('Sample Task ran')
  }
}

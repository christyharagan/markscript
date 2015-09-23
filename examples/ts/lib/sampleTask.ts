import {mlTask} from 'markscript-core'
import {FrequencyType} from 'markscript-core'

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

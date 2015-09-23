import {mlTask} from 'markscript'
import {FrequencyType} from 'markscript'

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

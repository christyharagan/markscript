import {DatabaseClient} from 'marklogic'

export function deleteAlert(client: DatabaseClient, alertUri: string): Promise<any> {
  let deleteConfig =
    `xquery version "1.0-ml";\n` +
    `import module namespace alert = "http://marklogic.com/xdmp/alert"\n` +
    `		  at "/MarkLogic/alert.xqy";\n` +
    `alert:config-delete(${alertUri})`

  return new Promise(function(resolve, reject) {
    client.xqueryEval(deleteConfig).result(resolve, reject)
  })
}

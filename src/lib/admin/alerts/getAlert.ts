import {DatabaseClient} from 'marklogic'

export function getAlert(client: DatabaseClient, alertUri: string): Promise<any> {
  let getConfig =
    `xquery version "1.0-ml";\n` +
    `import module namespace alert = "http://marklogic.com/xdmp/alert"\n` +
    `		  at "/MarkLogic/alert.xqy";\n` +
    `alert:config-get(${alertUri})`

  return new Promise(function(resolve, reject) {
    client.xqueryEval(getConfig).result(resolve, reject)
  })
}

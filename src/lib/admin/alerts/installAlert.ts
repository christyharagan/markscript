import {DatabaseClient} from 'marklogic'

export interface AlertConfig {
  alertName: string
  alertDescription?: string
  alertUri: string

  actionName: string
  actionDescription?: string
  actionModule: string

  ruleName?: string
  ruleDescription?: string
  ruleModule?: string

  triggerScope?: string
  triggerStates?: string[]
  triggerDepth?: number
  triggerCommit?: string
  triggerDomain?: string
}

const RUN_SJS_PATH = '/mlAdmin/alert-run-sjs.xqy'
const RUN_SJS_CODE = `
  xquery version '1.0-ml';

  import module "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  declare namespace alert = "http://marklogic.com/xdmp/alert";

  declare variable $alert:doc as node() external;
  declare variable $alert:action as element(alert:action) external;

  let $module := $alert:action/alert:options/alert:sjs-module/text()
  let $run-module := "require(m.toString().trim())(uri.toString().trim(), doc);"
  let $uri := fn:document-uri($alert:doc)

 return xdmp:javascript-eval($run-module, ("m", $module, "uri", $uri, "doc", $alert:doc))`

export function installAlert(client: DatabaseClient, config: AlertConfig):Promise<boolean> {
  let depth = (config.triggerDepth === undefined || config.triggerDepth < 0) ? 'infinity' : config.triggerDepth
  return new Promise(function(resolve, reject){
    return client.config.resources.read(RUN_SJS_PATH).result(resolve, reject)
  }).catch(function() {
    return new Promise<void>(function(resolve, reject){
      return client.config.extlibs.write({
        path:RUN_SJS_PATH,
        contentType: 'application/vnd.marklogic-javascript',
        source:RUN_SJS_CODE
      }).result(resolve, reject)
    })
  }).then(function() {
    let makeConfig = `
  xquery version "1.0-ml";
  import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  let $config := alert:make-config(
    "${config.alertUri}",
    "${config.alertName}",
    "${config.alertDescription || ''}",
    <alert:options/> )
  return alert:config-insert($config)`

    return new Promise(function(resolve, reject) {
      client.xqueryEval(makeConfig).result(resolve, reject)
    })
    // }).catch(function(e) {
    //   if (e.body && e.body.errorResponse && e.body.errorResponse.messageCode === 'ALERT-EXISTCONFIG') {
    //     return
    //   } else {
    //     throw e
    //   }
    //   // TODO: Stupid typing...
    //   return e
  }).then(function() {
    let makeAction = `
  xquery version "1.0-ml";
  import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  let $action-log := alert:make-log-action()
  let $action := alert:make-action(
    "${config.actionName}",
    "${config.actionDescription || ''}",
    xdmp:modules-database(),
    xdmp:modules-root(),
    "/ext${RUN_SJS_PATH}",
    <alert:options>
      <alert:sjs-module>${config.actionModule}</alert:sjs-module>
    </alert:options>
  )
  return (alert:action-insert("${config.alertUri}", $action-log),alert:action-insert("${config.alertUri}", $action))`

    return new Promise(function(resolve, reject) {
      client.xqueryEval(makeAction).result(resolve, reject)
    })
  }).then(function() {
    if (config.triggerScope) {
      if (config.triggerScope.charAt(config.triggerScope.length - 1) !== '/') {
        config.triggerScope += '/'
      }
      let makeRules = `
xquery version "1.0-ml";
import module namespace alert = "http://marklogic.com/xdmp/alert"
		  at "/MarkLogic/alert.xqy";

let $rule := alert:make-rule(
    "${config.alertName}",
    "${config.alertDescription}",
    0,
    cts:directory-query(("${config.triggerScope}"),"${depth}"),
    "${config.actionName}",
    <alert:options/> )
return alert:rule-insert("${config.alertUri}", $rule)`

      return new Promise(function(resolve, reject) {
        client.xqueryEval(makeRules).result(resolve, reject)
      })
    } else {
      // TODO: Handle rules
    }
  }).then(function() {
    let states;
    if (config.triggerStates) {
      states = `"${config.triggerStates[0]}"`
      for (let i = 1; i < config.triggerStates.length; i++) {
        states += `, "${config.triggerStates[i]}"`
      }
    } else {
      states = '"create", "modify"'
    }
    let makeTrigger = `
  xquery version "1.0-ml";
  import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  import module namespace trgr = "http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";
  let $uri := "${config.alertUri}"
  let $trigger-ids := alert:create-triggers(
    $uri,
    trgr:trigger-data-event(
      trgr:directory-scope("${config.triggerScope}", "${depth}"),
      trgr:document-content((${states})),
      trgr:${config.triggerCommit}-commit()
    )
  )
  let $config := alert:config-get($uri)
  let $config := alert:config-set-trigger-ids($config, $trigger-ids)
  return alert:config-insert($config)`

    return new Promise(function(resolve, reject) {
      client.xqueryEval(makeTrigger).result(resolve, reject)
    })
  })
}

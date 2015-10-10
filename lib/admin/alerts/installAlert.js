var RUN_SJS_PATH = '/mlAdmin/alert-run-sjs.xqy';
var RUN_SJS_CODE = "\n  xquery version '1.0-ml';\n\n  import module \"http://marklogic.com/xdmp/alert\" at \"/MarkLogic/alert.xqy\";\n  declare namespace alert = \"http://marklogic.com/xdmp/alert\";\n\n  declare variable $alert:doc as node() external;\n  declare variable $alert:action as element(alert:action) external;\n\n  let $module := $alert:action/alert:options/alert:sjs-module/text()\n  let $run-module := \"require(m.toString().trim())(uri.toString().trim(), doc);\"\n  let $uri := fn:document-uri($alert:doc)\n\n return xdmp:javascript-eval($run-module, (\"m\", $module, \"uri\", $uri, \"doc\", $alert:doc))";
function installAlert(client, config) {
    var depth = (config.triggerDepth === undefined || config.triggerDepth < 0) ? 'infinity' : config.triggerDepth;
    return new Promise(function (resolve, reject) {
        return client.config.resources.read(RUN_SJS_PATH).result(resolve, reject);
    }).catch(function () {
        return new Promise(function (resolve, reject) {
            return client.config.extlibs.write({
                path: RUN_SJS_PATH,
                contentType: 'application/vnd.marklogic-javascript',
                source: RUN_SJS_CODE
            }).result(resolve, reject);
        });
    }).then(function () {
        var makeConfig = "\n  xquery version \"1.0-ml\";\n  import module namespace alert = \"http://marklogic.com/xdmp/alert\" at \"/MarkLogic/alert.xqy\";\n  let $config := alert:make-config(\n    \"" + config.alertUri + "\",\n    \"" + config.alertName + "\",\n    \"" + (config.alertDescription || '') + "\",\n    <alert:options/> )\n  return alert:config-insert($config)";
        return new Promise(function (resolve, reject) {
            client.xqueryEval(makeConfig).result(resolve, reject);
        });
    }).then(function () {
        var makeAction = "\n  xquery version \"1.0-ml\";\n  import module namespace alert = \"http://marklogic.com/xdmp/alert\" at \"/MarkLogic/alert.xqy\";\n  let $action-log := alert:make-log-action()\n  let $action := alert:make-action(\n    \"" + config.actionName + "\",\n    \"" + (config.actionDescription || '') + "\",\n    xdmp:modules-database(),\n    xdmp:modules-root(),\n    \"/ext" + RUN_SJS_PATH + "\",\n    <alert:options>\n      <alert:sjs-module>" + config.actionModule + "</alert:sjs-module>\n    </alert:options>\n  )\n  return (alert:action-insert(\"" + config.alertUri + "\", $action-log),alert:action-insert(\"" + config.alertUri + "\", $action))";
        return new Promise(function (resolve, reject) {
            client.xqueryEval(makeAction).result(resolve, reject);
        });
    }).then(function () {
        if (config.triggerScope) {
            if (config.triggerScope.charAt(config.triggerScope.length - 1) !== '/') {
                config.triggerScope += '/';
            }
            var makeRules = "\nxquery version \"1.0-ml\";\nimport module namespace alert = \"http://marklogic.com/xdmp/alert\"\n\t\t  at \"/MarkLogic/alert.xqy\";\n\nlet $rule := alert:make-rule(\n    \"" + config.alertName + "\",\n    \"" + config.alertDescription + "\",\n    0,\n    cts:directory-query((\"" + config.triggerScope + "\"),\"" + depth + "\"),\n    \"" + config.actionName + "\",\n    <alert:options/> )\nreturn alert:rule-insert(\"" + config.alertUri + "\", $rule)";
            return new Promise(function (resolve, reject) {
                client.xqueryEval(makeRules).result(resolve, reject);
            });
        }
        else {
        }
    }).then(function () {
        var states;
        if (config.triggerStates) {
            states = "\"" + config.triggerStates[0] + "\"";
            for (var i = 1; i < config.triggerStates.length; i++) {
                states += ", \"" + config.triggerStates[i] + "\"";
            }
        }
        else {
            states = '"create", "modify"';
        }
        var makeTrigger = "\n  xquery version \"1.0-ml\";\n  import module namespace alert = \"http://marklogic.com/xdmp/alert\" at \"/MarkLogic/alert.xqy\";\n  import module namespace trgr = \"http://marklogic.com/xdmp/triggers\" at \"/MarkLogic/triggers.xqy\";\n  let $uri := \"" + config.alertUri + "\"\n  let $trigger-ids := alert:create-triggers(\n    $uri,\n    trgr:trigger-data-event(\n      trgr:directory-scope(\"" + config.triggerScope + "\", \"" + depth + "\"),\n      trgr:document-content((" + states + ")),\n      trgr:" + config.triggerCommit + "-commit()\n    )\n  )\n  let $config := alert:config-get($uri)\n  let $config := alert:config-set-trigger-ids($config, $trigger-ids)\n  return alert:config-insert($config)";
        return new Promise(function (resolve, reject) {
            client.xqueryEval(makeTrigger).result(resolve, reject);
        });
    });
}
exports.installAlert = installAlert;
//# sourceMappingURL=installAlert.js.map
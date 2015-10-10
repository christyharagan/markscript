function getAlert(client, alertUri) {
    var getConfig = "xquery version \"1.0-ml\";\n" +
        "import module namespace alert = \"http://marklogic.com/xdmp/alert\"\n" +
        "\t\t  at \"/MarkLogic/alert.xqy\";\n" +
        ("alert:config-get(" + alertUri + ")");
    return new Promise(function (resolve, reject) {
        client.xqueryEval(getConfig).result(resolve, reject);
    });
}
exports.getAlert = getAlert;
//# sourceMappingURL=getAlert.js.map
function deleteAlert(client, alertUri) {
    var deleteConfig = "xquery version \"1.0-ml\";\n" +
        "import module namespace alert = \"http://marklogic.com/xdmp/alert\"\n" +
        "\t\t  at \"/MarkLogic/alert.xqy\";\n" +
        ("alert:config-delete(" + alertUri + ")");
    return new Promise(function (resolve, reject) {
        client.xqueryEval(deleteConfig).result(resolve, reject);
    });
}
exports.deleteAlert = deleteAlert;
//# sourceMappingURL=deleteAlert.js.map
function visitModel(modelVisitor, model) {
    var seen = {};
    function handleDatabase(name) {
        if (!seen[name]) {
            seen[name] = true;
            var database = model.databases[name];
            if (database.triggersDatabase) {
                handleDatabase(database.triggersDatabase);
            }
            if (database.schemaDatabase) {
                handleDatabase(database.schemaDatabase);
            }
            if (database.securityDatabase) {
                handleDatabase(database.securityDatabase);
            }
            modelVisitor.onDatabase(database);
        }
    }
    if (modelVisitor.onDatabase) {
        Object.keys(model.databases).forEach(handleDatabase);
    }
    if (modelVisitor.onServer) {
        Object.keys(model.servers).forEach(function (name) {
            modelVisitor.onServer(model.servers[name]);
        });
    }
}
exports.visitModel = visitModel;
//# sourceMappingURL=modelVisitor.js.map
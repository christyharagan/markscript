var marklogic_1 = require('marklogic');
function createTestClient(port) {
    if (port === void 0) { port = 8001; }
    return marklogic_1.createDatabaseClient({
        user: 'admin',
        password: 'passw0rd',
        host: 'localhost',
        port: port
    });
}
exports.createTestClient = createTestClient;
//# sourceMappingURL=createTestClient.js.map
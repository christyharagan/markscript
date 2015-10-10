require('should');
require('should-promised');
var createTestClient_1 = require('../../createTestClient');
var getAlert_1 = require('../../../lib/admin/alerts/getAlert');
var installAlert_1 = require('../../../lib/admin/alerts/installAlert');
var TEST_DOC_1 = '/triggering/testDoc.json';
var TEST_DOC_2 = 'generatedDoc2.json';
var TEST_ALERT = 'testAlert';
var TEST_DATABASE = 'testDatabase';
var CREATE_TEST_DOC = '/testModules/createTestDoc.sjs';
var testModule = "\nmodule.exports = function(uri, content) {\n  declareUpdate();\n  xdmp.documentInsert(uri.toString().trim(), content);\n  //xdmp.documentInsert('" + TEST_DOC_2 + "', content);\n}";
describe('install and delete an alert', function () {
    this.timeout(5000);
    it('should create a new alert which creates a document, and then should the alert should be deleted', function () {
        return createANewAleart().catch(function (e) {
            console.log(e);
            throw e;
        }).should.be.fulfilled;
    });
});
function createANewAleart() {
    var adminClient = createTestClient_1.createTestClient();
    var clientClient = createTestClient_1.createTestClient(8000);
    return new Promise(function (resolve, reject) {
        clientClient.config.resources.read(CREATE_TEST_DOC).result(function () {
            reject('Test Module should not exist before calling tests');
        }, resolve);
    }).then(function () {
        return new Promise(function (resolve, reject) {
            clientClient.documents.read(TEST_DOC_1).result(function () {
                reject('Test Document should not exist before calling tests');
            }, resolve);
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            clientClient.documents.read(TEST_DOC_2).result(function () {
                reject('Test Document should not exist before calling tests');
            }, resolve);
        });
    }).then(function () {
        return getAlert_1.getAlert(clientClient, TEST_ALERT);
    }).then(function () {
        throw 'Test Alert should not exist before calling tests';
    }).catch(function () {
        return new Promise(function (resolve, reject) {
            clientClient.config.extlibs.write({
                path: CREATE_TEST_DOC,
                contentType: 'application/vnd.marklogic-javascript',
                source: testModule
            }).result(resolve, reject);
        });
    }).then(function () {
        return installAlert_1.installAlert(clientClient, {
            alertUri: TEST_ALERT,
            alertName: TEST_ALERT,
            actionName: CREATE_TEST_DOC,
            actionModule: '/ext/' + CREATE_TEST_DOC + '.sjs',
            triggerScope: '/triggering/',
            triggerCommit: 'pre'
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            return clientClient.eval("declareUpdate();xdmp.documentInsert('" + TEST_DOC_1 + "', {Hello: 'World'});").result(resolve, reject);
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            clientClient.documents.read([TEST_DOC_1, TEST_DOC_2]).result(resolve, reject);
        });
    }).then(function (docs) {
        docs[0].should.equal('Hello World');
        docs[1].should.equal('Hello World');
    });
}
exports.createANewAleart = createANewAleart;
//# sourceMappingURL=installAndDeleteAlert.js.map
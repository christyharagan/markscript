import 'should'
import 'should-promised'
import {createTestClient} from '../../createTestClient'
import {getAlert} from '../../../lib/admin/alerts/getAlert'
import {installAlert} from '../../../lib/admin/alerts/installAlert'
import {deleteAlert} from '../../../lib/admin/alerts/deleteAlert'
import {createDatabase, getDatabase, deleteDatabase} from 'ml-admin'

const TEST_DOC_1 = '/triggering/testDoc.json'
const TEST_DOC_2 = 'generatedDoc2.json'
const TEST_ALERT = 'testAlert'
const TEST_DATABASE = 'testDatabase'
const CREATE_TEST_DOC = '/testModules/createTestDoc.sjs'
const testModule = `
module.exports = function(uri, content) {
  declareUpdate();
  xdmp.documentInsert(uri.toString().trim(), content);
  //xdmp.documentInsert('${TEST_DOC_2}', content);
}`

describe('install and delete an alert', function() {
  this.timeout(5000)
  it('should create a new alert which creates a document, and then should the alert should be deleted', function() {
    return createANewAleart().catch(function(e) {
      console.log(e)
      throw e
    }).should.be.fulfilled()
  })
})

export function createANewAleart() {
  let adminClient = createTestClient()
  let clientClient = createTestClient(8000)

  return new Promise(function(resolve, reject) {
    clientClient.config.resources.read(CREATE_TEST_DOC).result(function() {
      reject('Test Module should not exist before calling tests')
    }, resolve)
  }).then(function(e:{statusCode:number}) {
    e.statusCode.should.equal(404)
    return new Promise(function(resolve, reject) {
      clientClient.documents.read(TEST_DOC_1).result(function() {
        reject('Test Document should not exist before calling tests')
      }, resolve)
    })
  }).then(function(e:{statusCode:number}) {
    e.statusCode.should.equal(404)
    return new Promise(function(resolve, reject) {
      clientClient.documents.read(TEST_DOC_2).result(function() {
        reject('Test Document should not exist before calling tests')
      }, resolve)
    })
  }).then(function() {
    return getAlert(clientClient, TEST_ALERT)
  }).then(function() {
    throw 'Test Alert should not exist before calling tests'
  }).catch(function() {
    return new Promise<void>(function(resolve, reject) {
      clientClient.config.extlibs.write({
        path: CREATE_TEST_DOC,
        contentType: 'application/vnd.marklogic-javascript',
        source: testModule
      }).result(resolve, reject)
    })
  }).then(function() {
    return installAlert(clientClient, {
      alertUri: TEST_ALERT,
      alertName: TEST_ALERT,
      actionName: CREATE_TEST_DOC,
      actionModule: '/ext/' + CREATE_TEST_DOC + '.sjs',
      triggerScope: '/triggering/',
      triggerCommit: 'pre'
    })
  }).then(function() {
    return new Promise(function(resolve, reject) {
      return clientClient.eval(`declareUpdate();xdmp.documentInsert('${TEST_DOC_1}', {Hello: 'World'});`).result(resolve, reject)
    })
  }).then(function() {
    return new Promise(function(resolve, reject) {
      clientClient.documents.read([TEST_DOC_1, TEST_DOC_2]).result(resolve, reject)
    })
  }).then(function(docs) {
    docs[0].should.equal('Hello World')
    docs[1].should.equal('Hello World')
  })
}

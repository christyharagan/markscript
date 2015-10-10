import {createDatabaseClient, DatabaseClient} from 'marklogic'

export function createTestClient(port=8001): DatabaseClient {
  return createDatabaseClient({
    user: 'admin',
    password: 'passw0rd',
    host: 'localhost',
    port: port
  })
}

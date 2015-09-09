import {BuildOptions} from 'markscript'
import {TypeScriptExample} from './lib/sampleDatabaseModel'
import * as path from 'path'

export const COMMON = {
  appName: 'markscript-ts-examples',
  ml: {
    port: 8005,
    host: 'christys-macbook-pro.local',
    user: 'admin',
    password: 'passw0rd'
  }
}

export const buildOptions: BuildOptions = {
  database: {
    host: COMMON.ml.host,
    httpPort: COMMON.ml.port,
    adminPort: 8001,
    configPort: 8002,
    user: COMMON.ml.user,
    password: COMMON.ml.password,
    modelObject: new TypeScriptExample(COMMON.appName, COMMON.ml.host, COMMON.ml.port),
    modules: './lib/**/*.ts'
  },
  middle: {
    host: 'localhost',
    port: 8080
  }
}

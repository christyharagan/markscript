import * as ml from 'marklogic'
import * as s from 'typescript-schema'

export interface User {
  name: string
  password: string
}

export interface Model {
  databases: { [database: string]: DatabaseSpec }
  servers: { [server: string]: ServerSpec }
  contentDatabase?: string
  modulesDatabase?: string
  securityDatabase?: string
  schemaDatabase?: string
  triggersDatabase?: string
}

export interface AssetModel {
  ruleSets?: RuleSetSpec[],
  modules?: { [name: string]: ModuleSpec }
  extensions?: { [name: string]: ExtensionSpec }
  tasks?: { [name: string]: TaskSpec }
  alerts?: { [name: string]: AlertSpec }
}

export interface RuleSetSpec {
  path: string
  rules: string
}

export interface ModuleSpec {
  name: string
  code: string
}

export interface ExtensionSpec {
  name: string
  code?: string
}

export enum IF_EXISTS {
  recreate,
  clear,
  ignore,
  fail
}

export enum TRIGGER_COMMIT {
  PRE, POST
}

export enum TRIGGER_STATE {
  CREATE, MODIFY, DELETE
}

export interface MethodReference extends s.Reference {
  methodName: string
}

export interface AlertSpec {
  name: string
  scope: string
  states?: TRIGGER_STATE[]
  depth?: number
  commit?: TRIGGER_COMMIT
  actionModule: string
}

export enum FrequencyType {
  MINUTES, HOURS, DAYS
}

export interface TaskSpec {
  name: string
  module: string
  type: FrequencyType
  frequency: number
  user: string
}

export interface ForestSpec {
  name: string
  host?: string
  database?: string
}

export interface ServerSpec {
  name: string
  contentDatabase?: string
  modulesDatabase?: string
  host?: string
  port?: number
  group?: string
}

export interface DatabaseSpec {
  name: string
  triggersDatabase?: string
  securityDatabase?: string
  schemaDatabase?: string
  rangeIndices?: RangeIndexSpec[]
  geoIndices?: GeoIndexSpec[]
  forests?: ForestSpec[]
  triples?: boolean
  defaultRulesets?: string[]
}

export interface RangeIndexSpec {
  database?: string
  path: string
  scalarType: string
  collation?: string
  invalidValues?: string
  rangeValuePositions?: boolean
}

export interface GeoIndexSpec {
  database?: string
  path: string
  coordinateSystem?: string
  pointFormat?: string
  invalidValues?: string
  rangeValuePositions?: boolean
}

export interface Document<T> {
  uri: string
  content: T
}

declare module MarkScript {
  interface Model {
    databases: {
      [database: string]: DatabaseSpec
    }
    servers: {
      [server: string]: ServerSpec
    }
    contentDatabase?: string
    modulesDatabase?: string
    securityDatabase?: string
    schemaDatabase?: string
    triggersDatabase?: string
  }

  interface AssetModel {
    ruleSets?: RuleSetSpec[]
    modules?: {
      [name: string]: ModuleSpec
    }
    extensions?: {
      [name: string]: ExtensionSpec
    }
    tasks?: {
      [name: string]: TaskSpec
    }
    alerts?: {
      [name: string]: AlertSpec
    }
  }

  interface RuleSetSpec {
    path: string
    rules: string
  }
  interface ModuleSpec {
    name: string
    code: string
  }
  interface ExtensionSpec {
    name: string
    code?: string
  }
  enum TRIGGER_COMMIT {
    PRE = 0,
    POST = 1
  }
  enum TRIGGER_STATE {
    CREATE = 0,
    MODIFY = 1,
    DELETE = 2
  }
  interface AlertSpec {
    name: string
    scope: string
    states?: TRIGGER_STATE[]
    depth?: number
    commit?: TRIGGER_COMMIT
    actionModule: string
  }
  enum FrequencyType {
    MINUTES = 0,
    HOURS = 1,
    DAYS = 2
  }
  interface TaskSpec {
    name: string
    module: string
    type: FrequencyType
    frequency: number
    user: string
  }
  interface ForestSpec {
    name: string
    host?: string
    database?: string
  }
  interface ServerSpec {
    name: string
    contentDatabase?: string
    modulesDatabase?: string
    host?: string
    port?: number
    group?: string
  }
  interface DatabaseSpec {
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
  interface RangeIndexSpec {
    database?: string
    path: string
    scalarType: string
    collation?: string
    invalidValues?: string
    rangeValuePositions?: boolean
  }
  interface GeoIndexSpec {
    database?: string
    path: string
    coordinateSystem?: string
    pointFormat?: string
    invalidValues?: string
    rangeValuePositions?: boolean
  }
}

import * as s from 'typescript-schema';
export interface User {
    name: string;
    password: string;
}
export interface Model {
    databases: {
        [database: string]: DatabaseSpec;
    };
    servers: {
        [server: string]: ServerSpec;
    };
    contentDatabase?: string;
    modulesDatabase?: string;
    securityDatabase?: string;
    schemaDatabase?: string;
    triggersDatabase?: string;
}
export interface AssetModel {
    ruleSets?: RuleSetSpec[];
    modules?: {
        [name: string]: ModuleSpec;
    };
    extensions?: {
        [name: string]: ExtensionSpec;
    };
    tasks?: {
        [name: string]: TaskSpec;
    };
    alerts?: {
        [name: string]: AlertSpec;
    };
}
export interface RuleSetSpec {
    path: string;
    rules: string;
}
export interface ModuleSpec {
    name: string;
    code: string;
}
export interface ExtensionSpec {
    name: string;
    code?: string;
}
export declare enum IF_EXISTS {
    recreate = 0,
    clear = 1,
    ignore = 2,
    fail = 3,
}
export declare enum TRIGGER_COMMIT {
    PRE = 0,
    POST = 1,
}
export declare enum TRIGGER_STATE {
    CREATE = 0,
    MODIFY = 1,
    DELETE = 2,
}
export interface MethodReference extends s.Reference {
    methodName: string;
}
export interface AlertSpec {
    name: string;
    scope: string;
    states?: TRIGGER_STATE[];
    depth?: number;
    commit?: TRIGGER_COMMIT;
    actionModule: string;
}
export declare enum FrequencyType {
    MINUTES = 0,
    HOURS = 1,
    DAYS = 2,
}
export interface TaskSpec {
    name: string;
    module: string;
    type: FrequencyType;
    frequency: number;
    user: string;
}
export interface ForestSpec {
    name: string;
    host?: string;
    database?: string;
}
export interface ServerSpec {
    name: string;
    contentDatabase?: string;
    modulesDatabase?: string;
    host?: string;
    port?: number;
    group?: string;
}
export interface DatabaseSpec {
    name: string;
    triggersDatabase?: string;
    securityDatabase?: string;
    schemaDatabase?: string;
    rangeIndices?: RangeIndexSpec[];
    geoIndices?: GeoIndexSpec[];
    forests?: ForestSpec[];
    triples?: boolean;
    defaultRulesets?: string[];
}
export interface RangeIndexSpec {
    database?: string;
    path: string;
    scalarType: string;
    collation?: string;
    invalidValues?: string;
    rangeValuePositions?: boolean;
}
export interface GeoIndexSpec {
    database?: string;
    path: string;
    coordinateSystem?: string;
    pointFormat?: string;
    invalidValues?: string;
    rangeValuePositions?: boolean;
}
export interface Document<T> {
    uri: string;
    content: T;
}

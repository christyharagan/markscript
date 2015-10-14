import * as m from './model';
import * as s from 'typescript-schema';
import { DatabaseClient } from 'marklogic';
export interface BuildModelPlugin<O, M> {
    generate(buildModel: BuildModel, options: BuildConfig & O, pkgDir?: string, typeModel?: s.KeyValue<s.reflective.Module>): BuildModel & M;
    jsonify?(buildModel: M): any;
    dejsonify?(jsonifiedModel: any): M;
}
export declare type TypeModel = s.KeyValue<s.reflective.Module>;
export declare type BuildModel = m.Model & m.AssetModel;
export declare type Task<S extends Server> = ((buildModel: BuildModel, buildConfig: BuildConfig, server: S) => void) & {
    requiresFreshModel?: boolean;
};
export interface Server {
    getClient(portOrDatabase?: number | string): DatabaseClient;
}
export interface ServerConstructor<S extends Server> {
    new (buildModel: BuildModel, buildConfig: BuildConfig, pkgDir?: string): S;
}
export interface BuildConfig {
    databaseConnection: {
        host: string;
        httpPort: number;
        adminPort?: number;
        configPort?: number;
        user: string;
        password?: string;
    };
}
export declare enum BuildModelPersistance {
    NONE = 0,
    NO_SOURCE = 1,
    ALL = 2,
}
export interface BuildOptions {
    buildConfig: BuildConfig;
    pkgDir: string;
    isTypeScript?: boolean;
    plugins: BuildModelPlugin<any, any>[];
    server?: ServerConstructor<any>;
    tasks?: Task<any>[];
    typeModel?: s.KeyValue<s.reflective.Module>;
    buildModelPersistance?: BuildModelPersistance;
    buildModelPersistanceFolder?: string;
}
export declare class Build {
    options: BuildOptions;
    constructor(options: BuildOptions);
    runTasks(names: string | string[]): void;
}
export declare class CoreServer implements Server {
    buildConfig: BuildConfig;
    constructor(buildModel: BuildModel, buildConfig: BuildConfig);
    getClient(portOrDatabase?: number | string): DatabaseClient;
}

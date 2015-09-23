import * as s from 'typescript-schema';
import * as m from './model';
export interface Plugin<Options> {
    generateModel(databaseModel: m.Model & m.AssetModel, pluginOptions?: Options, options?: BuildOptions): any;
    serialiseModel(databaseModel: m.Model & m.AssetModel, pluginOptions?: Options, options?: BuildOptions): {
        [modelName: string]: string;
    };
}
export declare type PluginAndOptions<Options> = [Plugin<Options>, Options];
export interface BuildOptions {
    database: {
        host: string;
        httpPort: number;
        adminPort?: number;
        configPort?: number;
        user: string;
        password: string;
        modelObject?: Object;
        model?: m.Model & m.AssetModel;
        defaultTaskUser?: string;
        modules?: string | string[];
        ruleSets?: m.RuleSetSpec[];
        tasks?: m.TaskSpec[];
        alerts?: m.AlertSpec[];
        extensions?: {
            [extensionName: string]: string;
        };
    };
    middle: {
        host: string;
        port: number;
    };
    plugins?: {
        [pluginName: string]: PluginAndOptions<any>;
    };
    pkgDir?: string;
    typeModel?: s.KeyValue<s.reflective.Module>;
}
export declare class Build {
    protected options: BuildOptions;
    constructor(options: BuildOptions);
    loadModel(dirName?: string): void;
    writeModel(dirName?: string): void;
    buildModel(): void;
    createDatabase(): Promise<boolean>;
    removeDatabase(): Promise<boolean>;
    deployAssets(): Promise<boolean>;
    undeployAssets(): Promise<boolean>;
}

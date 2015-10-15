import { DatabaseClient } from 'marklogic';
export interface Runtime {
    getClient(portOrDatabase?: number | string): DatabaseClient;
}
export declare class CoreRuntime implements Runtime {
    buildConfig: MarkScript.BuildConfig;
    constructor(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig);
    getClient(portOrDatabase?: number | string): DatabaseClient;
}

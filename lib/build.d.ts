import * as s from 'typescript-schema';
export interface BuildModelPlugin<C, M> {
    generate?(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig & C, pkgDir?: string, typeModel?: s.KeyValue<s.reflective.Module>): MarkScript.BuildModel & M;
    jsonify?(buildModel: M, buildConfig?: MarkScript.BuildConfig & C, pkgDir?: string, typeModel?: s.KeyValue<s.reflective.Module>): any;
    dejsonify?(jsonifiedModel: any): M;
    tasks?: {
        [name: string]: MarkScript.Task;
    };
}
export declare type TypeModel = s.KeyValue<s.reflective.Module>;
export interface BuildOptions extends MarkScript.Build {
    plugins: BuildModelPlugin<any, any>[];
    isTypeScript?: boolean;
    typeModel?: s.KeyValue<s.reflective.Module>;
}
export declare class Build {
    options: BuildOptions;
    tasks: {
        [name: string]: MarkScript.Task;
    };
    constructor(options: BuildOptions);
    runTasks(names: string | string[]): void;
}

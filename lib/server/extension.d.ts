export interface Context {
    inputTypes: string[];
    acceptTypes: string[];
    outputHeaders: {
        [header: string]: string;
    };
    outputStatus: [number, string];
    outputTypes: string[];
}
export declare type Parameters = {
    [param: string]: (string | number | boolean | string[] | number[] | boolean[]);
};
export interface Extension {
    get?(context: Context, params: Parameters): any;
    post?(context: Context, params: Parameters, input: cts.DocumentNode<any> | cts.ValueIterator<any>): any;
    put?(context: Context, params: Parameters, input: cts.DocumentNode<any> | cts.ValueIterator<any>): any;
    delete?(context: Context, params: Parameters): any;
}

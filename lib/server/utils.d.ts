export declare function deleteAll(dir: string): void;
export declare function deleteGraph(graph?: string): void;
export declare function createCounter(uri: string): void;
export declare function incrementCounter(uri: string): number;
export interface Counter {
    count: number;
}

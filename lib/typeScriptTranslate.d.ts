export declare function cleanAndTranslateTypeScript(code: {
    [relFiles: string]: string;
}, tmpDir: string, outDir: string): {
    [relPath: string]: string;
};
export declare function translateTypeScript(baseDir: string, relFiles: string[], outDir: string): string[];

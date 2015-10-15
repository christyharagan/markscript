export interface ModelVisitor {
    onDatabase?(database: MarkScript.DatabaseSpec): void;
    onServer?(server: MarkScript.ServerSpec): void;
}
export declare function visitModel(modelVisitor: ModelVisitor, model: MarkScript.Model): void;

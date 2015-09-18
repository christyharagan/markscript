import * as m from './model';
export interface ModelVisitor {
    onDatabase?(database: m.DatabaseSpec): void;
    onServer?(server: m.ServerSpec): void;
}
export declare function visitModel(modelVisitor: ModelVisitor, model: m.Model): void;

import * as m from './model';
import { Extension } from './server/extension';
export declare function contentDatabase(): (target: Object, propertyKey: string) => void;
export declare function triggersDatabase(): (target: Object, propertyKey: string) => void;
export declare function schemaDatabase(): (target: Object, propertyKey: string) => void;
export declare function modulesDatabase(): (target: Object, propertyKey: string) => void;
export declare function securityDatabase(): (target: Object, propertyKey: string) => void;
export declare enum ScalarType {
    int = 0,
    unsignedInt = 1,
    long = 2,
    unsignedLong = 3,
    float = 4,
    double = 5,
    decimal = 6,
    dateTime = 7,
    time = 8,
    date = 9,
    gYearMonth = 10,
    gYear = 11,
    gMonth = 12,
    gDay = 13,
    yearMonthDuration = 14,
    dayTimeDuration = 15,
    string = 16,
    anyURI = 17,
}
export interface RangeIndexedOptions {
    collation?: string;
    scalarType?: ScalarType;
    path?: string;
    name: string;
}
export interface GeoIndexedOptions {
    name: string;
    path?: string;
    pointFormat?: string;
    coordinateSystem?: string;
}
export interface RuleSetOptions {
    path: string;
}
export declare function mlDeploy(): (target: any) => void;
export declare function geoIndexed(definition?: GeoIndexedOptions): (target: Object, propertyKey: string) => void;
export declare function rangeIndexed(definition?: RangeIndexedOptions): (target: Object, propertyKey: string) => void;
export declare function mlRuleSet(definition: RuleSetOptions): (target: Object, propertyKey: string, method: TypedPropertyDescriptor<() => string>) => void;
export interface TaskOptions {
    type: m.FrequencyType;
    frequency: number;
    user?: string;
    name?: string;
}
export declare function mlTask(definition?: TaskOptions): (target: Object, propertyKey: string) => void;
export interface AlertOptions {
    name?: string;
    scope: string;
    states?: m.TRIGGER_STATE[];
    depth?: number;
    commit?: m.TRIGGER_COMMIT;
}
export declare function mlAlert(definition?: AlertOptions): (target: Object, propertyKey: string) => void;
export declare function mlExtension(): <S extends Extension>(target: S) => S;

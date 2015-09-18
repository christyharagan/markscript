import * as m from './model'
import * as s from 'typescript-schema'
import {Extension} from './server/extension'

export function contentDatabase() {
  return function(target: Object, propertyKey: string): void {
  }
}

export function triggersDatabase() {
  return function(target: Object, propertyKey: string): void {
  }
}

export function schemaDatabase() {
  return function(target: Object, propertyKey: string): void {
  }
}

export function modulesDatabase() {
  return function(target: Object, propertyKey: string): void {
  }
}

export function securityDatabase() {
  return function(target: Object, propertyKey: string): void {
  }
}

export enum ScalarType {
  int,
  unsignedInt,
  long,
  unsignedLong,
  float,
  double,
  decimal,
  dateTime,
  time,
  date,
  gYearMonth,
  gYear,
  gMonth,
  gDay,
  yearMonthDuration,
  dayTimeDuration,
  string,
  anyURI
}

export interface RangeIndexedOptions {
  collation?: string
  scalarType?: ScalarType
  path?: string
  name: string
}

export interface GeoIndexedOptions {
  name: string
  path?: string
  pointFormat?: string
  coordinateSystem?: string
}

export interface RuleSetOptions {
  path: string
}

export function mlDeploy() {
  return function(target: any): void {
  }
}

export function geoIndexed(definition?: GeoIndexedOptions) {
  return function(target: Object, propertyKey: string): void {
  }
}

export function rangeIndexed(definition?: RangeIndexedOptions) {
  return function(target: Object, propertyKey: string): void {
  }
}

export function mlRuleSet(definition: RuleSetOptions) {
  return function(target: Object, propertyKey: string, method: TypedPropertyDescriptor<() => string>): void {
  }
}

export interface TaskOptions {
  type: m.FrequencyType
  frequency: number
  user?: string
  name?: string
}

export function mlTask(definition?: TaskOptions) {
  return function(target: Object, propertyKey: string): void {
  }
}

export interface AlertOptions {
  name?: string
  scope: string
  states?: m.TRIGGER_STATE[]
  depth?: number
  commit?: m.TRIGGER_COMMIT
}

export function mlAlert(definition?: AlertOptions) {
  return function(target: Object, propertyKey: string): void {
  }
}

export function mlExtension() {
  return function <S extends Extension>(target: S) {
    return target
  }
}

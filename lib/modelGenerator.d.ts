import { reflective as s, KeyValue } from 'typescript-schema';
import * as m from './model';
export declare function generateAssetModel(schema: KeyValue<s.Module>, definition: Object, assetModel?: m.AssetModel, defaultTaskUser?: string): m.AssetModel;
export declare function addExtensions(assetModel: m.AssetModel, packageDir: string, extensions: {
    [name: string]: string;
}): void;
export declare function addModules(assetModel: m.AssetModel, packageDir: string, modulePaths: string[]): void;
export declare function generateModel(schema: KeyValue<s.Module>, definition: Object, defaultHost?: string): m.Model;

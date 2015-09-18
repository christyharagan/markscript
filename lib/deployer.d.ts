import * as m from './model';
import { Client } from 'marklogic';
export interface Deployer {
    deployDatabase(client: Client, ifExists: m.IF_EXISTS, database: m.DatabaseSpec): Promise<boolean>;
    undeployDatabase(client: Client, database: m.DatabaseSpec): Promise<boolean>;
    deployForest(client: Client, ifExists: m.IF_EXISTS, forest: m.ForestSpec): Promise<boolean>;
    undeployForest(client: Client, forest: m.ForestSpec): Promise<boolean>;
    deployServer(client: Client, ifExists: m.IF_EXISTS, server: m.ServerSpec): Promise<boolean>;
    undeployServer(client: Client, server: m.ServerSpec): Promise<boolean>;
}
export interface AssetDeployer {
    deployRuleSet(client: Client, spec: m.RuleSetSpec): Promise<boolean>;
    undeployRuleSet(client: Client, spec: m.RuleSetSpec): Promise<boolean>;
    deployModule(client: Client, spec: m.ModuleSpec): Promise<boolean>;
    undeployModule(client: Client, spec: m.ModuleSpec): Promise<boolean>;
    deployExtension(client: Client, spec: m.ExtensionSpec): Promise<boolean>;
    undeployExtension(client: Client, spec: m.ExtensionSpec): Promise<boolean>;
    deployAlert(client: Client, spec: m.AlertSpec): Promise<boolean>;
    undeployAlert(client: Client, spec: m.AlertSpec): Promise<boolean>;
    deployTask(client: Client, spec: m.TaskSpec, model: m.Model): Promise<boolean>;
    undeployTask(client: Client, spec: m.TaskSpec, model: m.Model): Promise<boolean>;
}
export declare function deploy(client: Client, deployer: Deployer, ifExists: m.IF_EXISTS, model: m.Model): Promise<boolean>;
export declare function undeploy(client: Client, deployer: Deployer, model: m.Model): Promise<boolean>;
export declare function deployAssets(adminClient: Client, configClient: Client, createClient: (database: string) => Client, deployer: AssetDeployer, model: m.Model, assetModel: m.AssetModel): Promise<boolean>;
export declare function undeployAssets(client: Client, deployer: Deployer, model: m.Model): Promise<boolean>;
export declare class StandardAssetDeployer implements AssetDeployer {
    deployRuleSet(client: Client, spec: m.RuleSetSpec): Promise<boolean>;
    undeployRuleSet(client: Client, spec: m.RuleSetSpec): Promise<boolean>;
    deployModule(client: Client, spec: m.ModuleSpec): Promise<boolean>;
    undeployModule(client: Client, spec: m.ModuleSpec): Promise<boolean>;
    deployExtension(client: Client, spec: m.ExtensionSpec): Promise<boolean>;
    undeployExtension(client: Client, spec: m.ExtensionSpec): Promise<boolean>;
    deployAlert(client: Client, spec: m.AlertSpec): Promise<boolean>;
    undeployAlert(client: Client, spec: m.AlertSpec): Promise<boolean>;
    deployTask(client: Client, spec: m.TaskSpec, model: m.Model): Promise<boolean>;
    undeployTask(client: Client, spec: m.TaskSpec): Promise<boolean>;
}
export declare class StandardDeployer implements Deployer {
    deployDatabase(client: Client, ifExists: m.IF_EXISTS, database: m.DatabaseSpec): Promise<boolean>;
    cleanDatabase(client: Client, database: m.DatabaseSpec): Promise<boolean>;
    undeployDatabase(client: Client, database: m.DatabaseSpec): Promise<boolean>;
    deployForest(client: Client, ifExists: m.IF_EXISTS, forest: m.ForestSpec): Promise<boolean>;
    undeployForest(client: Client, forest: m.ForestSpec): Promise<boolean>;
    deployServer(client: Client, ifExists: m.IF_EXISTS, server: m.ServerSpec): Promise<boolean>;
    undeployServer(client: Client, server: m.ServerSpec): Promise<boolean>;
}

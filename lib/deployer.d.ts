import * as m from './model';
import { DatabaseClient } from 'marklogic';
export interface Deployer {
    deployDatabase(client: DatabaseClient, ifExists: m.IF_EXISTS, database: m.DatabaseSpec): Promise<boolean>;
    undeployDatabase(client: DatabaseClient, database: m.DatabaseSpec): Promise<boolean>;
    deployForest(client: DatabaseClient, ifExists: m.IF_EXISTS, forest: m.ForestSpec): Promise<boolean>;
    undeployForest(client: DatabaseClient, forest: m.ForestSpec): Promise<boolean>;
    deployServer(client: DatabaseClient, ifExists: m.IF_EXISTS, server: m.ServerSpec): Promise<boolean>;
    undeployServer(client: DatabaseClient, server: m.ServerSpec): Promise<boolean>;
}
export interface AssetDeployer {
    deployRuleSet(client: DatabaseClient, spec: m.RuleSetSpec): Promise<boolean>;
    undeployRuleSet(client: DatabaseClient, spec: m.RuleSetSpec): Promise<boolean>;
    deployModule(client: DatabaseClient, spec: m.ModuleSpec): Promise<boolean>;
    undeployModule(client: DatabaseClient, spec: m.ModuleSpec): Promise<boolean>;
    deployExtension(client: DatabaseClient, spec: m.ExtensionSpec): Promise<boolean>;
    undeployExtension(client: DatabaseClient, spec: m.ExtensionSpec): Promise<boolean>;
    deployAlert(client: DatabaseClient, spec: m.AlertSpec): Promise<boolean>;
    undeployAlert(client: DatabaseClient, spec: m.AlertSpec): Promise<boolean>;
    deployTask(client: DatabaseClient, spec: m.TaskSpec, model: m.Model): Promise<boolean>;
    undeployTask(client: DatabaseClient, spec: m.TaskSpec, model: m.Model): Promise<boolean>;
}
export declare function deploy(client: DatabaseClient, deployer: Deployer, ifExists: m.IF_EXISTS, model: m.Model): Promise<boolean>;
export declare function undeploy(client: DatabaseClient, deployer: Deployer, model: m.Model): Promise<boolean>;
export declare function deployAssets(adminClient: DatabaseClient, configClient: DatabaseClient, createClient: (database: string) => DatabaseClient, deployer: AssetDeployer, model: m.Model, assetModel: m.AssetModel): Promise<boolean>;
export declare function undeployAssets(client: DatabaseClient, deployer: Deployer, model: m.Model): Promise<boolean>;
export declare class StandardAssetDeployer implements AssetDeployer {
    deployRuleSet(client: DatabaseClient, spec: m.RuleSetSpec): Promise<boolean>;
    undeployRuleSet(client: DatabaseClient, spec: m.RuleSetSpec): Promise<boolean>;
    deployModule(client: DatabaseClient, spec: m.ModuleSpec): Promise<boolean>;
    undeployModule(client: DatabaseClient, spec: m.ModuleSpec): Promise<boolean>;
    deployExtension(client: DatabaseClient, spec: m.ExtensionSpec): Promise<boolean>;
    undeployExtension(client: DatabaseClient, spec: m.ExtensionSpec): Promise<boolean>;
    deployAlert(client: DatabaseClient, spec: m.AlertSpec): Promise<boolean>;
    undeployAlert(client: DatabaseClient, spec: m.AlertSpec): Promise<boolean>;
    deployTask(client: DatabaseClient, spec: m.TaskSpec, model: m.Model): Promise<boolean>;
    undeployTask(client: DatabaseClient, spec: m.TaskSpec): Promise<boolean>;
}
export declare class StandardDeployer implements Deployer {
    deployDatabase(client: DatabaseClient, ifExists: m.IF_EXISTS, database: m.DatabaseSpec): Promise<boolean>;
    cleanDatabase(client: DatabaseClient, database: m.DatabaseSpec): Promise<boolean>;
    undeployDatabase(client: DatabaseClient, database: m.DatabaseSpec): Promise<boolean>;
    deployForest(client: DatabaseClient, ifExists: m.IF_EXISTS, forest: m.ForestSpec): Promise<boolean>;
    undeployForest(client: DatabaseClient, forest: m.ForestSpec): Promise<boolean>;
    deployServer(client: DatabaseClient, ifExists: m.IF_EXISTS, server: m.ServerSpec): Promise<boolean>;
    undeployServer(client: DatabaseClient, server: m.ServerSpec): Promise<boolean>;
}

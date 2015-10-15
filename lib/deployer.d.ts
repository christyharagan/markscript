import { DatabaseClient } from 'marklogic';
export declare enum IF_EXISTS {
    recreate = 0,
    clear = 1,
    ignore = 2,
    fail = 3,
}
export interface Deployer {
    deployDatabase(client: DatabaseClient, ifExists: IF_EXISTS, database: MarkScript.DatabaseSpec): Promise<boolean>;
    undeployDatabase(client: DatabaseClient, database: MarkScript.DatabaseSpec): Promise<boolean>;
    deployForest(client: DatabaseClient, ifExists: IF_EXISTS, forest: MarkScript.ForestSpec): Promise<boolean>;
    undeployForest(client: DatabaseClient, forest: MarkScript.ForestSpec): Promise<boolean>;
    deployServer(client: DatabaseClient, ifExists: IF_EXISTS, server: MarkScript.ServerSpec): Promise<boolean>;
    undeployServer(client: DatabaseClient, server: MarkScript.ServerSpec): Promise<boolean>;
}
export interface AssetDeployer {
    deployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean>;
    undeployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean>;
    deployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean>;
    undeployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean>;
    deployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean>;
    undeployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean>;
    deployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean>;
    undeployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean>;
    deployTask(client: DatabaseClient, spec: MarkScript.TaskSpec, model: MarkScript.Model): Promise<boolean>;
    undeployTask(client: DatabaseClient, spec: MarkScript.TaskSpec, model: MarkScript.Model): Promise<boolean>;
}
export declare function deploy(client: DatabaseClient, deployer: Deployer, ifExists: IF_EXISTS, model: MarkScript.Model): Promise<boolean>;
export declare function undeploy(client: DatabaseClient, deployer: Deployer, model: MarkScript.Model): Promise<boolean>;
export declare function deployAssets(adminClient: DatabaseClient, configClient: DatabaseClient, createClient: (database: string) => DatabaseClient, deployer: AssetDeployer, model: MarkScript.Model, assetModel: MarkScript.AssetModel): Promise<boolean>;
export declare function undeployAssets(client: DatabaseClient, deployer: Deployer, model: MarkScript.Model): Promise<boolean>;
export declare class StandardAssetDeployer implements AssetDeployer {
    deployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean>;
    undeployRuleSet(client: DatabaseClient, spec: MarkScript.RuleSetSpec): Promise<boolean>;
    deployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean>;
    undeployModule(client: DatabaseClient, spec: MarkScript.ModuleSpec): Promise<boolean>;
    deployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean>;
    undeployExtension(client: DatabaseClient, spec: MarkScript.ExtensionSpec): Promise<boolean>;
    deployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean>;
    undeployAlert(client: DatabaseClient, spec: MarkScript.AlertSpec): Promise<boolean>;
    deployTask(client: DatabaseClient, spec: MarkScript.TaskSpec, model: MarkScript.Model): Promise<boolean>;
    undeployTask(client: DatabaseClient, spec: MarkScript.TaskSpec): Promise<boolean>;
}
export declare class StandardDeployer implements Deployer {
    deployDatabase(client: DatabaseClient, ifExists: IF_EXISTS, database: MarkScript.DatabaseSpec): Promise<boolean>;
    cleanDatabase(client: DatabaseClient, database: MarkScript.DatabaseSpec): Promise<boolean>;
    undeployDatabase(client: DatabaseClient, database: MarkScript.DatabaseSpec): Promise<boolean>;
    deployForest(client: DatabaseClient, ifExists: IF_EXISTS, forest: MarkScript.ForestSpec): Promise<boolean>;
    undeployForest(client: DatabaseClient, forest: MarkScript.ForestSpec): Promise<boolean>;
    deployServer(client: DatabaseClient, ifExists: IF_EXISTS, server: MarkScript.ServerSpec): Promise<boolean>;
    undeployServer(client: DatabaseClient, server: MarkScript.ServerSpec): Promise<boolean>;
}

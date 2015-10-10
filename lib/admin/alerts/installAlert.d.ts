import { DatabaseClient } from 'marklogic';
export interface AlertConfig {
    alertName: string;
    alertDescription?: string;
    alertUri: string;
    actionName: string;
    actionDescription?: string;
    actionModule: string;
    ruleName?: string;
    ruleDescription?: string;
    ruleModule?: string;
    triggerScope?: string;
    triggerStates?: string[];
    triggerDepth?: number;
    triggerCommit?: string;
    triggerDomain?: string;
}
export declare function installAlert(client: DatabaseClient, config: AlertConfig): Promise<boolean>;

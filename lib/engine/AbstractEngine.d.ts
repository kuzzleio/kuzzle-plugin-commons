import { PluginContext, EmbeddedSDK, Plugin } from 'kuzzle';
import { ConfigManager } from '../config';
import { EngineContent } from './EngineContent';
export declare abstract class AbstractEngine<TPlugin extends Plugin> {
    protected context: PluginContext;
    protected config: TPlugin['config'];
    protected pluginName: string;
    protected adminIndex: string;
    protected adminConfigManager: ConfigManager;
    protected engineConfigManager: ConfigManager;
    configType: string;
    get sdk(): EmbeddedSDK;
    /**
     * @param pluginName Used to define http routes
     * @param plugin Plugin instance
     * @param index Name of admin index to store engine documents
     * @param adminConfigManager ConfigManager instance for admin index to register engine mappings
     * @param engineConfigManager ConfigManager instance for engine index to create config collection
     */
    constructor(pluginName: string, plugin: Plugin, adminIndex: string, adminConfigManager: ConfigManager, engineConfigManager: ConfigManager);
    init(...args: any[]): Promise<any>;
    protected abstract onCreate(index: string, group: string): Promise<{
        collections: string[];
    }>;
    protected abstract onUpdate(index: string, group: string): Promise<{
        collections: string[];
    }>;
    protected abstract onDelete(index: string): Promise<{
        collections: string[];
    }>;
    create(index: string, group?: string): Promise<{
        collections: string[];
    }>;
    update(index: string, group?: string): Promise<{
        collections: string[];
    }>;
    delete(index: string): Promise<{
        collections: string[];
    }>;
    list(group?: string): Promise<Array<EngineContent>>;
    exists(index: string): Promise<boolean>;
    /**
     * Creates the engine index if it does not exists
     */
    private createEngineIndex;
    protected engineId(index: string): string;
    protected logError(index: string, message: string, error: Error): void;
}

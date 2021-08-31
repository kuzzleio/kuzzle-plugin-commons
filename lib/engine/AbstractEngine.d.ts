import { PluginContext, EmbeddedSDK, JSONObject, Plugin } from 'kuzzle';
export declare abstract class AbstractEngine {
    protected context: PluginContext;
    protected config: JSONObject;
    protected pluginName: string;
    configType: string;
    get sdk(): EmbeddedSDK;
    /**
     * @param pluginName Used to define http routes
     * @param config Plugin config
     * @param context Plugin context
     */
    constructor(pluginName: string, plugin: Plugin);
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
    list(): Promise<Array<{
        index: string;
    }>>;
    exists(index: string): Promise<boolean>;
    /**
     * Creates the engine index if it does not exists
     */
    private createEngineIndex;
    protected engineId(index: string): string;
    protected logError(engineIndex: string, message: string, error: Error): void;
}

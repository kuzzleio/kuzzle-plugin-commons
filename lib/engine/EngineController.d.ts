import { ControllerDefinition, KuzzleRequest, EmbeddedSDK, Plugin } from 'kuzzle';
import { AbstractEngine } from './AbstractEngine';
export declare class EngineController<TPlugin extends Plugin> {
    private engine;
    private context;
    private config;
    private pluginName;
    definition: ControllerDefinition;
    get sdk(): EmbeddedSDK;
    /**
     * @param pluginName Used to define http routes
     * @param plugin Plugin instance
     * @param engine Engine used
     */
    constructor(pluginName: string, plugin: Plugin, engine: AbstractEngine<TPlugin>);
    create(request: KuzzleRequest): Promise<{
        index: string;
        collections: string[];
    }>;
    update(request: KuzzleRequest): Promise<{
        index: string;
        collections: string[];
    }>;
    delete(request: KuzzleRequest): Promise<{
        index: string;
        collections: string[];
    }>;
    list(): Promise<{
        engines: {
            index: string;
        }[];
    }>;
    exists(request: KuzzleRequest): Promise<{
        exists: boolean;
    }>;
}

import { ControllerDefinition, KuzzleRequest, EmbeddedSDK, Plugin } from 'kuzzle';
import { AbstractEngine } from './AbstractEngine';
export declare class EngineController {
    private engine;
    private context;
    private config;
    private pluginName;
    definition: ControllerDefinition;
    get sdk(): EmbeddedSDK;
    /**
     * @param pluginName Used to define http routes
     * @param config Plugin config
     * @param context Plugin context
     * @param engine Engine used
     */
    constructor(pluginName: string, plugin: Plugin, engine: AbstractEngine);
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

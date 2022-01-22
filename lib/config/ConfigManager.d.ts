import { JSONObject, Plugin } from 'kuzzle';
export declare type ConfigManagerOptions = {
    /**
     * Name of the config collection
     *
     * @default "config"
     */
    collection?: string;
    /**
     * Function that take the config document content as a parameter and return
     * a kebab-case string to uniquely identify it.
     *
     * By default it will use the "name" property of config content.
     */
    idGenerator?: (content: JSONObject) => string;
    /**
     * Additional mappings that will be merged
     *
     * @default
     * {
     *    dynamic: 'strict',
     *    properties: {
     *      type: { type: 'keyword' },
     *      group: { type: 'keyword' },
     *    }
     * }
     */
    mappings?: JSONObject;
    /**
     * Config collection settings
     *
     * @default
     * {}
     */
    settings?: JSONObject;
};
/**
 * Manage config documents type.
 *
 * This class can register config document types with associated mappings and
 * create the associated collection to store config documents.
 */
export declare class ConfigManager {
    readonly collection: string;
    baseMappings: JSONObject;
    baseSettings: JSONObject;
    private idGenerator;
    private context;
    private config;
    private configurations;
    private get sdk();
    constructor(plugin: Plugin, options?: ConfigManagerOptions);
    /**
     * Register a new config document type
     *
     * @example
     *
     *  configManager.register('engine', {
     *    properties: {
     *      index: { type: 'keyword' },
     *      group: { type: 'keyword' },
     *    }
     *  });
     */
    register(type: string, mappings: JSONObject): void;
    /**
     * Creates the config collection and apply mappings on the specified index.
     */
    createCollection(index: string, mappingsOverride?: JSONObject, settingsOverride?: JSONObject): Promise<void>;
    /**
     * Pipe to generate specific IDs for config documents
     *
     * Config document must have a "name" property
     */
    private generateID;
    private registerPipe;
}

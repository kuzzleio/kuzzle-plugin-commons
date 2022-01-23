import { KuzzleRequest, PluginContext, JSONObject, ControllerDefinition, Plugin, EmbeddedSDK } from 'kuzzle';
export declare class CRUDController {
    protected context: PluginContext;
    protected config: JSONObject;
    protected collection: string;
    definition: ControllerDefinition;
    constructor(plugin: Plugin, collection: string);
    protected get as(): (user: {
        _id: string;
    }) => EmbeddedSDK;
    /**
     * Create an asset or a device depending on the collection.
     *
     * @param request
     */
    create(request: KuzzleRequest): Promise<import("kuzzle").Document>;
    /**
     * Delete an asset or a device depending on the collection.
     *
     * @param request
     */
    delete(request: KuzzleRequest): Promise<number>;
    /**
     * search assets or devices depending on the collection.
     *
     * @param request
     */
    search(request: KuzzleRequest): Promise<any>;
    /**
     * Create an asset or a device depending on the collection.
     *
     * @param request
     */
    update(request: KuzzleRequest): Promise<import("kuzzle").Document>;
}

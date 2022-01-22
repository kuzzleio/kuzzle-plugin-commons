import { KuzzleRequest, PluginContext, JSONObject, ControllerDefinition, Plugin } from 'kuzzle';
export declare class CRUDController {
    protected context: PluginContext;
    protected config: JSONObject;
    private collection;
    definition: ControllerDefinition;
    constructor(plugin: Plugin, collection: string);
    get as(): (user: any) => import("kuzzle").EmbeddedSDK;
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

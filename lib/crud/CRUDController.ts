import {
  KuzzleRequest,
  PluginContext,
  JSONObject,
  ControllerDefinition,
  Plugin,
  EmbeddedSDK,
} from "kuzzle";

export class CRUDController {
  protected context: PluginContext;
  protected config: JSONObject;
  protected collection: string;

  public definition: ControllerDefinition;

  constructor(plugin: Plugin, collection: string) {
    this.config = plugin.config;
    this.context = plugin.context;
    this.collection = collection;
  }

  protected get as(): (user: { _id: string }) => EmbeddedSDK {
    return (user) => {
      if (user === null) {
        return this.context.accessors.sdk;
      }

      return this.context.accessors.sdk.as(user, { checkRights: true });
    };
  }

  /**
   * Create an asset or a device depending on the collection.
   *
   * @param request
   */
  async create(request: KuzzleRequest) {
    const index = request.getIndex();
    const asset = request.getBody();
    const id = request.input.resource._id;

    return this.as(request.context.user).document.create(
      index,
      this.collection,
      asset,
      id,
      { ...request.input.args }
    );
  }

  /**
   * Delete an asset or a device depending on the collection.
   *
   * @param request
   */
  async delete(request: KuzzleRequest) {
    const index = request.getIndex();
    const id = request.getId();

    return this.as(request.context.user).document.delete(
      index,
      this.collection,
      id,
      { ...request.input.args }
    );
  }

  /**
   * search assets or devices depending on the collection.
   *
   * @param request
   */
  async search(request: KuzzleRequest) {
    const index = request.getIndex();
    const { searchBody } = request.getSearchParams();

    const res = await this.as(request.context.user).query({
      action: "search",
      body: searchBody,
      collection: this.collection,
      controller: "document",
      index,
      ...request.input.args,
    });

    return res.result;
  }

  /**
   * Create an asset or a device depending on the collection.
   *
   * @param request
   */
  async update(request: KuzzleRequest) {
    const index = request.getIndex();
    const body = request.getBody();
    const id = request.getId();

    return this.as(request.context.user).document.update(
      index,
      this.collection,
      id,
      body,
      { ...request.input.args }
    );
  }
}

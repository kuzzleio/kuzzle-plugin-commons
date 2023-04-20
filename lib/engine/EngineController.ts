import {
  ControllerDefinition,
  PluginContext,
  KuzzleRequest,
  EmbeddedSDK,
  Plugin,
} from "kuzzle";

import { AbstractEngine } from "./AbstractEngine";

export class EngineController<TPlugin extends Plugin> {
  private engine: AbstractEngine<TPlugin>;
  private context: PluginContext;
  private config: TPlugin["config"];

  private pluginName: string;

  public definition: ControllerDefinition;

  get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * @param pluginName Used to define http routes
   * @param plugin Plugin instance
   * @param engine Engine used
   */
  constructor(
    pluginName: string,
    plugin: Plugin,
    engine: AbstractEngine<TPlugin>
  ) {
    this.pluginName = pluginName;
    this.config = plugin.config;
    this.context = plugin.context;
    this.engine = engine;

    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: `${this.pluginName}/engine/:index`, verb: "post" }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: `${this.pluginName}/engine/:index`, verb: "delete" }],
        },
        exists: {
          handler: this.exists.bind(this),
          http: [
            { path: `${this.pluginName}/engine/:index/_exists`, verb: "get" },
          ],
        },
        list: {
          handler: this.list.bind(this),
          http: [{ path: `${this.pluginName}/engines`, verb: "get" }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: `${this.pluginName}/engine/:index`, verb: "put" }],
        },
      },
    };

    if (!plugin.api) {
      plugin.api = {};
    }

    plugin.api[`${this.pluginName}/engine`] = this.definition;
  }

  async create(request: KuzzleRequest) {
    const index = request.getIndex();
    const group = request.getString("group", "commons");

    const { collections } = await this.engine.create(index, group, request);

    return { collections, index };
  }

  async update(request: KuzzleRequest) {
    const index = request.getIndex();
    const group = request.getString("group", "commons");

    const { collections } = await this.engine.update(index, group, request);

    return { collections, index };
  }

  async delete(request: KuzzleRequest) {
    const index = request.getIndex();

    const { collections } = await this.engine.delete(index, request);

    return { collections, index };
  }

  async list() {
    const engines = await this.engine.list();

    return { engines };
  }

  async exists(request: KuzzleRequest) {
    const index = request.getIndex();

    const exists = await this.engine.exists(index);

    return { exists };
  }
}

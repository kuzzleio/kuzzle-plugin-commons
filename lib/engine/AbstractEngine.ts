import {
  PluginContext,
  EmbeddedSDK,
  JSONObject,
  BadRequestError,
  NotFoundError,
  Mutex,
  Inflector,
  Plugin,
} from 'kuzzle';

export abstract class AbstractEngine {
  protected context: PluginContext;
  protected config: JSONObject;
  protected pluginName: string;

  configType: string;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * @param pluginName Used to define http routes
   * @param config Plugin config
   * @param context Plugin context
   */
  constructor (
    pluginName: string,
    plugin: Plugin,
  ) {
    this.pluginName = pluginName;
    this.config = plugin.config;
    this.context = plugin.context;

    this.configType = `engine-${this.pluginName}`;
  }

  abstract init (...args): Promise<void>;
  protected abstract onCreate (index: string, group: string): Promise<{ collections: string[] }>;
  protected abstract onUpdate (index: string, group: string): Promise<{ collections: string[] }>;
  protected abstract onDelete (index: string): Promise<{ collections: string[] }>;

  async create (index: string, group = 'commons'): Promise<{ collections: string[] }> {
    if (await this.exists(index)) {
      throw new BadRequestError(`${Inflector.upFirst(this.pluginName)} engine on index "${index}" already exists`);
    }

    this.context.log.debug(`Create ${this.pluginName} engine on index "${index}"`);

    await this.createEngineIndex(index);

    const { collections } = await this.onCreate(index, group);

    await this.sdk.document.create(
      this.config.adminIndex,
      this.config.configCollection,
      { type: this.configType, engine: { index, group } },
      this.engineId(index),
      { refresh: 'wait_for' });

    return { collections };
  }

  async update (index: string, group = 'commons'): Promise<{ collections: string[] }> {
    if (! await this.exists(index)) {
      throw new NotFoundError(`${Inflector.upFirst(this.pluginName)} engine on index "${index}" does not exists`);
    }

    this.context.log.debug(`Update ${this.pluginName} engine on index "${index}"`);

    const { collections } = await this.onUpdate(index, group);

    return { collections };
  }

  async delete (index: string): Promise<{ collections: string[] }> {
    if (! await this.exists(index)) {
      throw new NotFoundError(`${Inflector.upFirst(this.pluginName)} engine on index "${index}" does not exists`);
    }

    this.context.log.debug(`Delete ${this.pluginName} engine on index "${index}"`);

    const { collections } = await this.onDelete(index);

    await this.sdk.document.delete(
      this.config.adminIndex,
      this.config.configCollection,
      this.engineId(index),
      { refresh: 'wait_for' });

    return { collections };
  }

  async list (): Promise<Array<{ index: string }>> {
    const result = await this.sdk.document.search(
      this.config.adminIndex,
      this.config.configCollection,
      {
        query: {
          equals: { type: this.configType },
        },
      },
      { size: 1000, lang: 'koncorde' });

    return result.hits.map(hit => hit._source.engine);
  }

  async exists (index: string): Promise<boolean> {
    const exists = await this.sdk.document.exists(
      this.config.adminIndex,
      this.config.configCollection,
      this.engineId(index));

    return exists;
  }

  /**
   * Creates the engine index if it does not exists
   */
  private async createEngineIndex (index: string) {
    const mutex = new Mutex(`${this.pluginName}/initIndex/${index}`);

    try {
      await mutex.lock();

      if (! await this.sdk.index.exists(index)) {
        await this.sdk.index.create(index);
      }
    }
    finally {
      await mutex.unlock();
    }
  }

  protected engineId (index: string): string {
    return `engine-scheduler--${index}`;
  }

  protected logError (engineIndex: string, message: string, error: Error) {
    this.context.log.error(`[${engineIndex}] ${message}: ${error}${error.stack}`);
  }

}

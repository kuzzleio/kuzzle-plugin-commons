import {
  PluginContext,
  EmbeddedSDK,
  BadRequestError,
  NotFoundError,
  Mutex,
  Inflector,
  Plugin,
  JSONObject,
} from 'kuzzle';

export abstract class AbstractEngine<TPlugin extends Plugin> {
  protected context: PluginContext;
  protected config: TPlugin['config'];
  protected pluginName: string;

  protected adminIndex: string;
  protected adminConfigCollection: string;

  public configType: string;

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * @param pluginName Used to define http routes
   * @param plugin Plugin instance
   */
  constructor (
    pluginName: string,
    plugin: Plugin,
    adminIndex: string,
    adminConfigCollection: string,
  ) {
    this.pluginName = pluginName;
    this.config = plugin.config;
    this.context = plugin.context;

    this.adminIndex = adminIndex;
    this.adminConfigCollection = adminConfigCollection;

    this.configType = `engine-${this.pluginName}`;
  }

  async init (...args): Promise<any> {
    // Can be used to inject other services into the engine
  }
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
      this.adminIndex,
      this.adminConfigCollection,
      { type: this.configType, group, engine: { index } },
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

    try {
      const { collections } = await this.onDelete(index);

      return { collections };
    }
    finally {
      await this.sdk.document.delete(
        this.adminIndex,
        this.adminConfigCollection,
        this.engineId(index),
        { refresh: 'wait_for' });
    }
  }

  async list (group?: string): Promise<Array<{ index: string }>> {
    const query: JSONObject = {
      and: [
        { equals: { type: this.configType } },
      ],
    };

    if (group) {
      query.and.push({ equals: { group } });
    }

    const result = await this.sdk.document.search(
      this.adminIndex,
      this.adminConfigCollection,
      { query },
      { size: 1000, lang: 'koncorde' });

    return result.hits.map(hit => hit._source.engine);
  }

  async exists (index: string): Promise<boolean> {
    const exists = await this.sdk.document.exists(
      this.adminIndex,
      this.adminConfigCollection,
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
    return `engine-${this.pluginName}--${index}`;
  }

  protected logError (index: string, message: string, error: Error) {
    this.context.log.error(`[${index}] ${message}: ${error}${error.stack}`);
  }

}

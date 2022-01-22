import _ from 'lodash';
import { Document, EventHandler, Inflector, JSONObject, KuzzleRequest, PluginContext, PluginImplementationError, Plugin } from 'kuzzle';

export type ConfigManagerOptions = {
  /**
   * Name of the config collection
   *
   * @default "config"
   */
  collection?: string,

  /**
   * Function that take the config document content as a parameter and return
   * a kebab-case string to uniquely identify it.
   *
   * By default it will use the "name" property of config content.
   */
  idGenerator?: (content: JSONObject) => string,

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
export class ConfigManager {
  public readonly collection: string = 'collection';
  public baseMappings: JSONObject = {
    dynamic: 'strict',
    properties: {
      type: { type: 'keyword' },

      group: { type: 'keyword' },
    }
  };
  public baseSettings: JSONObject = {};

  private idGenerator: (content: JSONObject) => string = content => Inflector.kebabCase(content.name);
  private context: PluginContext;
  private config: Plugin['config'];
  private configurations = new Map<string, JSONObject>();

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin, options: ConfigManagerOptions = {}) {
    this.context = plugin.context;
    this.config = plugin.config;

    this.collection = options.collection || this.collection;
    this.idGenerator = options.idGenerator || this.idGenerator;
    this.baseMappings = options.mappings ? _.merge({}, this.baseMappings, options.mappings) : this.baseMappings;
    this.baseSettings = options.settings || this.baseSettings;

    this.registerPipe(plugin);
  }

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
  register (type: string, mappings: JSONObject) {
    if (this.configurations.has(type)) {
      throw new PluginImplementationError(`Config for "${type}" already registered.`);
    }

    this.configurations.set(type, mappings);
  }

  /**
   * Creates the config collection and apply mappings on the specified index.
   */
  async createCollection (index: string, mappingsOverride: JSONObject = {}, settingsOverride: JSONObject = {}) {
    const fullMappings = _.merge({}, this.baseMappings, mappingsOverride);
    const fullSettings = _.merge({}, this.baseSettings, settingsOverride);

    for (const [type, mappings] of this.configurations.entries()) {
      console.log({type, mappings})
      fullMappings.properties[type] = mappings;
    }

    await this.sdk.collection.create(index, this.collection, {
      mappings: fullMappings as any,
      settings: fullSettings,
    });
  }

  // @todo search with custom search result

  /**
   * Pipe to generate specific IDs for config documents
   *
   * Config document must have a "name" property
   */
  private async generateID (documents: Document[], request: KuzzleRequest) {
    if (request.getCollection() !== this.collection) {
      return request;
    }

    for (const document of documents) {
      try {
        if (! this.configurations.has(document._source.type) || document._id) {
          continue;
        }

        const name = this.idGenerator(document._source[document._source.type]);
        document._id = `${document._source.type}--${name}`;
      }
      catch (error) {
        throw new PluginImplementationError(`Error when generating ID for config document of type "${document._source.type}": ${error}`);
      }
    }

    return documents;
  }

  private registerPipe (plugin: Plugin) {
    const beforeWritePipes = plugin.pipes['generic:document:beforeWrite'] as EventHandler[];

    if (! _.isArray(plugin.pipes['generic:document:beforeWrite'])) {
      throw new PluginImplementationError('Handler on "generic:document:beforeWrite" must be an array');
    }

    beforeWritePipes.push(this.generateID.bind(this));
  }
}

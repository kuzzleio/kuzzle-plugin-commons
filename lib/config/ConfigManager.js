"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const lodash_1 = __importDefault(require("lodash"));
const kuzzle_1 = require("kuzzle");
/**
 * Manage config documents type.
 *
 * This class can register config document types with associated mappings and
 * create the associated collection to store config documents.
 */
class ConfigManager {
    constructor(appOrPlugin, options = {}) {
        /**
         * Name of the config collection
         *
         * @default "config"
         */
        this.collection = 'config';
        /**
         * Base mappings for the config collection
         */
        this.baseMappings = {
            dynamic: 'strict',
            properties: {
                type: { type: 'keyword' },
                group: { type: 'keyword' },
            }
        };
        /**
         * Base settings for the config collection
         */
        this.baseSettings = {};
        this.idGenerator = content => kuzzle_1.Inflector.kebabCase(content.name);
        this.configurations = new Map();
        this.appOrPlugin = appOrPlugin;
        this.collection = options.collection || this.collection;
        this.idGenerator = options.idGenerator || this.idGenerator;
        this.baseMappings = options.mappings ? lodash_1.default.merge({}, this.baseMappings, options.mappings) : this.baseMappings;
        this.baseSettings = options.settings || this.baseSettings;
        this.registerPipe();
    }
    get sdk() {
        if (this.isApp) {
            return this.app.sdk;
        }
        return this.plugin.context.accessors.sdk;
    }
    get app() {
        if (!this.isApp) {
            throw new kuzzle_1.PluginImplementationError('ConfigManager was intantiated from a plugin');
        }
        return this.appOrPlugin;
    }
    get plugin() {
        if (this.isApp) {
            throw new kuzzle_1.PluginImplementationError('ConfigManager was intantiated from an application');
        }
        return this.appOrPlugin;
    }
    get isApp() {
        return this.appOrPlugin instanceof kuzzle_1.Backend;
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
    register(type, mappings) {
        if (this.configurations.has(type)) {
            throw new kuzzle_1.PluginImplementationError(`Config for "${type}" already registered.`);
        }
        this.configurations.set(type, mappings);
    }
    /**
     * Creates the config collection and apply mappings on the specified index.
     */
    async createCollection(index, mappingsOverride = {}, settingsOverride = {}) {
        const fullMappings = lodash_1.default.merge({}, this.baseMappings, mappingsOverride);
        const fullSettings = lodash_1.default.merge({}, this.baseSettings, settingsOverride);
        for (const [type, mappings] of this.configurations.entries()) {
            fullMappings.properties[type] = mappings;
        }
        await this.sdk.collection.create(index, this.collection, {
            mappings: fullMappings,
            settings: fullSettings,
        });
    }
    get mappings() {
        const fullMappings = lodash_1.default.merge({}, this.baseMappings);
        for (const [type, mappings] of this.configurations.entries()) {
            fullMappings.properties[type] = mappings;
        }
        return fullMappings;
    }
    // @todo search with custom search result
    /**
     * Pipe to generate specific IDs for config documents
     *
     * Config document must have a "name" property
     */
    async generateID(documents, request) {
        if (request.getCollection() !== this.collection) {
            return documents;
        }
        for (const document of documents) {
            try {
                if (!this.configurations.has(document._source.type) || document._id) {
                    continue;
                }
                const name = this.idGenerator(document._source[document._source.type]);
                document._id = `${document._source.type}--${name}`;
            }
            catch (error) {
                throw new kuzzle_1.PluginImplementationError(`Error when generating ID for config document of type "${document._source.type}": ${error}`);
            }
        }
        return documents;
    }
    registerPipe() {
        if (this.isApp) {
            this.app.pipe.register('generic:document:beforeWrite', this.generateID.bind(this));
            return;
        }
        const beforeWritePipes = this.plugin.pipes['generic:document:beforeWrite'];
        if (!lodash_1.default.isArray(this.plugin.pipes['generic:document:beforeWrite'])) {
            throw new kuzzle_1.PluginImplementationError('Handler on "generic:document:beforeWrite" must be an array');
        }
        beforeWritePipes.push(this.generateID.bind(this));
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map
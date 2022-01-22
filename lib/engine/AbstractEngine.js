"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractEngine = void 0;
const kuzzle_1 = require("kuzzle");
class AbstractEngine {
    /**
     * @param pluginName Used to define http routes
     * @param plugin Plugin instance
     * @param index Name of admin index to store engine documents
     * @param adminConfigManager ConfigManager instance for admin index to register engine mappings
     * @param engineConfigManager ConfigManager instance for engine index to create config collection
     */
    constructor(pluginName, plugin, adminIndex, adminConfigManager, engineConfigManager) {
        this.pluginName = pluginName;
        this.config = plugin.config;
        this.context = plugin.context;
        this.adminIndex = adminIndex;
        this.adminConfigManager = adminConfigManager;
        this.engineConfigManager = engineConfigManager;
        this.configType = `engine-${this.pluginName}`;
        this.adminConfigManager.register('engine', {
            properties: {
                index: { type: 'keyword' },
                group: { type: 'keyword' },
                name: { type: 'keyword' },
            }
        });
    }
    get sdk() {
        return this.context.accessors.sdk;
    }
    async init(...args) {
        // Can be used to inject other services into the engine
    }
    async create(index, group = 'commons') {
        if (await this.exists(index)) {
            throw new kuzzle_1.BadRequestError(`${kuzzle_1.Inflector.upFirst(this.pluginName)} engine on index "${index}" already exists`);
        }
        this.context.log.info(`Create ${this.pluginName} engine on index "${index}"`);
        await this.createEngineIndex(index);
        await this.engineConfigManager.createCollection(index);
        const { collections } = await this.onCreate(index, group);
        await this.sdk.document.create(this.adminIndex, this.adminConfigManager.collection, { type: this.configType, engine: { index, group, name: this.pluginName } }, this.engineId(index), { refresh: 'wait_for' });
        return { collections };
    }
    async update(index, group = 'commons') {
        if (!await this.exists(index)) {
            throw new kuzzle_1.NotFoundError(`${kuzzle_1.Inflector.upFirst(this.pluginName)} engine on index "${index}" does not exists`);
        }
        this.context.log.info(`Update ${this.pluginName} engine on index "${index}"`);
        await this.engineConfigManager.createCollection(index);
        const { collections } = await this.onUpdate(index, group);
        return { collections };
    }
    async delete(index) {
        if (!await this.exists(index)) {
            throw new kuzzle_1.NotFoundError(`${kuzzle_1.Inflector.upFirst(this.pluginName)} engine on index "${index}" does not exists`);
        }
        this.context.log.info(`Delete ${this.pluginName} engine on index "${index}"`);
        try {
            const { collections } = await this.onDelete(index);
            return { collections };
        }
        finally {
            await this.sdk.document.delete(this.adminIndex, this.adminConfigManager.collection, this.engineId(index), { refresh: 'wait_for' });
        }
    }
    async list(group) {
        const query = {
            and: [
                { equals: { type: this.configType } },
            ],
        };
        if (group) {
            query.and.push({ equals: { 'engine.group': group } });
        }
        const result = await this.sdk.document.search(this.adminIndex, this.adminConfigManager.collection, { query }, { size: 1000, lang: 'koncorde' });
        return result.hits.map(hit => hit._source.engine);
    }
    async exists(index) {
        const exists = await this.sdk.document.exists(this.adminIndex, this.adminConfigManager.collection, this.engineId(index));
        return exists;
    }
    /**
     * Creates the engine index if it does not exists
     */
    async createEngineIndex(index) {
        const mutex = new kuzzle_1.Mutex(`${this.pluginName}/initIndex/${index}`);
        try {
            await mutex.lock();
            if (!await this.sdk.index.exists(index)) {
                await this.sdk.index.create(index);
            }
        }
        finally {
            await mutex.unlock();
        }
    }
    engineId(index) {
        return `engine-${this.pluginName}--${index}`;
    }
    logError(index, message, error) {
        this.context.log.error(`[${index}] ${message}: ${error}${error.stack}`);
    }
}
exports.AbstractEngine = AbstractEngine;
//# sourceMappingURL=AbstractEngine.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractEngine = void 0;
const kuzzle_1 = require("kuzzle");
class AbstractEngine {
    /**
     * @param pluginName Used to define http routes
     * @param config Plugin config
     * @param context Plugin context
     */
    constructor(pluginName, plugin) {
        this.pluginName = pluginName;
        this.config = plugin.config;
        this.context = plugin.context;
        this.configType = `engine-${this.pluginName}`;
    }
    get sdk() {
        return this.context.accessors.sdk;
    }
    async init() {
        // Can be used to inject other services into the engine
    }
    async create(index, group = 'commons') {
        if (await this.exists(index)) {
            throw new kuzzle_1.BadRequestError(`${kuzzle_1.Inflector.upFirst(this.pluginName)} engine on index "${index}" already exists`);
        }
        this.context.log.debug(`Create ${this.pluginName} engine on index "${index}"`);
        await this.createEngineIndex(index);
        const { collections } = await this.onCreate(index, group);
        await this.sdk.document.create(this.config.adminIndex, this.config.configCollection, { type: this.configType, engine: { index, group } }, this.engineId(index), { refresh: 'wait_for' });
        return { collections };
    }
    async update(index, group = 'commons') {
        if (!await this.exists(index)) {
            throw new kuzzle_1.NotFoundError(`${kuzzle_1.Inflector.upFirst(this.pluginName)} engine on index "${index}" does not exists`);
        }
        this.context.log.debug(`Update ${this.pluginName} engine on index "${index}"`);
        const { collections } = await this.onUpdate(index, group);
        return { collections };
    }
    async delete(index) {
        if (!await this.exists(index)) {
            throw new kuzzle_1.NotFoundError(`${kuzzle_1.Inflector.upFirst(this.pluginName)} engine on index "${index}" does not exists`);
        }
        this.context.log.debug(`Delete ${this.pluginName} engine on index "${index}"`);
        const { collections } = await this.onDelete(index);
        await this.sdk.document.delete(this.config.adminIndex, this.config.configCollection, this.engineId(index), { refresh: 'wait_for' });
        return { collections };
    }
    async list() {
        const result = await this.sdk.document.search(this.config.adminIndex, this.config.configCollection, {
            query: {
                equals: { type: this.configType },
            },
        }, { size: 1000, lang: 'koncorde' });
        return result.hits.map(hit => hit._source.engine);
    }
    async exists(index) {
        const exists = await this.sdk.document.exists(this.config.adminIndex, this.config.configCollection, this.engineId(index));
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
        return `engine-scheduler--${index}`;
    }
    logError(engineIndex, message, error) {
        this.context.log.error(`[${engineIndex}] ${message}: ${error}${error.stack}`);
    }
}
exports.AbstractEngine = AbstractEngine;
//# sourceMappingURL=AbstractEngine.js.map
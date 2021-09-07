"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineController = void 0;
class EngineController {
    /**
     * @param pluginName Used to define http routes
     * @param plugin Plugin instance
     * @param engine Engine used
     */
    constructor(pluginName, plugin, engine) {
        this.pluginName = pluginName;
        this.config = plugin.config;
        this.context = plugin.context;
        this.engine = engine;
        this.definition = {
            actions: {
                create: {
                    handler: this.create.bind(this),
                    http: [{ verb: 'post', path: `${this.pluginName}/engine/:index` }],
                },
                update: {
                    handler: this.update.bind(this),
                    http: [{ verb: 'put', path: `${this.pluginName}/engine/:index` }],
                },
                delete: {
                    handler: this.delete.bind(this),
                    http: [{ verb: 'delete', path: `${this.pluginName}/engine/:index` }],
                },
                list: {
                    handler: this.list.bind(this),
                    http: [{ verb: 'get', path: `${this.pluginName}/engines` }],
                },
                exists: {
                    handler: this.exists.bind(this),
                    http: [{ verb: 'get', path: `${this.pluginName}/engine/:index/_exists` }],
                }
            },
        };
        if (!plugin.api) {
            plugin.api = {};
        }
        plugin.api[`${this.pluginName}/engine`] = this.definition;
    }
    get sdk() {
        return this.context.accessors.sdk;
    }
    async create(request) {
        const index = request.getIndex();
        const group = request.getString('group', 'commons');
        const { collections } = await this.engine.create(index, group);
        return { index, collections };
    }
    async update(request) {
        const index = request.getIndex();
        const group = request.getString('group', 'commons');
        const { collections } = await this.engine.update(index, group);
        return { index, collections };
    }
    async delete(request) {
        const index = request.getIndex();
        const { collections } = await this.engine.delete(index);
        return { index, collections };
    }
    async list() {
        const engines = await this.engine.list();
        return { engines };
    }
    async exists(request) {
        const index = request.getIndex();
        const exists = await this.engine.exists(index);
        return { exists };
    }
}
exports.EngineController = EngineController;
//# sourceMappingURL=EngineController.js.map
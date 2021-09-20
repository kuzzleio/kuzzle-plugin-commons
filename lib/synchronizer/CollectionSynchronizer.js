"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionSynchronizer = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * This class allows to synchronize documents from one collection into an other.
 *
 */
class CollectionSynchronizer {
    constructor(app, srcCollection, dstCollection) {
        this.enabled = false;
        this.app = app;
        this.srcCollection = srcCollection;
        this.dstCollection = dstCollection;
        this.app.pipe.register('generic:document:afterWrite', this.pipeAfterWrite.bind(this));
        this.app.pipe.register('generic:document:afterUpdate', this.pipeAfterUpdate.bind(this));
        this.app.pipe.register('generic:document:beforeDelete', this.pipeBeforeDelete.bind(this));
    }
    start() {
        this.enabled = true;
    }
    stop() {
        this.enabled = false;
    }
    filter(srcDocuments) {
        return srcDocuments;
    }
    async afterWriteDocuments(index, documents) {
    }
    async afterDeleteDocuments(index, ids) {
    }
    async pipeAfterWrite(documents, request) {
        if (this.shouldSkipPipe(request)) {
            return documents;
        }
        const filteredDocs = this.filter(documents);
        if (filteredDocs.length > 0) {
            await this.writeDocuments(request, filteredDocs, 'create');
        }
        return documents;
    }
    async pipeAfterUpdate(documents, request) {
        if (this.shouldSkipPipe(request)) {
            return documents;
        }
        const docs = await this.getEntireDocuments(request, documents);
        const filteredDocs = this.filter(docs);
        if (filteredDocs.length > 0) {
            await this.writeDocuments(request, filteredDocs, 'update');
        }
        return documents;
    }
    async pipeBeforeDelete(documents, request) {
        if (this.shouldSkipPipe(request)) {
            return documents;
        }
        const docs = await this.getEntireDocuments(request, documents);
        const filteredDocs = this.filter(docs);
        if (filteredDocs.length > 0) {
            const ids = filteredDocs.map(doc => this.convertId(doc, request));
            await this.app.sdk.document.mDelete(request.getIndex(), this.dstCollection, ids, { strict: true });
            await this.afterDeleteDocuments(request.getIndex(), ids);
        }
        return documents;
    }
    async getEntireDocuments(request, documents) {
        const { successes } = await this.app.sdk.document.mGet(request.getIndex(), this.srcCollection, documents.map(({ _id }) => _id));
        return successes;
    }
    async writeDocuments(request, srcDocuments, action) {
        const now = Date.now();
        const dstDocuments = await Promise.all(srcDocuments.map(doc => {
            return this.convertBody(doc, request)
                .then((body) => {
                // Inject Kuzzle Metadata if not present
                if (!body._kuzzle_info) {
                    if (action === 'create') {
                        body._kuzzle_info = {
                            creator: null,
                            createdAt: now,
                        };
                    }
                    else {
                        body._kuzzle_info = {
                            updater: null,
                            updatedAt: now,
                        };
                    }
                }
                return {
                    _id: this.convertId(doc, request),
                    body
                };
            });
        }));
        await this.app.sdk.bulk.mWrite(request.getIndex(), this.dstCollection, dstDocuments, { strict: true, notify: true });
        await this.afterWriteDocuments(request.getIndex(), dstDocuments);
    }
    shouldSkipPipe(request) {
        if (!this.enabled) {
            return true;
        }
        if (request.getCollection() !== this.srcCollection) {
            return true;
        }
        return false;
    }
}
exports.CollectionSynchronizer = CollectionSynchronizer;
/* eslint-enable @typescript-eslint/no-unused-vars */
/* eslint-enable @typescript-eslint/no-empty-function */
//# sourceMappingURL=CollectionSynchronizer.js.map
import {
  Backend,
  JSONObject,
  KuzzleRequest,
} from 'kuzzle';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

/**
 * This class allows to synchronize documents from one collection into an other.
 *
 */
export abstract class CollectionSynchronizer<SrcDoc extends { _id: string, _source: JSONObject }, DstDocContent> {
  protected app: Backend;

  private srcCollection: string;
  private dstCollection: string;
  private enabled = false;

  abstract convertId (srcDocument: SrcDoc, request?: KuzzleRequest): string;
  abstract convertBody (srcDocument: SrcDoc, request?: KuzzleRequest): Promise<DstDocContent>;

  constructor (app: Backend, srcCollection: string, dstCollection: string) {
    this.app = app;
    this.srcCollection = srcCollection;
    this.dstCollection = dstCollection;

    this.app.pipe.register(
      'generic:document:afterWrite',
      (documents, request) => this.pipeAfterWrite(documents, request));

    this.app.pipe.register(
      'generic:document:afterUpdate',
      (documents, request) => this.pipeAfterUpdate(documents, request));

    this.app.pipe.register(
      'generic:document:beforeDelete',
      (documents, request) => this.pipeBeforeDelete(documents, request));
  }

  start () {
    this.enabled = true;
  }

  stop () {
    this.enabled = false;
  }

  filter (srcDocuments: SrcDoc[]): SrcDoc[] {
    return srcDocuments;
  }

  async afterWriteDocuments (index: string, documents: Array<{ _id: string, body: DstDocContent }>) {
  }

  async afterDeleteDocuments (index: string, ids: string[]) {
  }

  private async pipeAfterWrite (documents: SrcDoc[], request: KuzzleRequest) {
    if (this.shouldSkipPipe(request)) {
      return documents;
    }

    const filteredDocs = this.filter(documents);

    if (filteredDocs.length > 0) {
      await this.writeDocuments(request, filteredDocs, 'create');
    }

    return documents;
  }

  private async pipeAfterUpdate (documents: SrcDoc[], request: KuzzleRequest) {
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

  private async pipeBeforeDelete (documents: SrcDoc[], request: KuzzleRequest) {
    if (this.shouldSkipPipe(request)) {
      return documents;
    }

    const docs = await this.getEntireDocuments(request, documents);

    const filteredDocs = this.filter(docs);

    if (filteredDocs.length > 0) {
      const ids = filteredDocs.map(doc => this.convertId(doc, request));

      await this.app.sdk.document.mDelete(
        request.getIndex(),
        this.dstCollection,
        ids);

      await this.afterDeleteDocuments(request.getIndex(), ids);
    }

    return documents;
  }

  private async getEntireDocuments (request: KuzzleRequest, documents: SrcDoc[]): Promise<SrcDoc[]> {
    const { successes } = await this.app.sdk.document.mGet(
      request.getIndex(),
      this.srcCollection,
      documents.map(({ _id }) => _id));

    return successes as SrcDoc[];
  }

  private async writeDocuments (request: KuzzleRequest, srcDocuments: SrcDoc[], action: 'create' | 'update') {
    const now = Date.now();

    const dstDocuments = await Promise.all(
      srcDocuments.map(doc => {
        return this.convertBody(doc, request)
          .then((body: any) => {
            // Inject Kuzzle Metadata if not present
            if (! body._kuzzle_info) {
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
      })
    )

    await this.app.sdk.bulk.mWrite(
      request.getIndex(),
      this.dstCollection,
      dstDocuments,
      { strict: true, notify: true });

    await this.afterWriteDocuments(request.getIndex(), dstDocuments);
  }

  private shouldSkipPipe (request: KuzzleRequest): boolean {
    if (! this.enabled) {
      return true;
    }

    if (request.getCollection() !== this.srcCollection) {
      return true;
    }

    return false;
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
/* eslint-enable @typescript-eslint/no-empty-function */

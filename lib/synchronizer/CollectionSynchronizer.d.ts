import { Backend, JSONObject, KuzzleRequest } from 'kuzzle';
/**
 * This class allows to synchronize documents from one collection into an other.
 *
 */
export declare abstract class CollectionSynchronizer<SrcDoc extends {
    _id: string;
    _source: JSONObject;
}, DstDocContent> {
    protected app: Backend;
    private srcCollection;
    private dstCollection;
    private enabled;
    abstract convertId(srcDocument: SrcDoc, request?: KuzzleRequest): string;
    abstract convertBody(srcDocument: SrcDoc, request?: KuzzleRequest): Promise<DstDocContent>;
    constructor(app: Backend, srcCollection: string, dstCollection: string);
    start(): void;
    stop(): void;
    filter(srcDocuments: SrcDoc[]): SrcDoc[];
    afterWriteDocuments(index: string, documents: Array<{
        _id: string;
        body: DstDocContent;
    }>): Promise<void>;
    afterDeleteDocuments(index: string, ids: string[]): Promise<void>;
    private pipeAfterWrite;
    private pipeAfterUpdate;
    private pipeBeforeDelete;
    private getEntireDocuments;
    private writeDocuments;
    private shouldSkipPipe;
}

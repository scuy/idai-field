import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {Query} from 'idai-components-2/datastore';
import {ViewFacade} from '../../resources/view/view-facade';
import {ImagesState} from './images-state';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {IdaiFieldImageDocumentReadDatastore} from "../../../core/datastore/idai-field-image-document-read-datastore";
import {DocumentReadDatastore} from "../../../core/datastore/document-read-datastore";

@Injectable()
/**
 *
 */
export class ImageDocumentsManager {

    private documents: Array<IdaiFieldImageDocument>;

    public selected: Array<IdaiFieldImageDocument>  = [];

    private depictsRelationsSelected: boolean = false;


    constructor(
        public viewFacade: ViewFacade,
        private imagesState: ImagesState,
        private imageDatastore: IdaiFieldImageDocumentReadDatastore,
        private datastore: DocumentReadDatastore
    ) {
    }


    public getSelected(): Array<IdaiFieldImageDocument> {

        return this.selected
    }


    public getDocuments(): Array<IdaiFieldImageDocument> {

        return this.documents;
    }


    public getDepictsRelationsSelected(): boolean {

        return this.depictsRelationsSelected;
    }


    public remove(document: IdaiFieldImageDocument) {

        this.documents.splice(
            this.documents.indexOf(document), 1);
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selected.indexOf(document) == -1) {
            this.selected.push(document);
        } else {
            this.selected.splice(this.selected.indexOf(document), 1);
        }

        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }


    private doSelectedDocumentsContainDepictsRelations(): boolean {

        for (let document of this.selected) {
            if (document.resource.relations.depicts &&
                    document.resource.relations.depicts.length > 0) {
                return true;
            }
        }

        return false;
    }


    public clearSelection() {

        this.selected = [];
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public fetchDocuments() {

        const query: Query = this.imagesState.getQuery();

        console.debug("fetch docs")
        return this.imageDatastore.find(query)
            .catch(errWithParams => {
                console.error('ERROR with find using query', query);
                if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
            }).then(documents => {
                if (!documents || documents.length == 0) return Promise.resolve([]);
                // if (['', 'UNLINKED'].indexOf(this.imagesState.getMainTypeDocumentFilterOption()) == -1) {
                //     return this.applyLinkFilter(documents);
                // } else {
                    return Promise.resolve(documents);
                // }
            }).then(filteredDocuments => {
                console.debug("fetch docs end")
                this.documents = filteredDocuments as any;
            });
    }


    /**
     * @param documents Documents with depicts relation
     * @returns Documents which are linked to the main type resource selected in filter box:
     * 1. Documents which are linked to a resource which contains an isRecordedIn relation to the main type resource
     * 2. Documents which are directly linked to the main type resource
     */
    private applyLinkFilter(documents: Array<Document>): Promise<Array<IdaiFieldImageDocument>> {

        const documentMap: { [id: string]: Document } = {};
        const promises: Array<Promise<Document>> = [];
        const mainTypeDocumentId: string = this.imagesState.getMainTypeDocumentFilterOption();

        for (let document of documents) {
            if (!document.resource.id) continue;

            documentMap[document.resource.id] = document;
            for (let targetId of document.resource.relations['depicts']) {
                promises.push(this.datastore.get(targetId));
            }
        }

        let targetDocuments: Array<Document>;

        return Promise.all(promises).then(targetDocs => {
            targetDocuments = targetDocs;

            return this.datastore.find({
                q: '',
                constraints: { 'resource.relations.isRecordedIn': mainTypeDocumentId }
            });
        }).then(recordedDocuments => {
            const filteredDocuments: Array<Document> = [];

            for (let targetDocument of targetDocuments) {
                if (recordedDocuments.indexOf(targetDocument) > -1) {
                    for (let imageId of targetDocument.resource.relations['isDepictedIn']) {
                        const imageDocument = documentMap[imageId];
                        if (imageDocument && filteredDocuments.indexOf(imageDocument) == -1) {
                            filteredDocuments.push(imageDocument);
                        }
                    }
                }
            }

            const result: Array<Document> = [];

            for (let document of documents) {
                if (filteredDocuments.indexOf(document) > -1 ||
                    // Add images directly linked to the main type document
                    document.resource.relations['depicts'].indexOf(mainTypeDocumentId) > -1) {
                    result.push(document);
                }
            }

            return Promise.resolve(result);
        });
    }
}
import {Document} from 'idai-components-2/core';
import {Datastore} from 'idai-components-2/datastore';
import {OperationTypeDocumentsManager} from './operation-type-documents-manager';
import {ViewManager} from './view-manager';
import {DocumentsManager} from './documents-manager';
import {ResourcesState} from './resources-state';
import {Views} from './views';
import {SettingsService} from '../../settings/settings-service';
import {StateSerializer} from '../../common/state-serializer';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

/**
 * Manages an overview of operation type resources
 * and different views for each operation type.
 *
 * In the overview the document list contains the operation type resources.
 * In the operation type views the list contains resources recorded in
 * one selected operation type resource.
 *
 * Apart from that, each view behaves the same in that the document list
 * can get filteres etc.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ViewFacade {


    private views: Views;
    private viewManager: ViewManager;
    private operationTypeDocumentsManager: OperationTypeDocumentsManager;
    private documentsManager: DocumentsManager;


    constructor(
        private datastore: Datastore, // TODO use read datastore
        private settingsService: SettingsService,
        private stateSerializer: StateSerializer,
        private viewsList: any
    ) {
        this.views = new Views(viewsList);
        this.viewManager = new ViewManager(
            this.views,
            new ResourcesState(
                stateSerializer
            )
        );
        this.operationTypeDocumentsManager = new OperationTypeDocumentsManager(
            datastore,
            this.viewManager
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            settingsService,
            this.viewManager,
            this.operationTypeDocumentsManager
        );
    }


    public isInOverview() {

        return this.viewManager.isInOverview();
    }

    
    public getCurrentViewName() {

        if (!this.viewManager.getViewName()) return;
        return this.viewManager.getViewName();
    }


    public getOperationViews() {

        return this.views.getOperationViews();
    }


    /**
     * @returns the main type of the currently selected view.
     * This is either 'Project' or one of the operation types names.
     */
    public getCurrentViewMainType(): string|undefined {

        if (!this.viewManager.getViewName()) return undefined;
        if (this.viewManager.getViewName() == 'project') return 'Project';

        return this.viewManager.getViewType();
    }


    public getMainTypeHomeViewName(mainTypeName: string): string|undefined {

        if (!mainTypeName) return undefined;
        if (mainTypeName == 'Project') return 'project';

        return this.views.getViewNameForOperationTypeName(mainTypeName);
    }


    public getOperationTypeLabel() {

        if (this.isInOverview()) throw ViewFacade.err('getOperationTypeLabel');
        return this.viewManager.getMainTypeLabel();
    }


    public deselect() {

        return this.documentsManager.deselect();
    }


    public getMode() {

        return this.viewManager.getMode();
    }


    public getQuery() {

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    public getProjectDocument() {

        return this.documentsManager.projectDocument;
    }


    public async handleMainTypeDocumentOnDeleted() {

        const selectedDocument = this.operationTypeDocumentsManager.getSelectedDocument();
        if (!selectedDocument) return;
        if (!selectedDocument.resource.id) return;

        this.viewManager.removeActiveLayersIds(selectedDocument.resource.id);
        this.viewManager.setLastSelectedOperationTypeDocumentId(undefined);
        await this.populateOperationTypeDocuments();
    }


    public setActiveLayersIds(mainTypeDocumentResourceId: string, activeLayersIds: string[]) {

        return this.viewManager.setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds);
    }


    public getActiveLayersIds(mainTypeDocumentResourceId: string) {

        return this.viewManager.getActiveLayersIds(mainTypeDocumentResourceId);
    }


    public getSelectedOperationTypeDocument() {

        if (this.isInOverview()) throw ViewFacade.err('getSelectedOperationTypeDocument');
        return this.operationTypeDocumentsManager.getSelectedDocument();
    }


    public getOperationTypeDocuments() {

        if (this.isInOverview()) throw ViewFacade.err('getOperationTypeDocuments');
        return this.operationTypeDocumentsManager.getDocuments();
    }


    // As discussed in #6707, should we really base this on views?
    // It seems way better to ask to ProjectConfiguration for Operation Type Documents
    // and the fetch them outside the facade.
    public async getAllOperationTypeDocuments() {

        const viewMainTypes = this.views.getOperationViews()
            .map(view => {return view.operationSubtype});

        let mainTypeDocuments: Array<Document> = [];

        for (let viewMainType of viewMainTypes) {
            if (viewMainType == 'Project') continue;

            mainTypeDocuments = mainTypeDocuments.concat(
                await this.datastore.find({ q: '', types: [viewMainType] }));
        }

        return mainTypeDocuments;
    }


    public getFilterTypes() {

        return this.viewManager.getFilterTypes();
    }


    public getQueryString() {

        return this.viewManager.getQueryString();
    }


    public setMode(mode: string) {

        this.viewManager.setMode(mode);
    }


    public setSelectedDocumentById(id: string) {

        return this.documentsManager.setSelectedById(id);
    }


    public isNewDocumentFromRemote(document: Document) {

        return this.documentsManager.isNewDocumentFromRemote(document);
    }


    public remove(document: Document) {

        return this.documentsManager.remove(document);
    }


    public getSelectedDocument() {

        return this.documentsManager.getSelectedDocument();
    }


    /**
     * Sets the this.documentsManager.selectedDocument
     * and if necessary, also
     * a) selects the operation type document,
     * this.documntsManager.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.documentsManager.selectedDocument is part of the search hits of the document list.
     *
     * @param document exits immediately if this is
     *   a) the same as this.documentsManager.selectedDocument or
     *   b) the same as this.mainTypeManager.selectedMainTypeDocument or
     *   c) undefined
     * @returns {Document}
     */
    public setSelectedDocument(document: Document) {

        return this.documentsManager.setSelected(document);
    }


    public getDocuments() {

        return this.documentsManager.getDocuments();
    }


    public setQueryString(q: string): Promise<boolean> {

        return this.documentsManager.setQueryString(q);
    }


    public setQueryTypes(types: string[]) { // TODO make it return a promise, like setQueryString

        return this.documentsManager.setQueryTypes(types);
    }


    public getCurrentFilterType() {

        return this.viewManager.getCurrentFilterType();
    }


    /**
     * @param mainTypeDoc
     * @returns true if isSelectedDocumentRecordedInSelectedOperationTypeDocument
     */
    public async selectOperationTypeDocument(mainTypeDoc: Document): Promise<boolean> {

        if (this.isInOverview()) throw ViewFacade.err('selectOperationTypeDocument/1');
        this.operationTypeDocumentsManager.select(mainTypeDoc as IdaiFieldDocument);

        await this.populateDocumentList();

        if (!this.isSelectedDocumentRecordedInSelectedOperationTypeDocument()) {
            this.documentsManager.deselect();
            return false;
        } {
            return true;
        }
    }


    public populateDocumentList() {

        return this.documentsManager.populateDocumentList();
    }


    /**
     * Based on the current view, populates the operation type documents and also
     * sets the selectedMainTypeDocument to either
     *   a) the last selected one for that view if any or
     *   b) the first element of the operation type documents it is not set
     *      and operation type documents length > 1
     *
     * @returns {Promise<any>}
     */
    public async populateOperationTypeDocuments() {

        if (this.isInOverview()) throw ViewFacade.err('populateOperationTypeDocuments');
        await this.operationTypeDocumentsManager.populate();
    }


    public async setupView(viewName: string, defaultMode: string) {

        await this.viewManager.setupView(viewName, defaultMode);
        await this.documentsManager.populateProjectDocument();

        if (!this.isInOverview()) await this.populateOperationTypeDocuments();
        await this.populateDocumentList();
    }


    private isSelectedDocumentRecordedInSelectedOperationTypeDocument(): boolean {

        if (!this.documentsManager.getSelectedDocument()) return false;

        return this.operationTypeDocumentsManager.isRecordedInSelectedOperationTypeDocument(
            this.documentsManager.getSelectedDocument()
        );
    }


    private static err(fnName: string, notAllowedWhenIsInOverview = true) {
        
        const notMarker = notAllowedWhenIsInOverview ? '' : '! ';
        return "calling "+fnName+" is forbidden when " + notMarker + "isInOverview";
    }
}
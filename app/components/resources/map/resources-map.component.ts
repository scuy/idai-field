import {Component, Input} from '@angular/core';
import {Document, Messages} from 'idai-components-2/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/field';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {PersistenceManager} from '../../../core/persist/persistence-manager';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {SettingsService} from '../../../core/settings/settings-service';
import {NavigationPath} from '../view/state/navigation-path';


@Component({
    selector: 'resources-map',
    moduleId: module.id,
    templateUrl: './resources-map.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ResourcesMapComponent {

    @Input() activeTab: string;

    public parentDocuments: Array<Document>;


    constructor(
        public loading: Loading,
        public viewFacade: ViewFacade,
        public resourcesComponent: ResourcesComponent,
        private persistenceManager: PersistenceManager,
        private usernameProvider: UsernameProvider,
        private settingsService: SettingsService,
        private messages: Messages
    ) {
        this.parentDocuments = this.getParentDocuments(this.viewFacade.getNavigationPath());

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.parentDocuments = this.getParentDocuments(path);
        });
    }


    public getIsRecordedInTarget() {

        return this.resourcesComponent.getSelectedOperationTypeDocument() !== undefined
            ? this.resourcesComponent.getSelectedOperationTypeDocument()
            : this.settingsService.getProjectDocument()
    }


    public async select(document: IdaiFieldDocument|undefined) {

        this.resourcesComponent.setScrollTarget(document);

        if (document) {
            await this.viewFacade.setSelectedDocument(document);
        } else {
            this.viewFacade.deselect();
        }
    }


    /**
     * @param geometry
     *   <code>null</code> indicates geometry should get deleted.
     *   <code>undefined</code> indicates editing operation aborted.
     */
    public async quitEditing(geometry: IdaiFieldGeometry) {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;
        if (!selectedDocument.resource.geometry) return;

        if (geometry) {
            selectedDocument.resource.geometry = geometry;
        } else if (geometry === null || !selectedDocument.resource.geometry.coordinates
                || selectedDocument.resource.geometry.coordinates.length == 0) {
            delete selectedDocument.resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                const selectedDocument = this.viewFacade.getSelectedDocument();
                if (selectedDocument) await this.resourcesComponent.editDocument(selectedDocument);
            } else {
                this.viewFacade.deselect();
                this.resourcesComponent.isEditingGeometry = false;
            }
        } else {
            if (geometry !== undefined) await this.save();
            this.resourcesComponent.isEditingGeometry = false;
        }
    }


    private async save() {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;

        try {
            await this.viewFacade.setSelectedDocument(
                await this.persistenceManager.persist(selectedDocument, this.usernameProvider.getUsername())
            );
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private selectedDocumentIsNew(): boolean {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return false;

        return !selectedDocument.resource.id;
    }


    private getParentDocuments(navigationPath: NavigationPath): Array<Document> {

        if (!this.viewFacade.getBypassHierarchy() && this.viewFacade.getSelectAllOperationsOnBypassHierarchy()) {
            return this.viewFacade.getOperationTypeDocuments();
        }

        if (!navigationPath.selectedSegmentId) {
            const isRecordedInTarget: Document|undefined = this.getIsRecordedInTarget();
            return isRecordedInTarget ? [isRecordedInTarget] : [];
        }

        const segment = navigationPath.segments
            .find(_ => _.document.resource.id === navigationPath.selectedSegmentId);

        return segment ? [segment.document] : [];
    }
}

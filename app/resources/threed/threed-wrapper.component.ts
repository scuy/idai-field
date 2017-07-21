import {Component, OnInit, Input} from '@angular/core';
import {ResourcesComponent} from '../resources.component';
import {PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';

@Component({
    selector: 'threed-wrapper',
    moduleId: module.id,
    templateUrl: './threed-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ThreedWrapperComponent implements OnInit {

    @Input() selectedDocument: IdaiFieldDocument;
    @Input() editMode: boolean = false;

    private docs: IdaiFieldDocument[];

    constructor(
        private resourcesComponent: ResourcesComponent,
        private messages: Messages
    ) { }

    ngOnInit(): void {

        this.resourcesComponent.getDocuments().subscribe(result => {
           this.docs = result as IdaiFieldDocument[];
        });
    }

    private selectedDocumentIsNew(): boolean {
        return !this.selectedDocument.resource.id;
    }

    public select(document: IdaiFieldDocument) {

        this.resourcesComponent.select(document);
        this.resourcesComponent.setScrollTarget(document);
    }
}

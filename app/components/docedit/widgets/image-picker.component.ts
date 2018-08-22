import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2';
import {Query} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {M} from '../../../m';
import {IdaiFieldImageDocumentReadDatastore} from '../../../core/datastore/field/idai-field-image-document-read-datastore';
import {TypeUtility} from '../../../core/model/type-utility';


@Component({
    selector: 'image-picker',
    moduleId: module.id,
    templateUrl: './image-picker.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ImagePickerComponent implements OnInit {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;

    public documents: IdaiFieldImageDocument[];

    public document: IdaiFieldDocument;
    public selectedDocuments: Array<IdaiFieldImageDocument> = [];

    private query: Query = { q: '' };

    private static documentLimit: number = 24;


    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private el: ElementRef,
        private typeUtility: TypeUtility
    ) {}


    public ngOnInit() {

        // Listen for transformation of modal to capture finished 
        // resizing and invoke recalculation of imageGrid
        let modalEl = this.el.nativeElement.parentElement.parentElement;
        modalEl.addEventListener('transitionend', (event: any) => {
            if (event.propertyName == 'transform') this.onResize();
        });
    }


    public setDocument(document: IdaiFieldDocument) {

        this.document = document;
        this.fetchDocuments(this.query);
    }


    public setQueryString(q: string) {

        this.query.q = q;
        this.fetchDocuments(this.query);
    }


    public onResize() {

        this.imageGrid.calcGrid();
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selectedDocuments.indexOf(document) == -1) this.selectedDocuments.push(document);
        else this.selectedDocuments.splice(this.selectedDocuments.indexOf(document), 1);
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    private fetchDocuments(query: Query) {

        this.query = query;
        if (!this.query) this.query = {};

        this.query.types = this.typeUtility.getImageTypeNames();
        this.query.constraints = {
            'depicts:contain': { value: this.document.resource.id, type: 'subtract' }
        };
        this.query.limit = ImagePickerComponent.documentLimit;

        return this.datastore.find(this.query)
            // .catch(msgWithParams => this.messages.add(msgWithParams)
            .then(result => this.documents = result.documents)
            .catch(errWithParams => {
                console.error('error in find with query', this.query);
                if (errWithParams.length == 2) {
                    console.error('error in find, cause', errWithParams[1]);
                }
                this.messages.add([M.ALL_FIND_ERROR]);
            });
    }
}
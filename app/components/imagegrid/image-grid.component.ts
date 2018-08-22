import {Component, EventEmitter, Input, OnChanges, SimpleChanges, Output, ElementRef} from '@angular/core';
import {Messages, Document} from 'idai-components-2';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ImageGridConstruction} from './image-grid-builder';
import {M} from '../../m';
import {Imagestore} from '../../core/imagestore/imagestore';
import {IdaiFieldDocumentReadDatastore} from '../../core/datastore/field/idai-field-document-read-datastore';
import {ImageUploadResult} from '../imageupload/image-uploader';


@Component({
    selector: 'image-grid',
    moduleId: module.id,
    templateUrl: './image-grid.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageGridComponent implements OnChanges {

    @Input() nrOfColumns: number = 1;
    @Input() documents: IdaiFieldImageDocument[];
    @Input() selected: IdaiFieldImageDocument[] = [];
    @Input() totalDocumentCount: number = 0;
    @Input() showLinkBadges: boolean = true;
    @Input() showIdentifier: boolean = true;
    @Input() showShortDescription: boolean = true;
    @Input() showGeoIcon: boolean = false;
    @Input() showTooltips: boolean = false;
    @Input() showDropArea: boolean = false;
    @Input() compressDropArea: boolean = false;
    @Input() dropAreaDepictsRelationTarget: Document;
    @Input() paddingRight: number;

    @Output() onClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDoubleClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onImagesUploaded: EventEmitter<ImageUploadResult> = new EventEmitter<ImageUploadResult>();

    public resourceIdentifiers: {[id: string]: string} = {};
    public moreRowsMsg: string|undefined = undefined;

    // parallel running calls to calcGrid are painfully slow, so we use this to prevent it
    private calcGridRunning = false;
    // to be able to reset the timeout on multiple onResize calls
    private calcGridTimeoutRef: any = undefined;

    // it should be avoided that while being in an image overview and thumbs are missing,
    // that the missing images messages is shown more than once, as it would happen
    // on a recalculation of the grid on resize.
    // only if the user leaves the component and comes back again,
    // the message would be displayed again.
    private imagesNotFoundMessageDisplayed = false;

    private rows = [];


    constructor(
        private el: ElementRef,
        private messages: Messages,
        private imagestore: Imagestore,
        private datastore: IdaiFieldDocumentReadDatastore
    ) {
    }


    ngOnChanges(changes: SimpleChanges) {

        if (!changes['documents']) return;
        if (this.showDropArea) this.insertStubForDropArea();
        this.calcGrid();
    }


    public async onCellMouseEnter(doc: IdaiFieldImageDocument) {

        if (!this.showLinkBadges) return;

        for (let depictsRelId of doc.resource.relations.depicts) {

            if (!this.resourceIdentifiers[depictsRelId]) {
                const target = await this.datastore.get(depictsRelId);
                this.resourceIdentifiers[depictsRelId] = target.resource.identifier;
            }
        }
    }


    public calcGrid() {

        clearTimeout(this.calcGridTimeoutRef as any);
        this.calcGridTimeoutRef = setTimeout(async () => {
            // we just jump out and do not store the recalc request. this could possibly be improved
            if (this.calcGridRunning) return;

            this.calcGridRunning = true;
            await this._calcGrid();
            this.calcGridRunning = false;

            this.updateSearchResultsInfoMessage();
        }, 500);
    }


    private async _calcGrid() {

        if (!this.documents) return;

        const rows = ImageGridConstruction.calcGrid(
            this.documents, this.nrOfColumns, this.el.nativeElement.children[0].clientWidth,
            this.paddingRight
        );

        this.moreRowsMsg = undefined;
        await this.loadImages(rows);
        this.rows = rows;
    }


    private async loadImages(rows: any) {

        for (let row of rows) {
            for (let cell of row) {

                if (!cell.document
                    || !cell.document.resource
                    || !cell.document.resource.id
                    || cell.document.resource.id === 'droparea') continue;

                try {
                    cell.imgSrc = await this.imagestore.read(cell.document.resource.id)
                } catch(e) {
                    console.error('error fetching image', e);
                }
            }
        }
    }


    private showImagesNotFoundMessage(result: any) {

        if (result.errsWithParams &&
            result.errsWithParams.length &&
            result.errsWithParams.length > 0 &&
            !this.imagesNotFoundMessageDisplayed) {

            this.messages.add([M.IMAGES_N_NOT_FOUND]);
            this.imagesNotFoundMessageDisplayed = true;
        }
    }


    private updateSearchResultsInfoMessage() {

        if (!this.documents || !this.totalDocumentCount) return;
        if (this.totalDocumentCount <= (this.documents.length - 1)) return;

        this.moreRowsMsg = 'Es werden die ersten ' + (this.documents.length - 1)
            + ' von insgesamt ' + this.totalDocumentCount + ' Suchtreffern angezeigt. '
            + 'Schränken Sie die Suche weiter ein, um alle Ergebnisse auf einen Blick zu sehen'
            + (this.nrOfColumns < 12 ? ' oder erhöhen Sie den Zoomlevel, um mehr Bilder gleichzeitig zu sehen.'
                : '.');
    }


    /**
     * Insert stub document for first cell that will act as drop area for uploading images
     */
    private insertStubForDropArea() {

        if (this.documents &&
            this.documents.length > 0 &&
            this.documents[0] &&
            this.documents[0].id &&
            this.documents[0].id == 'droparea') return;

        if (!this.documents) this.documents = [];

        this.documents.unshift({
            id: 'droparea',
            resource: { id: 'droparea', identifier: '', shortDescription:'', type: '', originalFilename: '',
                width: 1, height: this.compressDropArea ? 0.2 : 1, relations: { depicts: [] } }
        } as any);
    }
}

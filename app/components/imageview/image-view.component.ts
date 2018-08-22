import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {Imagestore} from '../../core/imagestore/imagestore';
import {DoceditComponent} from '../docedit/docedit.component';
import {BlobMaker} from '../../core/imagestore/blob-maker';
import {ImageContainer} from '../../core/imagestore/image-container';
import {DoceditActiveTabService} from '../docedit/docedit-active-tab-service';
import {M} from '../../m';
import {RoutingService} from '../routing-service';
import {IdaiFieldImageDocumentReadDatastore} from '../../core/datastore/field/idai-field-image-document-read-datastore';
import {isEmpty} from 'tsfun';


@Component({
    moduleId: module.id,
    templateUrl: './image-view.html'
})
/**
 * @author Daniel de Oliveira
 */
export class ImageViewComponent implements OnInit {

    protected image: ImageContainer = {};
    protected activeTab: string;

    private originalNotFound = false;
    private comingFrom: Array<any>|undefined = undefined;

    // for clean and refactor safe template, and to help find usages
    public jumpToRelationTarget = (documentToJumpTo: IdaiFieldDocument) => this.routingService.jumpToRelationTarget(
        documentToJumpTo, undefined, true);


    constructor(
        private route: ActivatedRoute,
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private imagestore: Imagestore,
        private messages: Messages,
        private router: Router,
        private modalService: NgbModal,
        private doceditActiveTabService: DoceditActiveTabService,
        private routingService: RoutingService
    ) {
        this.route.queryParams.subscribe(queryParams => {
            if (queryParams['from']) this.comingFrom = queryParams['from'].split('/');
        });
    }


    ngOnInit() {

        this.fetchDocAndImage();
        window.getSelection().removeAllRanges();
    }


    public deselect() {

        if (this.comingFrom) this.router.navigate(this.comingFrom);
        else this.router.navigate(['images']);
    }


    public async startEdit(tabName: string = 'fields') {

        this.doceditActiveTabService.setActiveTab(tabName);

        const doceditModalRef = this.modalService.open(DoceditComponent, {size: 'lg', backdrop: 'static'});
        const doceditModalComponent = doceditModalRef.componentInstance;
        doceditModalComponent.setDocument(this.image.document);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.image.document = result.document;
            this.setNextDocumentViewActiveTab();
        } catch (closeReason) {

            // this.documentEditChangeMonitor.reset();
            // TODO reset document
            if (closeReason === 'deleted') this.deselect();
        }
    }


    public hasRelations() {

        if (!this.image) return false;
        if (!this.image.document) return false;

        const relations: any = this.image.document.resource.relations;
        if (isEmpty(relations)) return false;

        return Object.keys(relations).filter(name => relations[name].length > 0).length > 0;
    }


    protected fetchDocAndImage() {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

        this.getRouteParams(async (id: string, menu: string, tab?: string) => {

            try {
                const doc = await this.datastore.get(id);
                if (!doc.resource.id) return;

                this.image.document = doc as any;

                try {
                    // read original (empty if not present)
                    let url = await this.imagestore.read(doc.resource.id, false, false);
                    if (!url || url == '') this.originalNotFound = true;
                    this.image.imgSrc = url;

                    // read thumb
                    url = await this.imagestore.read(doc.resource.id, false, true);
                    this.image.thumbSrc = url;

                    if (menu == 'edit') {
                        await this.startEdit(tab);
                    } else if (tab) {
                        this.activeTab = tab;
                    }
                } catch(e) {
                    this.image.imgSrc = BlobMaker.blackImg;
                    this.messages.add([M.IMAGES_ONE_NOT_FOUND]);
                }
            } catch(e) {
                console.error('Fatal error: could not load document for id ', id);
            }
        });
    }


    private setNextDocumentViewActiveTab() {

        const nextActiveTab = this.doceditActiveTabService.getActiveTab();
        if (['relations', 'fields'].indexOf(nextActiveTab) != -1) {
            this.activeTab = nextActiveTab;
        }
    }


    private getRouteParams(callback: Function) {

        this.route.params.forEach((params: Params) => {
            callback(params['id'], params['menu'], params['tab']);
        });
    }
}

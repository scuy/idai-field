import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'
import {imagesRouting} from './images.routing';
import {ImagesComponent} from './images.component';
import {ImageOverviewComponent} from './image-overview.component';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {UploadStatus} from '../imagegrid/upload-status';
import {ImagesState} from './images-state';
import {ImageGridModule} from "../imagegrid/image-grid.module";
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ImageOverviewToolbarComponent} from './image-overview-toolbar.component';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ImagesComponent,
        ImageOverviewComponent,
        ImageViewComponent,
        GeoreferenceViewComponent,
        LinkModalComponent,
        RemoveLinkModalComponent,
        ImageOverviewToolbarComponent
    ],
    entryComponents: [
        LinkModalComponent,
        RemoveLinkModalComponent
    ],
    providers: [
        UploadStatus,
        ImagesState
    ]
})

export class ImagesModule {}
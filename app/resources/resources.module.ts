import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './geometry-view.component';
import {EditableMapComponent} from './map/editable-map.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {ThreedWrapperComponent} from './threed/threed-wrapper.component';
import {ThreedComponent} from './threed/threed.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {ProjectsComponent} from './projects.component';
import {LayerMapState} from './map/layer-map-state';
import {WidgetsModule} from '../widgets/widgets.module'
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'
import {DoceditModule} from '../docedit/docedit.module';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        IdaiDocumentsModule,
        WidgetsModule,
        IdaiWidgetsModule,
        DoceditModule
    ],
    declarations: [
        ResourcesComponent,
        GeometryViewComponent,
        EditableMapComponent,
        MapWrapperComponent,
        ListComponent,
        ThreedWrapperComponent,
        ThreedComponent,
        RowComponent,
        PlusButtonComponent,
        ProjectsComponent
    ],
    providers: [
        LayerMapState
    ],
    exports: [
        GeometryViewComponent
    ]
})

export class ResourcesModule {}

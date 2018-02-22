import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {NavigationPathInternal} from './navigation-path-internal';


/**
 * @author Thomas Kleinke
 */
export interface ResourcesViewState {

    mainTypeDocument?: IdaiFieldDocument;
    types?: string[]; // query types in overview
    q: string; // query string in overview
    layerIds: {[mainTypeDocumentId: string]: string[]};
    navigationPaths: {[mainTypeDocumentId: string]: NavigationPathInternal};
}


export class ResourcesViewState {

    public static default() {

        return {
            q: '',
            mode: 'map',
            navigationPaths: {},
            layerIds: {}
        };
    };


    public static complete(viewState: ResourcesViewState) {

        if (!viewState.layerIds) viewState.layerIds = {};
        viewState.navigationPaths = {};
        viewState.q = '';
    }
}
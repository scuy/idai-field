import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {StateSerializer} from '../../../common/state-serializer';
import {NavigationPath} from '../navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    private _: { [viewName: string]: ResourcesViewState };
    private view: string = 'project';

    constructor(private serializer: StateSerializer) {}


    public resetForE2E() {

        this._ = { };
    }


    public initialize(): Promise<any> {

        if (this._) return Promise.resolve();

        return this.serializer.load(StateSerializer.RESOURCES_STATE)
            .then(resourcesStateMap => this._ = resourcesStateMap);
    }


    public setView(name: string) {

        if (!name) return;
        this.view = name;
        if (!this._) this._ = {};
        if (!this._[this.view]) this._[this.view] = {};
    }


    public getView() {

        return this.view;
    }


    public setSelectedOperationTypeDocumentId(mainTypeDocument: IdaiFieldDocument|undefined) {

        if (!this._[this.view]) this._[this.view] = {};
        this._[this.view].mainTypeDocument = mainTypeDocument;

        this.serialize();
    }


    public getSelectedOperationTypeDocumentId(): IdaiFieldDocument|undefined {

        return (!this._[this.view]) ? undefined : this._[this.view].mainTypeDocument;
    }


    public setMode(mode: string) {

        if (!this._[this.view]) this._[this.view] = {};
        this._[this.view].mode = mode;
        this.serialize();
    }


    public getMode(): string|undefined {

        if (!this._) return undefined;
        return (!this._[this.view]) ? undefined : this._[this.view].mode;
    }


    public setQueryString(q: string) {

        if (!this._[this.view]) this._[this.view] = {};
        this._[this.view].q = q;
        this.serialize();
    }


    public getQueryString() {

        if (!this._) return '';
        return (!this._[this.view] || !this._[this.view].q) ? '' : this._[this.view].q;
    }


    public setTypeFilters(types: string[]) {

        if (!this._[this.view]) this._[this.view] = {};
        this._[this.view].types = types;
        this.serialize();
    }


    public removeTypeFilters() {

        if (this._[this.view])  delete this._[this.view].types;
    }


    public getTypeFilters(): string[]|undefined {

        if (!this._) return undefined;
        return (!this._[this.view]) ? undefined : this._[this.view].types;
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        if (!this._[this.view]) this._[this.view] = {};
        if (!this._[this.view].layerIds) this._[this.view].layerIds = {};

        const layerIds = this._[this.view].layerIds;
        if (!layerIds) return;

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {

            layerIds[(this._[this.view].mainTypeDocument as any).resource.id] = activeLayersIds.slice(0);
            this.serialize();
        }
    }


    public getActiveLayersIds(): string[] {

        if (!this._[this.view] || !this._[this.view].layerIds) return [];

        const layerIds = this._[this.view].layerIds;
        if (!layerIds) return [];

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {
            return layerIds[(this._[this.view].mainTypeDocument as any)];
        } else {
            return [];
        }
    }


    public removeActiveLayersIds() {

        if (!this._[this.view] || !this._[this.view].layerIds) return;

        const layerIds = this._[this.view].layerIds;
        if (!layerIds) return;

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {
            delete layerIds[(this._[this.view].mainTypeDocument as any)];
            this.serialize();
        }
    }


    public setNavigationPath(navigationPath: NavigationPath) {

        if (!this._[this.view]) this._[this.view] = {};
        if (!this._[this.view].navigationPaths) this._[this.view].navigationPaths = {};

        const navigationPaths = this._[this.view].navigationPaths;
        if (!navigationPaths) return;

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {
            navigationPaths[(this._[this.view].mainTypeDocument as any).resource.id] = navigationPath;
        }
    }


    public getNavigationPath(): NavigationPath|undefined {

        if (!this._[this.view] || !this._[this.view].navigationPaths) return undefined;

        const navigationPaths = this._[this.view].navigationPaths;
        if (!navigationPaths) return undefined;

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {
            return navigationPaths[(this._[this.view].mainTypeDocument as any).resource.id];
        }
    }


    private serialize() {

        this.serializer.store(StateSerializer.RESOURCES_STATE, this.createObjectToSerialize());
    }


    private createObjectToSerialize() : { [viewName: string]: ResourcesViewState } {

        const objectToSerialize: { [viewName: string]: ResourcesViewState } = {};

        for (let viewName of Object.keys(this._)) {
            objectToSerialize[viewName] = {};
            // if (this._[viewName].mainTypeDocumentId) { // TODO comment in and also make sure loading works properly
            //     objectToSerialize[viewName].mainTypeDocumentId = this._[viewName].mainTypeDocumentId;
            // }
            if (this._[viewName].mode) objectToSerialize[viewName].mode = this._[viewName].mode;
            if (this._[viewName].layerIds) objectToSerialize[viewName].layerIds = this._[viewName].layerIds;
        }

        return objectToSerialize;
    }
}
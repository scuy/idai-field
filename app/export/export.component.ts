import {Component} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {Exporter} from './exporter';
import {Serializer} from './serializer';
import {NativeJsonlSerializer} from './native-jsonl-serializer';
import {M} from '../m';
import {PouchdbManager} from '../datastore/pouchdb-manager';
import {ImageTypeUtility} from '../util/image-type-utility';


const {dialog} = require('electron').remote;

@Component({
    moduleId: module.id,
    templateUrl: './export.html'
})

/**
 * @author Thomas Kleinke
 */
export class ExportComponent {

    private format: string = 'native';
    private running: boolean;

    constructor(
        private messages: Messages,
        private pouchdbManager: PouchdbManager,
        private imageTypeUtility: ImageTypeUtility,
        private exporter: Exporter
    ) {}

    public startExport() {

        this.chooseFilepath().then(
            filePath => {
                if (!filePath) return;

                this.running = true;
                this.messages.add([M.EXPORT_START]);

                return this.exporter.exportResources(filePath, this.getSerializer()).then(
                    () => {
                        this.running = false;
                        this.messages.add([M.EXPORT_SUCCESS]);
                    }, msgWithParams => {
                        this.running = false;
                        this.messages.add(msgWithParams);
                    }
                );
            }
        )
    }

    private chooseFilepath(): Promise<string> {

        return new Promise<string>((resolve) => {

            dialog.showSaveDialog({ filters: this.getFileFilters() }, filePath => {
                resolve(filePath);
            });
        });
    }

    private getSerializer(): Serializer {

        switch (this.format) {
            case 'native':
                return new NativeJsonlSerializer(this.pouchdbManager, this.imageTypeUtility);
        }
    }

    private getFileFilters(): Array<any> {

        switch (this.format) {
            case 'native':
                return [ { name: 'JSON Lines', extensions: [ 'jsonl' ] } ];
        }
    }
}
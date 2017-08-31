import {Serializer} from './serializer';
import {Document} from 'idai-components-2/core';

import {PouchdbManager} from '../datastore/pouchdb-manager';
import {ImageTypeUtility} from '../util/image-type-utility';

/**
 * @author Thomas Kleinke
 */
export class NativeJsonlSerializer implements Serializer {

    private db = undefined;
    private result : string = '';

    constructor(
    	private pouchdbManager: PouchdbManager,
    	private imageTypeUtility: ImageTypeUtility,
    ) {
    	this.db = pouchdbManager.getDb();
    }

    public serialize(documents: Array<Document>): Promise <string> {
    	return new Promise<any>((resolve) => {
	        var promises = [];
	        this.imageTypeUtility.getProjectImageTypeNames().then( projectImageTypeNames => {
		        for (let document of documents) {
		        	if (projectImageTypeNames.indexOf(document.resource.type) != -1) {
		      			promises.push(this.loadImageAndSerializeResource(document.resource));
		        	} else {
		  				this.result += JSON.stringify({ "resource": document.resource});
		      			this.result += '\n';
		        	}    
		       	}
				resolve(this.addSerializedImagesToResult(promises));
		    });
	    });
    }

    private addSerializedImagesToResult(loadPromises) {
    	return new Promise<any>((resolve) => {
	    	Promise.all(loadPromises).then(
	    		jsonStrings => {
	    			jsonStrings.forEach(str => {
		    			this.result += str
						this.result += '\n';
					});
					resolve(this.result);
	    		}
	    	);
	    })
    }

    private loadImageAndSerializeResource(resource): Promise <any> {
    	return new Promise<any>((resolve) => {
	    	this.db.get(resource.id, {"attachments": true}).then(data => {
				resolve(JSON.stringify({ "resource": data.resource, "_attachments": data._attachments}));
			});
	    });
    }
}
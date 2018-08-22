import {Document, ProjectConfiguration, Resource} from 'idai-components-2';
import {M} from '../../m';
import {DocumentDatastore} from "../datastore/document-datastore";
import {UsernameProvider} from '../settings/username-provider';

/**
 * @author Thomas Kleinke
 */
export class RelationsCompleter {

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration,
        private usernameProvider: UsernameProvider) {}


    /**
     * Iterates over all relations of the given resources and adds missing inverse relations to the relation targets.
     * @param resourceIds The ids of the resources whose relations are to be considered
     */
    public completeInverseRelations(resourceIds: string[]): Promise<any> {

        return this.alterInverseRelations('create', resourceIds);
    }


    /**
     * Iterates over all relations of the given resources and removes the corresponding inverse relations of the
     * relation targets.
     * @param resourceIds The ids of the resources whose relations are to be considered
     */
    public resetInverseRelations(resourceIds: string[]): Promise<any> {

        return this.alterInverseRelations('remove', resourceIds);
    }


    /**
     * Iterates over all relations of the given resources and either creates or removes the corresponding inverse
     * relations of the relation targets.
     * @param mode: Can be either 'create' or 'remove'
     */
    private alterInverseRelations(mode: string, resourceIds: string[]): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let resourceId of resourceIds) {
                promise = promise.then(
                    () => this.alterInverseRelationsForResource(mode, resourceId),
                    err => reject(err)
                );
            }

            promise.then(
                () => resolve(),
                err => reject(err)
            );
        });
    }


    /**
     * Creates/removes inverse relations for a single resource.
     * @param mode: Can be either 'create' or 'remove'
     */
    private alterInverseRelationsForResource(mode: string, resourceId: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.datastore.get(resourceId).then(
                document => {

                        let promise: Promise<any> = new Promise<any>((res) => res());

                        for (let relationName in document.resource.relations) {
                            if (relationName == 'isRecordedIn') continue;

                            if (this.projectConfiguration.isRelationProperty(relationName)) {
                                for (let targetId of document.resource.relations[relationName]) {
                                    promise = promise.then(
                                        () => this.alterRelation(mode, document.resource, targetId,
                                            this.projectConfiguration.getInverseRelations(relationName) as any),
                                        err => reject(err)
                                    );
                                }
                            }
                        }

                        promise.then(
                            () => resolve(),
                            err => reject(err)
                        );
                    }
                ,
                err => reject(err)
            );
        });
    }


    /**
     * Either adds (in mode 'create') oder removes (in mode 'remove') an relation.
     * @param mode Can be either 'create' or 'remove'
     */
    private alterRelation(mode: string, resource: Resource, targetId: string,
                                 relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.datastore.get(targetId).then(
                targetDocument => {
                    let promise;
                    switch (mode) {
                        case 'create':
                            promise = this.createRelation(resource, targetDocument, relationName);
                            break;
                        case 'remove':
                            promise = this.removeRelation(resource, targetDocument, relationName);
                            break;
                    }
                    (promise as any).then(
                        () => resolve(),
                        (err: any) => reject(err)
                    )
                }, () => {
                    switch (mode) {
                        case 'create':
                            reject([M.IMPORT_FAILURE_MISSING_RELATION_TARGET, targetId]);
                            break;
                        case 'remove':
                            resolve();
                            break;
                    }
                }
            );
        });
    }


    private createRelation(resource: Resource, targetDocument: Document, relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relations = targetDocument.resource.relations[relationName];
            if (!relations) relations = [];
            if (relations.indexOf(resource.id as any) == -1) {
                relations.push(resource.id as any);
                targetDocument.resource.relations[relationName] = relations;
                this.datastore.update(targetDocument, this.usernameProvider.getUsername()).then(
                    doc => resolve(),
                    err => reject(err)
                );
            } else resolve();
        });
    }


    private removeRelation(resource: Resource, targetDocument: Document, relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relations = targetDocument.resource.relations[relationName];
            if (!relations || relations.indexOf(resource.id as any) == -1) {
                resolve();
            } else {
                relations.splice(relations.indexOf(resource.id as any), 1);
                targetDocument.resource.relations[relationName] = relations;
                this.datastore.update(targetDocument, this.usernameProvider.getUsername()).then(
                    doc => resolve(),
                    err => reject(err)
                );
            }
        });
    }
}

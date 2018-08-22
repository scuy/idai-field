import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document, IdaiType, ProjectConfiguration} from 'idai-components-2';
import {Imagestore} from '../../core/imagestore/imagestore';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {M} from '../../m';
import {UploadModalComponent} from './upload-modal.component';
import {ExtensionUtil} from '../../util/extension-util';
import {UploadStatus} from './upload-status';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {NewIdaiFieldImageDocument} from 'idai-components-2';
import {IdaiFieldImageDocumentReadDatastore} from '../../core/datastore/field/idai-field-image-document-read-datastore';
import {UsernameProvider} from '../../core/settings/username-provider';

export interface ImageUploadResult {

    uploadedImages: number;
    messages: Array<Array<string>>;
}

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageUploader {

    private static supportedFileTypes: Array<string> = ['jpg', 'jpeg', 'png'];


    public constructor(
        private imagestore: Imagestore,
        private datastore: DocumentReadDatastore,
        private modalService: NgbModal,
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private usernameProvider: UsernameProvider,
        private uploadStatus: UploadStatus,
        private imageDocumentDatastore: IdaiFieldImageDocumentReadDatastore
    ) {}


    /**
     * @param event The event containing the images to upload (can be drag event or event from file input element)
     * @param depictsRelationTargetId If this parameter is set, each of the newly created image documents will contain
     *  a depicts relation to the resource specified by the id.
     */
    public startUpload(event: Event, depictsRelationTarget?: Document): Promise<ImageUploadResult> {

        const uploadResult: ImageUploadResult = { uploadedImages: 0, messages: [] };

        if (!this.imagestore.getPath()) {
            uploadResult.messages.push([M.IMAGESTORE_ERROR_INVALID_PATH_WRITE]);
            return Promise.resolve(uploadResult);
        }

        const files = ImageUploader.getFiles(event);
        const result = ExtensionUtil.reportUnsupportedFileTypes(files, ImageUploader.supportedFileTypes);
        if (result[1]) uploadResult.messages.push([M.IMAGESTORE_DROP_AREA_UNSUPPORTED_EXTS, result[1]]);
        if (result[0] == 0) return Promise.resolve(uploadResult);

        let uploadModalRef: any;
        return this.chooseType(files.length, depictsRelationTarget)
            .then(type => {
                uploadModalRef = this.modalService.open(UploadModalComponent, { backdrop: 'static', keyboard: false });
                return this.uploadFiles(files, type, uploadResult, depictsRelationTarget).then(result => {
                    uploadModalRef.close();
                    return Promise.resolve(result);
                });
            }).catch(() => Promise.resolve(uploadResult));
    }


    private chooseType(fileCount: number, depictsRelationTarget?: Document): Promise<IdaiType> {

        return new Promise((resolve, reject) => {

            const imageType: IdaiType = this.projectConfiguration.getTypesTree()['Image'];
            if ((imageType.children && imageType.children.length > 0) || fileCount >= 100 || depictsRelationTarget) {
                const modal: NgbModalRef
                    = this.modalService.open(ImageTypePickerModalComponent, { backdrop: 'static', keyboard: false });

                modal.result.then(
                    (type: IdaiType) => resolve(type),
                    closeReason => reject());

                modal.componentInstance.fileCount = fileCount;
                modal.componentInstance.depictsRelationTarget = depictsRelationTarget;
            } else {
                resolve(imageType);
            }
        });
    }


    private uploadFiles(files: Array<File>, type: IdaiType, uploadResult: ImageUploadResult,
                        depictsRelationTarget?: Document): Promise<ImageUploadResult> {

        if (!files) return Promise.resolve(uploadResult);

        this.uploadStatus.setTotalImages(files.length);
        this.uploadStatus.setHandledImages(0);

        const duplicateFilenames: string[] = [];
        let promise: Promise<any> = Promise.resolve();

        for (let file of files) {
            if (ExtensionUtil.ofUnsupportedExtension(file, ImageUploader.supportedFileTypes)) {
                this.uploadStatus.setTotalImages(this.uploadStatus.getTotalImages() - 1);
            } else {
                promise = promise.then(() => this.isDuplicateFilename(file.name))
                    .then(isDuplicateFilename => {
                        if (!isDuplicateFilename) {
                            return this.uploadFile(file, type, depictsRelationTarget);
                        } else {
                            duplicateFilenames.push(file.name);
                        }
                    }).then(() => this.uploadStatus.setHandledImages(this.uploadStatus.getHandledImages() + 1));
            }
        }

        return promise.then(
            () => {
                uploadResult.uploadedImages = this.uploadStatus.getHandledImages() - duplicateFilenames.length;
            }, msgWithParams => {
                uploadResult.messages.push(msgWithParams);
            }
        ).then(
            () => {
                if (duplicateFilenames.length == 1) {
                    uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAME, duplicateFilenames[0]]);
                } else if (duplicateFilenames.length > 1) {
                    uploadResult.messages.push([M.IMAGES_ERROR_DUPLICATE_FILENAMES, duplicateFilenames.join(', ')]);
                }

                return Promise.resolve(uploadResult);
            }
        )
    }


    private isDuplicateFilename(filename: string): Promise<boolean> {

        return this.datastore.find({
            constraints: {
                'identifier:match' : filename
            }
        }).then(result => result.totalCount > 0);
    }


    private uploadFile(file: File, type: IdaiType, depictsRelationTarget?: Document): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let reader = new FileReader();
            reader.onloadend = (that => {
                return () => {
                    that.createImageDocument(file, type, depictsRelationTarget)
                        .then(doc => that.imagestore.create(doc.resource.id, reader.result, true).then(() =>
                            // to refresh the thumbnail in cache, which is done to prevent a conflict afterwards
                            this.imageDocumentDatastore.get(doc.resource.id, { skip_cache: true })
                        ))
                        .then(() =>
                            resolve()
                        )
                        .catch(error => {
                            console.error(error);
                            reject([M.IMAGESTORE_ERROR_WRITE, file.name]);
                        });
                }
            })(this);
            reader.onerror = () => {
                return (error: any) => {
                    console.error(error);
                    reject([M.IMAGES_ERROR_FILEREADER, file.name]);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }


    private createImageDocument(file: File, type: IdaiType, depictsRelationTarget?: Document): Promise<any> {

        return new Promise((resolve, reject) => {

            let img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const doc: NewIdaiFieldImageDocument = {
                    resource: {
                        identifier: file.name,
                        shortDescription: '',
                        type: type.name,
                        originalFilename: file.name,
                        width: img.width,
                        height: img.height,
                        relations: {
                            depicts: []
                        }
                    }
                };

                if (depictsRelationTarget && depictsRelationTarget.resource.id) {
                    doc.resource.relations['depicts'] = [depictsRelationTarget.resource.id];
                }

                this.persistenceManager.persist(doc, this.usernameProvider.getUsername())
                    .then((result: any) => resolve(result))
                    .catch((error: any) => reject(error));
            };
        });
    }


    private static getFiles(_event: Event) {

        const event = _event as any;

        if (!event) return [];
        let files = [];

        if (event['dataTransfer']) {
            if (event['dataTransfer']['files']) files = event['dataTransfer']['files'];
        } else if (event['srcElement']) {
            if (event['srcElement']['files']) files = event['srcElement']['files'];
        }

        return files;
    }
}
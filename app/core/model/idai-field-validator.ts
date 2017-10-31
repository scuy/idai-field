import {ConfigLoader} from 'idai-components-2/configuration'
import {Validator} from 'idai-components-2/persist';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Document} from 'idai-components-2/core';
import {M} from '../../m';
import {CachedDatastore} from '../datastore/core/cached-datastore';
import {DocumentDatastore} from "../datastore/core/document-datastore";


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdaiFieldValidator extends Validator {

    constructor(configLoader: ConfigLoader, private datastore: DocumentDatastore) {
        super(configLoader);
    }

    /**
     * @param doc
     * @returns {Promise<void>}
     * @returns {Promise<void>} resolves with () or rejects with msgsWithParams in case of validation error
     */
    protected validateCustom(doc: IdaiFieldDocument): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.validateIdentifier(doc).then(
                () => {
                    let msgWithParams = IdaiFieldValidator.validateGeometry(doc.resource.geometry as any);
                    if (!msgWithParams) {
                        resolve();
                    } else {
                        reject(msgWithParams);
                    }
                },
                err => reject(err)
            );
        });
    }

    private validateIdentifier(doc: IdaiFieldDocument): Promise<any> {

        return this.datastore.find({
                constraints: {
                    'resource.identifier' : doc.resource.identifier
                }
            }).then(result => {
                if (result && result.length > 0 && IdaiFieldValidator.isDuplicate(result[0], doc)) {
                    return Promise.reject([M.MODEL_VALIDATION_ERROR_IDEXISTS, doc.resource.identifier]);
                }
                return Promise.resolve();
            }, () => {
                return Promise.reject([M.ALL_FIND_ERROR]);
            });
    }

    private static validateGeometry(geometry: IdaiFieldGeometry): Array<string>|null {

        if (!geometry) return null;

        if (!geometry.type) return [ M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE ];
        if (!geometry.coordinates) return [ M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES ];

        switch(geometry.type) {
            case 'Point':
                if (!IdaiFieldValidator.validatePointCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'Point' ];
                }
                break;
            case 'LineString':
                if (!IdaiFieldValidator.validatePolylineCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'LineString' ];
                }
                break;
            case 'MultiLineString':
                if (!IdaiFieldValidator.validateMultiPolylineCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'MultiLineString' ];
                }
                break;
            case 'Polygon':
                if (!IdaiFieldValidator.validatePolygonCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'Polygon' ];
                }
                break;
            case 'MultiPolygon':
                if (!IdaiFieldValidator.validateMultiPolygonCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'MultiPolygon' ];
                }
                break;
            default:
                return [ M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE, geometry.type ];
        }

        return null;
    }

    private static validatePointCoordinates(coordinates: number[]): boolean {

        if (coordinates.length < 2 || coordinates.length > 3) return false;
        if (isNaN(coordinates[0])) return false;
        if (isNaN(coordinates[1])) return false;
        if (coordinates.length == 3 && isNaN(coordinates[2])) return false;

        return true;
    }

    private static validatePolylineCoordinates(coordinates: number[][]): boolean {

        if (coordinates.length < 2) return false;

        for (let i in coordinates) {
            if (!IdaiFieldValidator.validatePointCoordinates(coordinates[i])) return false;
        }

        return true;
    }

    private static validateMultiPolylineCoordinates(coordinates: number[][][]): boolean {

        if (coordinates.length == 0) return false;

        for (let i in coordinates) {
            if (!IdaiFieldValidator.validatePolylineCoordinates(coordinates[i])) return false;
        }

        return true;
    }

    private static validatePolygonCoordinates(coordinates: number[][][]): boolean {

        if (coordinates.length == 0) return false;

        for (let i in coordinates) {
            if (coordinates[i].length < 3) return false;

            for (let j in coordinates[i]) {
                if (!IdaiFieldValidator.validatePointCoordinates(coordinates[i][j])) return false;
            }
        }

        return true;
    }

    private static validateMultiPolygonCoordinates(coordinates: number[][][][]): boolean {

        if (coordinates.length == 0) return false;

        for (let i in coordinates) {
            if (!IdaiFieldValidator.validatePolygonCoordinates(coordinates[i])) return false;
        }

        return true;
    }

    private static isDuplicate(result: any, doc: any) {
        return result.resource.id != doc.resource.id;
    }
}
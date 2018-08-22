import {Observable} from 'rxjs/Observable';
import {IdaiFieldGeometry} from 'idai-components-2';
import {M} from '../../m';
import {NewDocument, Document} from 'idai-components-2';
import {AbstractParser} from './abstract-parser';
import {Observer} from 'rxjs/Observer';

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdigCsvParser extends AbstractParser {


    private static MANDATORY_FIELDS: string[] = ['IdentifierUUID', 'Type'];
    private static MANUALLY_MAPPED_FIELDS: string[] = ['Identifier', 'Title'];
    private static IGNORED_FIELDS: string[] = ['Contributor', 'Coverage', 'CoverageSpatial',
        'CoverageSpatialAreaCartesian_double', 'CoverageSpatialBoundsCartesian_bbox', 'CoverageSpatialCRS',
        'CoverageSpatialCartesian_rpt', 'CoverageSpatialElevations_rpt', 'CoverageSpatialPoints_rpt',
        'CoverageTemporal', 'CoverageTemporalStart', 'CoverageTemporal_range', 'Creator', 'Date', 'DateTimeZone',
        'Date_range', 'Description', 'Format', 'FormatDiameter', 'FormatDiameter_double', 'FormatDimensions',
        'FormatDimensions_double', 'FormatHeight', 'FormatHeight_double', 'FormatLength', 'FormatLength_double',
        'FormatLocked', 'FormatMaximumDimension', 'FormatMaximumDimension_double', 'FormatPreservedHeight',
        'FormatPreservedHeight_double', 'FormatSidelined', 'FormatStatus', 'FormatThickness', 'FormatThickness_double',
        'FormatTrashed', 'FormatWidth', 'FormatWidth_double', 'Language', 'Publisher',
        'Rights', 'Source', 'Subject', 'Buckets', 'Category', 'Contents', 'Context', 'CoverageAltitude',
        'CoverageArea', 'CoverageCoordinates', 'CoverageEarliest', 'CoverageEnvelope', 'CoverageGeometry',
        'CoverageJSON', 'CoverageLatest', 'CoveragePosition', 'CoverageSerialized', 'CoverageTransform',
        'CoverageUTC', 'DateEarliest', 'DateEarliestISO8601', 'DateLatest', 'DateLatestISO8601',
        'DateModified', 'DateUTC', 'Deposit', 'FormatImage', 'FormatImageHeight', 'FormatImageWidth', 'Looking',
        'LotContexts', 'LotDates', 'LotGrid', 'LotLevels', 'Material', 'NotebookPage', 'Period', 'Phase',
        'RelationAttachments', 'RelationIsAfter', 'RelationIsAfterUUID', 'RelationIsBefore',
        'RelationIsBeforeUUID', 'RightsDeleted', 'RightsLocked', 'RightsSidelined', 'RightsStatus',
        'RightsTrashed', 'SectionNumber', 'Storage'
    ];
    private static RELATION_FIELDS: string[] = [
        'Relation', 'Relation_uuid',
        'RelationBelongsTo', 'RelationBelongsToUUID', 'RelationIncludes', 'RelationIncludesUUID',
        'RelationIsAbove', 'RelationIsAboveUUID', 'RelationIsBelow', 'RelationIsBelowUUID', 'RelationIsCoevalWith',
        'RelationIsCoevalWithUUID'
    ];
    private static GEOMETRY_FIELD: string = 'CoverageUnion';


    public parse(content: string): Observable<Document> {

        this.warnings = [];

        return Observable.create((observer: Observer<any>) => {

            let errorCallback = (e: any) => observer.error([M.IMPORT_FAILURE_INVALIDCSV, e.row]);

            let completeCallback = (result: any) => {
                result.errors.forEach( (e: any) => errorCallback(e) );
                result.data.forEach( (object: any, i:any) => {
                    let msgWithParams = this.checkExistenceOfMandatoryFields(object, i + 1);
                    if (msgWithParams != undefined) {
                        observer.error(msgWithParams);
                    } else {
                        try {
                            observer.next(this.documentFrom(object, i + 1));
                        } catch (msgWithParams) {
                            observer.error(msgWithParams);
                        }
                    }
                });
                observer.complete();
            };

            try {
                Papa.parse(content, {
                    header: true,
                    skipEmptyLines: true,
                    worker: true,
                    error: errorCallback,
                    complete: completeCallback
                });
            } catch (e) {
                observer.error([M.IMPORT_FAILURE_GENERICCSVERROR]);
            }
        });

    }


    /**
     * @param object an iDig object
     * @param lineNumber
     * @returns {any} msgWithParams for the first occurence of a missing field
     */
    private checkExistenceOfMandatoryFields(object: any, lineNumber: number): any {
        let msgWithParams: any = undefined;
        IdigCsvParser.MANDATORY_FIELDS.forEach( mandatoryField => {
            if (!object[mandatoryField] || 0 === object[mandatoryField].length) {
                if (!msgWithParams) msgWithParams = [M.IMPORT_FAILURE_MANDATORYCSVFIELDMISSING,lineNumber,mandatoryField];
            }
        });
        return msgWithParams;
    }


    private identifier(object: any) {
        if (object['Identifier'] != undefined)
            return object['Identifier'];
        else
            return object['IdentifierUUID'];
    }


    private documentFrom(object: any, lineNumber: number): Document {

        let doc: NewDocument = {
            resource: {
                id: object['IdentifierUUID'],
                // We suffix the identifier with some autogenerated text
                // this is because our testdata from the idai-field-configs
                // repo has records with duplicate identifiers.
                identifier: '' + this.identifier(object) + ' (imported item nr. ' + lineNumber + ')',
                type: object['Type'],
                shortDescription: object['Title'],
                relations: { isRecordedIn: []}
            }
        };

        // After this initial setup, the rest of the fields is mapped 'automatically'.
        return this.map(object, doc, lineNumber);
    }


    private map(object: any, doc: any, lineNumber: number): Document {

        Object.keys(object).forEach( field => {
            if (IdigCsvParser.IGNORED_FIELDS.indexOf(field) == -1) {

                if (this.isRelation(field)) {
                    this.mapRelationField(object, doc.resource, field);
                } else if (field == IdigCsvParser.GEOMETRY_FIELD) {
                    this.mapGeometryField(object, doc.resource, lineNumber);
                }
                else this.copyField(object, doc.resource,field);
            }
        });

        return doc;
    }


    private isRelation(field: any) {
        return (IdigCsvParser.RELATION_FIELDS.indexOf(field) != -1);
    }


    private hasContent(object: any, field: any) {
        return (object[field] != undefined && object[field] != '');
    }


    private relationName(relation: any) {
        var relN = relation.substring(0, relation.indexOf('UUID'));
        var relN = relN.replace('Relation', '');
        if (relN == '') return 'Relation';
        else return relN;
    }


    private isMappableRelation(relation: any) {
        return (relation.indexOf('UUID') != -1) && (this.relationName(relation) != 'Relation');
    }


    private mapRelationField(object: any, resource: any, relation: any) {

        if (this.hasContent(object, relation)) {
            if (this.isMappableRelation(relation)) {
                resource['relations'][this.relationName(relation)] =
                    object[relation].split(/[\n\s\t]/g);
            }
        }
    };


    private mapGeometryField(object: any, resource: any, lineNumber: number) {

        if (this.hasContent(object, IdigCsvParser.GEOMETRY_FIELD)) {
            let geometryString = object[IdigCsvParser.GEOMETRY_FIELD];
            let geometry: IdaiFieldGeometry|null = this.parseGeometryString(geometryString, lineNumber);
            if (geometry) resource.geometry = geometry;
        }
    }


    private parseGeometryString(geometryString: any, lineNumber: number): IdaiFieldGeometry|null {

        geometryString = geometryString.toLowerCase();
        let geometry: IdaiFieldGeometry|null = null;

        if (geometryString.startsWith('point')) {
            geometry = this.parsePointGeometryString(geometryString, lineNumber);
        } else if (geometryString.startsWith('polygon')) {
            geometry = this.parsePolygonGeometryString(geometryString, lineNumber);
        } else if (geometryString.startsWith('multipolygon')) {
            geometry = this.parseMultiPolygonGeometryString(geometryString, lineNumber);
        }

        return geometry;
    }


    private parsePointGeometryString(geometryString: string, lineNumber: number): IdaiFieldGeometry {

        let geometry: IdaiFieldGeometry = { type: 'Point', coordinates: [] };

        geometryString = geometryString
            .replace('point ((', '')
            .replace('))', '');

        geometry.coordinates = this.parsePoint(geometryString, lineNumber);

        return geometry;
    }


    private parsePolygonGeometryString(geometryString: string, lineNumber: number): IdaiFieldGeometry {

        let geometry: IdaiFieldGeometry = { type: 'Polygon', coordinates: [] };

        geometryString = geometryString
            .replace('polygon ((', '')
            .replace('))', '');

        geometry.coordinates = this.parsePolygon(geometryString, lineNumber);

        return geometry;
    }


    private parseMultiPolygonGeometryString(geometryString: string, lineNumber: number): IdaiFieldGeometry {

        let geometry: IdaiFieldGeometry = {  type: 'MultiPolygon', coordinates: [] };

        geometryString = geometryString
            .replace('multipolygon ((', '')
            .replace('))', '');

        let coordinates: Array<string> = geometryString.split('), (');

        for (let polygonCoordinates of coordinates) {
            geometry.coordinates.push(this.parsePolygon(polygonCoordinates, lineNumber));
        }

        return geometry;
    }


    private parsePoint(coordinatesString: string, lineNumber: number): number[] {

        let point: number[] = [];

        let coordinates: Array<string> = coordinatesString.split(' ');
        if (coordinates.length != 2) {
            throw [M.IMPORT_FAILURE_INVALIDGEOMETRY, lineNumber];
        }

        point[0] = parseFloat(coordinates[0].replace(',', '.'));
        point[1] = parseFloat(coordinates[1].replace(',', '.'));
        if (isNaN(point[0]) || isNaN(point[1])) {
            throw [M.IMPORT_FAILURE_INVALIDGEOMETRY, lineNumber];
        }

        return point;
    }


    private parsePolygon(coordinatesString: string, lineNumber: number): number[][][] {

        let polygon: number[][][] = [[]];

        let coordinates: Array<string> = coordinatesString.split(', ');
        if (coordinates.length < 3) {
            throw [M.IMPORT_FAILURE_INVALIDGEOMETRY, lineNumber];
        }

        for (let pointCoordinates of coordinates) {
            polygon[0].push(this.parsePoint(pointCoordinates, lineNumber));
        }

        return polygon;
    }


    /**
     * Copies a field if it is neither mandatory nor marked as
     * manually mapped.
     *
     * @param object
     * @param resource
     * @param field
     */
    private copyField(object: any, resource: any, field: any) {

        if (IdigCsvParser.MANDATORY_FIELDS.indexOf(field) == -1 &&
            IdigCsvParser.MANUALLY_MAPPED_FIELDS.indexOf(field) == -1) {
            resource[field] = object[field];
        }
    }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var idig_csv_parser_1 = require("../../app/core/importer/idig-csv-parser");
var m_1 = require("../../app/m");
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
function main() {
    describe('IdigCsvParser', function () {
        beforeEach(function () {
            spyOn(console, 'error'); // to suppress console.error output
        });
        it('should create documents from file content', function (done) {
            var fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,Context\n'
                + '2,two,Two,Context\n';
            var parser = new idig_csv_parser_1.IdigCsvParser();
            var documents = [];
            parser.parse(fileContent).subscribe(function (resultDocument) {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument);
            }, function (err) {
                console.error(err);
                fail();
            }, function () {
                expect(documents.length).toBe(2);
                expect(parser.getWarnings().length).toBe(0);
                expect(documents[0].resource.id).toEqual('1');
                expect(documents[0].resource.type).toEqual('Context');
                expect(documents[1].resource.shortDescription).toEqual('Two');
                done();
            });
        });
        it('should abort on syntax errors in file content', function (done) {
            var fileContent = 'IdentifierUUID,Identifier,Title,Type\n'
                + '1,one,One,Context\n'
                + ',two,Two,Context\n';
            var parser = new idig_csv_parser_1.IdigCsvParser();
            var documents = [];
            parser.parse(fileContent).subscribe(function (resultDocument) {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument);
            }, function (msgWithParams) {
                expect(documents.length).toBe(1);
                expect(documents[0].resource.id).toEqual('1');
                expect(msgWithParams).toEqual([m_1.M.IMPORT_FAILURE_MANDATORYCSVFIELDMISSING, 2, 'IdentifierUUID']);
                done();
            });
        });
        it('should parse point, polygon and multipolygon geometries', function (done) {
            var fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
                + '1	one	One	Context	POINT ((416,361 354,404))\n'
                + '2	two	Two	Context	POLYGON ((415,732 354,88, 416,982 353,988, 416,227 352,992, 415,732 354,88))\n'
                + '3	three	Three	Context	MULTIPOLYGON ((407,259 356,711, 407,25 356,417, 407,29 356,430, '
                + '407,259 356,711), (406,432 356,684, 406,46 356,698, 406,50 356,690, 406,432 356,684))\n';
            var parser = new idig_csv_parser_1.IdigCsvParser();
            var documents = [];
            parser.parse(fileContent).subscribe(function (resultDocument) {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument);
            }, function (err) {
                console.error(err);
                fail();
            }, function () {
                expect(documents.length).toBe(3);
                expect(parser.getWarnings().length).toBe(0);
                expect(documents[0].resource.geometry.type).toEqual('Point');
                expect(documents[0].resource.geometry.coordinates).toEqual([416.361, 354.404]);
                expect(documents[1].resource.geometry.type).toEqual('Polygon');
                expect(documents[1].resource.geometry.coordinates).toEqual([[[415.732, 354.88], [416.982, 353.988], [416.227, 352.992], [415.732, 354.88]]]);
                done();
                expect(documents[2].resource.geometry.type).toEqual('MultiPolygon');
                expect(documents[2].resource.geometry.coordinates).toEqual([[[[407.259, 356.711], [407.25, 356.417], [407.29, 356.430], [407.259, 356.711]]],
                    [[[406.432, 356.684], [406.46, 356.698], [406.50, 356.690], [406.432, 356.684]]]]);
                done();
            });
        });
        it('should abort on invalid geometries', function (done) {
            var fileContent = 'IdentifierUUID	Identifier	Title	Type	CoverageUnion\n'
                + '1	one	One	Context	POINT ((416,361 354,404))\n'
                + '2	two	Two	Context	POINT ((416,361 354,404 354,404))\n';
            var parser = new idig_csv_parser_1.IdigCsvParser();
            var documents = [];
            parser.parse(fileContent).subscribe(function (resultDocument) {
                expect(resultDocument).not.toBe(undefined);
                documents.push(resultDocument);
            }, function (err) {
                expect(documents.length).toBe(1);
                expect(documents[0].resource.id).toEqual('1');
                expect(err).toEqual([m_1.M.IMPORT_FAILURE_INVALIDGEOMETRY, 2]);
                done();
            });
        });
    });
}
exports.main = main;
//# sourceMappingURL=idig-csv-parser.spec.js.map
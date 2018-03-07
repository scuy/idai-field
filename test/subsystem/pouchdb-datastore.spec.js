"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("idai-components-2/core");
var static_1 = require("./static");
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
function main() {
    var _this = this;
    describe('PouchdbDatastore', function () {
        var datastore;
        beforeEach(function () {
            spyOn(console, 'debug'); // to suppress console.debug output
            spyOn(console, 'error'); // to suppress console.error output
            spyOn(console, 'warn');
            var result = static_1.Static.createPouchdbDatastore('testdb');
            datastore = result.datastore;
        });
        afterEach(function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new PouchDB('testdb').destroy()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, new PouchDB('testdb2').destroy()];
                    case 2:
                        _a.sent();
                        done();
                        return [2 /*return*/];
                }
            });
        }); }, 5000);
        var expectErr = function (promise, expectedMsgWithParams, done) {
            promise().then(function (result) {
                fail('rejection with ' + expectedMsgWithParams
                    + ' expected but resolved with ' + result);
                done();
            }, function (msgWithParams) {
                expect(msgWithParams).toEqual(expectedMsgWithParams);
                done();
            });
        };
        // create
        it('should create a document and create a resource.id', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var createdDoc, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, datastore.create(static_1.Static.doc('sd1'))];
                    case 1:
                        createdDoc = _a.sent();
                        expect(createdDoc.resource.id).not.toBe(undefined);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        fail(e_1);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should create a document and take the existing resource.id', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var docToCreate, createdDoc, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        docToCreate = static_1.Static.doc('sd1');
                        docToCreate.resource.id = 'a1';
                        return [4 /*yield*/, datastore.create(docToCreate)];
                    case 1:
                        _a.sent();
                        // this step was added to adress a problem where a document
                        // with an existing resource.id was stored but could not
                        // get refreshed later
                        return [4 /*yield*/, datastore.fetch(docToCreate.resource.id)];
                    case 2:
                        // this step was added to adress a problem where a document
                        // with an existing resource.id was stored but could not
                        // get refreshed later
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, datastore.fetch(docToCreate.resource.id)];
                    case 4:
                        createdDoc = _a.sent();
                        expect(createdDoc.resource.id).toBe('a1');
                        return [3 /*break*/, 6];
                    case 5:
                        e_2 = _a.sent();
                        fail(e_2);
                        return [3 /*break*/, 6];
                    case 6:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not create a document with the resource.id of an alredy existing doc', function (done) {
            var docToCreate1 = static_1.Static.doc('sd1');
            docToCreate1.resource.id = 'a1';
            var docToCreate2 = static_1.Static.doc('sd1');
            docToCreate2.resource.id = 'a1';
            expectErr(function () {
                return datastore.create(docToCreate1)
                    .then(function () { return datastore.create(docToCreate2); });
            }, [core_1.DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS], done);
        });
        it('should not create if created not present', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var doc, expected_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        doc = static_1.Static.doc('sd1');
                        delete doc.created;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, datastore.create(doc)];
                    case 2:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 4];
                    case 3:
                        expected_1 = _a.sent();
                        expect(expected_1[0]).toBe(core_1.DatastoreErrors.INVALID_DOCUMENT);
                        return [3 /*break*/, 4];
                    case 4:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // update
        it('should update an existing document with no identifier conflict', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var doc2, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        doc2 = static_1.Static.doc('id2');
                        return [4 /*yield*/, datastore.create(static_1.Static.doc('id1'))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, datastore.create(doc2)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, datastore.update(doc2)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        e_3 = _a.sent();
                        fail(e_3);
                        return [3 /*break*/, 6];
                    case 6:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not update if resource id not present', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, datastore.update(static_1.Static.doc('sd1'))];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_2 = _a.sent();
                        expect(expected_2[0]).toBe(core_1.DatastoreErrors.DOCUMENT_NO_RESOURCE_ID);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not update if created not present', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var doc, expected_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        doc = static_1.Static.doc('sd1');
                        delete doc.created;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, datastore.update(doc)];
                    case 2:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 4];
                    case 3:
                        expected_3 = _a.sent();
                        expect(expected_3[0]).toBe(core_1.DatastoreErrors.INVALID_DOCUMENT);
                        return [3 /*break*/, 4];
                    case 4:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not update if not existent', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expectedErr_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, datastore.update(static_1.Static.doc('sd1', 'identifier1', 'Find', 'id1'))];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expectedErr_1 = _a.sent();
                        expect(expectedErr_1[0]).toBe(core_1.DatastoreErrors.DOCUMENT_NOT_FOUND);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // fetch
        it('should get if existent', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var d, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        d = static_1.Static.doc('sd1');
                        return [4 /*yield*/, datastore.create(d)];
                    case 1:
                        _b.sent();
                        _a = expect;
                        return [4 /*yield*/, datastore.fetch(d.resource.id)];
                    case 2:
                        _a.apply(void 0, [(_b.sent())['resource']['shortDescription']]).toBe('sd1');
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject with keyOfM in when trying to get a non existing document', function (done) {
            expectErr(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, datastore.create(static_1.Static.doc('sd1'))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, datastore.fetch('nonexisting')];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }, [core_1.DatastoreErrors.DOCUMENT_NOT_FOUND], done);
        });
        // refresh
        it('should reject with keyOfM in when trying to refresh a non existing document', function (done) {
            expectErr(function () {
                return datastore.create(static_1.Static.doc('id1'))
                    .then(function () { return datastore.fetch('nonexistingid'); });
            }, [core_1.DatastoreErrors.DOCUMENT_NOT_FOUND], done);
        });
        // remove
        it('should remove if existent', function (done) {
            var d = static_1.Static.doc('sd1');
            expectErr(function () {
                return datastore.create(d)
                    .then(function () { return datastore.remove(d); })
                    .then(function () { return datastore.fetch(d['resource']['id']); });
            }, [core_1.DatastoreErrors.DOCUMENT_NOT_FOUND], done);
        });
        it('should throw error when no resource id', function (done) {
            expectErr(function () { return datastore.remove(static_1.Static.doc('sd2')); }, [core_1.DatastoreErrors.DOCUMENT_NO_RESOURCE_ID], done);
        });
        it('should throw error when trying to remove and not existent', function (done) {
            var d = static_1.Static.doc('sd1');
            d['resource']['id'] = 'hoax';
            expectErr(function () { return datastore.remove(d); }, [core_1.DatastoreErrors.DOCUMENT_NOT_FOUND], done);
        });
    });
}
exports.main = main;
//# sourceMappingURL=pouchdb-datastore.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constraint_indexer_1 = require("../../../../../app/core/datastore/index/constraint-indexer");
/**
 * @author Daniel de Oliveira
 */
describe('ConstraintIndexer', function () {
    var ci;
    function doc(id) {
        return {
            resource: {
                id: id,
                identifier: 'identifier' + id,
                relations: {} // TODO test for undefined relations,
            },
            created: {
                date: '2017-12-31'
            },
            modified: [
                {
                    date: '2018-01-01'
                }
            ]
        };
    }
    function indexItem(id, identifier) {
        if (!identifier)
            identifier = 'identifier' + id;
        return { id: id, date: '2018-01-01', identifier: identifier };
    }
    it('multiple docs are recorded in another', function () {
        var docs = [
            doc('2'),
            doc('3')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['1'];
        docs[1].resource.relations['isRecordedIn'] = ['1'];
        ci = new constraint_indexer_1.ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' }
        }, false);
        ci.put(docs[0]);
        ci.put(docs[1]);
        expect(ci.get('isRecordedIn:contain', '1')).toEqual([indexItem('2'), indexItem('3')]);
    });
    function docWithMultipleConstraintTargets() {
        var docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2', '3'];
        ci = new constraint_indexer_1.ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' }
        });
        ci.put(docs[0]);
        return docs;
    }
    it('one doc is recorded in multiple others', function () {
        docWithMultipleConstraintTargets();
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([indexItem('1')]);
        expect(ci.get('isRecordedIn:contain', '3')).toEqual([indexItem('1')]);
    });
    function docWithMultipleConstraints() {
        var docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2'];
        docs[0].resource.relations['liesWithin'] = ['3'];
        ci = new constraint_indexer_1.ConstraintIndexer({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        });
        ci.put(docs[0]);
        return docs;
    }
    it('works for multiple constrains', function () {
        docWithMultipleConstraints();
        expect(ci.get('liesWithin:contain', '3')).toEqual([indexItem('1')]);
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([indexItem('1')]);
    });
    it('index also works if doc does not have the field', function () {
        var docs = [
            doc('1')
        ];
        ci = new constraint_indexer_1.ConstraintIndexer({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' }
        }, false);
        ci.put(docs[0]);
        expect(ci.get('liesWithin:contain', '3')).toEqual([]);
    });
    it('work with non arrays', function () {
        ci = new constraint_indexer_1.ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, false);
        ci.put(doc('1'));
        expect(ci.get('identifier:match', 'identifier1')).toEqual([indexItem('1')]);
    });
    it('do not index if no identifier', function () {
        ci = new constraint_indexer_1.ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, false);
        var doc0 = doc('1');
        delete doc0.resource.identifier;
        ci.put(doc0);
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
    });
    it('do not index if no created and modified', function () {
        ci = new constraint_indexer_1.ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, false);
        var doc0 = doc('1');
        delete doc0.created;
        delete doc0.modified;
        ci.put(doc0);
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
    });
    it('clear index', function () {
        ci = new constraint_indexer_1.ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, false);
        ci.put(doc('1'));
        ci.clear();
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
    });
    it('ask for one existing index and one nonexisting index', function () {
        ci = new constraint_indexer_1.ConstraintIndexer({
            'identifier:contain': { path: 'resource.identifier', type: 'contain' }
        }, false);
        expect(ci.get('identifier:contain', 'identifier1')).toEqual([]);
    });
    it('remove doc', function () {
        var doc = docWithMultipleConstraints()[0];
        ci.remove(doc);
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([]);
        expect(ci.get('liesWithin:contain', '3')).toEqual([]);
    });
    it('remove where one doc was recorded in multiple docs for the same constraint', function () {
        var doc = docWithMultipleConstraintTargets()[0];
        ci.remove(doc);
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([]);
        expect(ci.get('isRecordedIn:contain', '3')).toEqual([]);
    });
    it('update docs where the relations change', function () {
        var doc = docWithMultipleConstraints()[0];
        doc.resource.relations['isRecordedIn'] = ['4'];
        doc.resource.relations['liesWithin'] = ['5'];
        doc.resource.identifier = 'identifier2';
        ci.put(doc);
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([]);
        expect(ci.get('liesWithin:contain', '3')).toEqual([]);
        expect(ci.get('identifier:match', 'identifier2'))
            .toEqual([indexItem('1', 'identifier2')]);
        expect(ci.get('isRecordedIn:contain', '4'))
            .toEqual([indexItem('1', 'identifier2')]);
        expect(ci.get('liesWithin:contain', '5'))
            .toEqual([indexItem('1', 'identifier2')]);
    });
    it('query for existing or not', function () {
        var docs = [
            doc('1'),
            doc('2')
        ];
        docs[0]['_conflicts'] = ['1-other'];
        ci = new constraint_indexer_1.ConstraintIndexer({
            'conflicts:exist': { path: '_conflicts', type: 'exist' }
        }, false);
        ci.put(docs[0]);
        ci.put(docs[1]);
        expect(ci.get('conflicts:exist', 'KNOWN')).toEqual([indexItem('1')]);
        expect(ci.get('conflicts:exist', 'UNKNOWN')).toEqual([indexItem('2')]);
    });
    it('throw error if type is unknown', function () {
        expect(function () {
            new constraint_indexer_1.ConstraintIndexer({ 'name': { path: 'testpath', type: 'unknown' } }, false);
        }).toThrow();
    });
    it('contain with an empty array', function () {
        var docs = [
            doc('1'),
            doc('2')
        ];
        docs[0].resource.relations['depicts'] = [];
        docs[1].resource.relations['depicts'] = ['1'];
        ci = new constraint_indexer_1.ConstraintIndexer({
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' }
        }, false);
        ci.put(docs[0]);
        ci.put(docs[1]);
        expect(ci.get('depicts:exist', 'KNOWN')).toEqual([indexItem('2')]);
        expect(ci.get('depicts:exist', 'UNKNOWN')).toEqual([indexItem('1')]);
    });
    it('use two indices of different types for one path', function () {
        var docs = [
            doc('1'),
            doc('2'),
            doc('3'),
            doc('4')
        ];
        docs[0].resource.relations['depicts'] = [];
        docs[1].resource.relations['depicts'] = [];
        docs[2].resource.relations['depicts'] = ['1'];
        docs[3].resource.relations['depicts'] = ['2'];
        ci = new constraint_indexer_1.ConstraintIndexer({
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' },
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' }
        }, false);
        ci.put(docs[0]);
        ci.put(docs[1]);
        ci.put(docs[2]);
        ci.put(docs[3]);
        expect(ci.get('depicts:exist', 'KNOWN')).toEqual([indexItem('3'), indexItem('4')]);
        expect(ci.get('depicts:exist', 'UNKNOWN')).toEqual([indexItem('1'), indexItem('2')]);
        expect(ci.get('depicts:contain', '1')).toEqual([indexItem('3')]);
        expect(ci.get('depicts:contain', '2')).toEqual([indexItem('4')]);
    });
    // TODO update docs where doc is new
    // TODO remove before update
    // TODO remove the target docs, for example delete the trench, then also the findings recorded in in are not to be found
});
//# sourceMappingURL=constraint-indexer.spec.js.map
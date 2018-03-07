"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var change_history_util_1 = require("../../../app/core/model/change-history-util");
/**
 * @author Thomas Kleinke
 */
describe('ChangeHistoryUtil', function () {
    var document1Revision1;
    var document1Revision2;
    var document1Revision3;
    var document2Revision1;
    var document2Revision2;
    beforeEach(function () {
        document1Revision1 = {
            resource: {
                id: 'id1',
                type: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }, {
                    user: 'user1',
                    date: new Date('2018-01-02T07:00:00.00Z')
                }, {
                    user: 'user1',
                    date: new Date('2018-01-02T14:00:00.00Z')
                }
            ]
        };
        document1Revision2 = {
            resource: {
                id: 'id1',
                type: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }, {
                    user: 'user1',
                    date: new Date('2018-01-02T07:00:00.00Z')
                }, {
                    user: 'user2',
                    date: new Date('2018-01-02T12:00:00.00Z')
                }, {
                    user: 'user2',
                    date: new Date('2018-01-02T15:00:00.00Z')
                }
            ]
        };
        document1Revision3 = {
            resource: {
                id: 'id1',
                type: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }, {
                    user: 'user3',
                    date: new Date('2018-01-02T09:00:00.00Z')
                }
            ]
        };
        document2Revision1 = {
            resource: {
                id: 'id2',
                type: 'Object',
                relations: {}
            },
            created: {
                user: 'user1',
                date: new Date('2018-01-01T02:00:00.00Z')
            },
            modified: [
                {
                    user: 'user1',
                    date: new Date('2018-01-01T02:00:00.00Z')
                }
            ]
        };
        document2Revision2 = {
            resource: {
                id: 'id2',
                type: 'Object',
                relations: {}
            },
            created: {
                user: 'user2',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'user2',
                    date: new Date('2018-01-01T01:00:00.00Z')
                }
            ]
        };
    });
    it('merges two change histories', function () {
        change_history_util_1.ChangeHistoryUtil.mergeChangeHistories(document1Revision1, document1Revision2);
        expect(document1Revision1.created.user).toEqual('user1');
        expect(document1Revision1.created.date).toEqual(new Date('2018-01-01T01:00:00.00Z'));
        expect(document1Revision1.modified.length).toBe(4);
        expect(document1Revision1.modified[0].user).toEqual('user1');
        expect(document1Revision1.modified[0].date).toEqual(new Date('2018-01-02T07:00:00.00Z'));
        expect(document1Revision1.modified[1].user).toEqual('user2');
        expect(document1Revision1.modified[1].date).toEqual(new Date('2018-01-02T12:00:00.00Z'));
        expect(document1Revision1.modified[2].user).toEqual('user1');
        expect(document1Revision1.modified[2].date).toEqual(new Date('2018-01-02T14:00:00.00Z'));
        expect(document1Revision1.modified[3].user).toEqual('user2');
        expect(document1Revision1.modified[3].date).toEqual(new Date('2018-01-02T15:00:00.00Z'));
    });
    it('merges two change histories of separately created documents', function () {
        change_history_util_1.ChangeHistoryUtil.mergeChangeHistories(document2Revision1, document2Revision2);
        expect(document2Revision1.created.user).toEqual('user2');
        expect(document2Revision1.created.date).toEqual(new Date('2018-01-01T01:00:00.00Z'));
        expect(document2Revision1.modified.length).toBe(1);
        expect(document2Revision1.modified[0].user).toEqual('user1');
        expect(document2Revision1.modified[0].date).toEqual(new Date('2018-01-01T02:00:00.00Z'));
    });
    it('detect remote change', function () {
        expect(change_history_util_1.ChangeHistoryUtil.isRemoteChange(document1Revision1, [], 'user1'))
            .toBe(false);
        expect(change_history_util_1.ChangeHistoryUtil.isRemoteChange(document1Revision1, [], 'user2'))
            .toBe(true);
    });
    it('detect remote change for conflicted document', function () {
        expect(change_history_util_1.ChangeHistoryUtil.isRemoteChange(document1Revision1, [document1Revision2, document1Revision3], 'user1')).toBe(true);
        expect(change_history_util_1.ChangeHistoryUtil.isRemoteChange(document1Revision1, [document1Revision2, document1Revision3], 'user2')).toBe(false);
        expect(change_history_util_1.ChangeHistoryUtil.isRemoteChange(document1Revision1, [document1Revision2, document1Revision3], 'user3')).toBe(true);
    });
});
//# sourceMappingURL=change-history-util.spec.js.map
import {NativeJsonlSerializer} from '../../../app/export/native-jsonl-serializer';
import {Document} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 */
export function main() {
    describe('NativeJsonlSerializer', () => {
        let mockPouchdbManager;
        let mockDB;
        let mockImageTypeUtility;
        let FileReader;

        beforeEach(() => {
            mockPouchdbManager = jasmine.createSpyObj('puchdbManager', ['getDb']);
            mockDB = jasmine.createSpyObj('db', ['get']);
            mockImageTypeUtility = jasmine.createSpyObj('imageTypeUtility', ['getProjectImageTypeNames']);

            mockPouchdbManager.getDb.and.callFake(function() { return mockDB });
            mockDB.get.and.callFake(
                function(a,b) { 
                    return Promise.resolve({
                        "resource": 
                            {"id":"id2","type":"Photo","identifier":"test2","shortDescription":"Test 2","relations":{}
                        },
                        "_attachments": { 
                            "thumb":  { 
                                "data": "R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
                                "content_type": "image/gif"
                            } 
                        } 
                    })
                }
            )
            mockImageTypeUtility.getProjectImageTypeNames.and.callFake(function() { return Promise.resolve(["Photo"]); });

        });

        const testDocuments: Array<Document> = [
            {
                'created': { 'user': 'testuser', 'date': new Date() },
                'modified': [ { 'user': 'testuser', 'date': new Date() } ],
                'resource': {
                    'id': 'id1',
                    'type': 'Find',
                    'identifier': 'test1',
                    'shortDescription': 'Test 1',
                    'relations': {}
                }
            },
            {
                'created': { 'user': 'testuser', 'date': new Date() },
                'modified': [ { 'user': 'testuser', 'date': new Date() } ],
                'resource': {
                    'id': 'id2',
                    'type': 'Photo',
                    'identifier': 'test2',
                    'shortDescription': 'Test 2',
                    'relations': {}
                }
            }
        ];

        it('should serialize resources to the native jsonl format', (done) => {
            const expectedResult = '{"resource":{"id":"id1","type":"Find","identifier":"test1","shortDescription":"Test 1",' +
                '"relations":{}}}\n{"resource":{"id":"id2","type":"Photo","identifier":"test2","shortDescription":"Test 2",' +
                '"relations":{}},"_attachments":{"thumb":{"data":"R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=","content_type":"image/gif"}}}\n';

            const serializer: NativeJsonlSerializer = new NativeJsonlSerializer(mockPouchdbManager, mockImageTypeUtility);
            serializer.serialize(testDocuments).then( serializer_result => {
                expect(serializer_result).toEqual(expectedResult);
                done();
            });
        });
    });
}
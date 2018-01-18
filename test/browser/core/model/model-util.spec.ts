import {Document} from 'idai-components-2/core';
import {Static} from '../../helper/static';
import {ModelUtil} from '../../../../app/core/model/model-util';


/**
 * @author Thomas Kleinke
 */
export function main() {

    let document1: Document;
    let document2: Document;


    describe('ModelUtil', () => {

        beforeEach(() => {

            document1 = Static.doc('Document 1', 'doc1', 'Feature', 'd1');
            document2 = Static.doc('Document 2', 'doc2', 'Feature', 'd2');
        });


        it('Confirm that document is in list', () => {

            expect(ModelUtil.isInList(document1, [document1, document2])).toBe(true);
        });


        it('Confirm that document is not in list', () => {

            expect(ModelUtil.isInList(document1, [document2])).toBe(false);
        });
    });
}
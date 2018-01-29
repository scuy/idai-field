import {ResourcesState} from '../../../../../app/components/resources/state/resources-state';
import {OperationViews} from '../../../../../app/components/resources/state/operation-views';
import {Static} from '../../../helper/static';
import {NavigationPathManager} from '../../../../../app/components/resources/state/navigation-path-manager';


/**
 * @author Daniel de Oliveira
 */

export function main() {

    describe('ResourcesStateAndNavigationPathManager', () => {

        const viewsList = [
            {
                'mainTypeLabel': 'Schnitt',
                'label': 'Ausgrabung',
                'operationSubtype': 'Trench',
                'name': 'excavation'
            }
        ];


        let resourcesState: ResourcesState;
        let navigationPathManager: NavigationPathManager;


        beforeEach(() => {

            const mockSerializer = jasmine.createSpyObj('serializer', ['store']);
            resourcesState = new ResourcesState(
                mockSerializer,
                new OperationViews(viewsList),
                undefined,
                undefined
            );

            const mockDatastore = jasmine.createSpyObj('datastore', ['get']);

            navigationPathManager = new NavigationPathManager(resourcesState, mockDatastore);

            resourcesState.loaded = true;
        });


        it('step into', () => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            navigationPathManager.moveInto(featureDocument1);

            expect(resourcesState.getNavigationPath().rootDocument).toEqual(featureDocument1);
            expect(resourcesState.getNavigationPath().elements.length).toEqual(1);
            expect(resourcesState.getNavigationPath().elements[0]).toEqual(featureDocument1);
        });


        it('step out', () => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            navigationPathManager.moveInto(featureDocument1);
            navigationPathManager.moveInto(undefined);

            expect(resourcesState.getNavigationPath().rootDocument).toEqual(undefined);
            expect(resourcesState.getNavigationPath().elements.length).toEqual(1);
            expect(resourcesState.getNavigationPath().elements[0]).toEqual(featureDocument1);
        });


        it('set type filters and q', () => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            navigationPathManager.moveInto(featureDocument1);
            resourcesState.setTypeFilters(['Find']);
            resourcesState.setQueryString('abc');
            navigationPathManager.moveInto(undefined);
            expect(resourcesState.getTypeFilters()).toEqual(undefined);
            expect(resourcesState.getQueryString()).toEqual('');
            resourcesState.initialize('survey');
            expect(resourcesState.getTypeFilters()).toEqual(undefined);
            expect(resourcesState.getQueryString()).toEqual('');
            resourcesState.initialize('excavation');
            navigationPathManager.moveInto(featureDocument1);
            expect(resourcesState.getTypeFilters()).toEqual(['Find']);
            expect(resourcesState.getQueryString()).toEqual('abc');
        });


        it('delete type filter and q of segment', () => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');

            resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            navigationPathManager.moveInto(featureDocument1);
            resourcesState.setTypeFilters(['Find']);
            resourcesState.setQueryString('abc');
            resourcesState.setTypeFilters(undefined);
            resourcesState.setQueryString(undefined);
            expect(resourcesState.getTypeFilters()).toEqual(undefined);
            expect(resourcesState.getQueryString()).toEqual('');
        });


        it('delete type filter and q of non segment', () => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');

            resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            navigationPathManager.moveInto(featureDocument1);
            resourcesState.setTypeFilters(['Find']);
            resourcesState.setQueryString('abc');
            resourcesState.setTypeFilters(undefined);
            resourcesState.setQueryString(undefined);
            expect(resourcesState.getTypeFilters()).toEqual(undefined);
        });
    });
}
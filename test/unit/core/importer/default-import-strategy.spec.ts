import {DefaultImportStrategy} from '../../../../app/core/importer/default-import-strategy';
import {ImportStrategy} from '../../../../app/core/importer/import-strategy';

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportStrategy', () => {

    let mockDatastore;
    let mockValidator;
    let mockSettingsService;
    let mockConfigLoader;
    let importStrategy: ImportStrategy;

    beforeEach(() => {
        mockDatastore = jasmine.createSpyObj('datastore', ['create']);
        mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockSettingsService = jasmine.createSpyObj('settingsService', ['getUsername']);
        mockConfigLoader = jasmine.createSpyObj('configLoader', ['getProjectConfiguration']);

        mockValidator.validate.and.callFake(function() { return Promise.resolve(); });
        mockDatastore.create.and.callFake(function(a) { return Promise.resolve(a); });
        mockSettingsService.getUsername.and.callFake(function() { return 'testuser'; });
        mockConfigLoader.getProjectConfiguration.and.callFake(function() { return null; });

        importStrategy = new DefaultImportStrategy(mockValidator, mockDatastore, mockSettingsService,
            mockConfigLoader);
    });

    it('should resolve on success', (done) => {

        importStrategy.importDoc({ resource: {type: undefined, id: undefined, relations: undefined } })
            .then(
                () => done(),
                () => { fail(); done() }
            )
    });

    it('should reject on err in validator', (done) => {

        mockValidator.validate.and.callFake(function() { return Promise.reject(['abc']); });
        importStrategy.importDoc({resource: {type: undefined, id: undefined, relations: undefined } })
            .then(
                () => { fail(); done() },
                err => {
                    expect(err[0]).toBe('abc');
                    done();
                }
            )
    });

    it('should reject on err in datastore', (done) => {

        mockDatastore.create.and.callFake(function() { return Promise.reject(['abc']); });
        importStrategy.importDoc({ resource: { type: undefined, id: undefined, relations: undefined } })
            .then(
                () => done(),
                err => {
                    expect(err[0]).toBe('abc');
                    done();
                }
            )
    });
});
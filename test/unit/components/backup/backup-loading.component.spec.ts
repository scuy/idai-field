import {BackupLoadingComponent} from '../../../../app/components/backup/backup-loading.component';
import {M} from '../../../../app/m';
import PouchDB = require('pouchdb');
import {Backup} from '../../../../app/components/backup/backup';

/**
 * @author Daniel de Oliviera
 */
describe('BackupLoadingComponent', () => {

    const backupFilePath = 'store/backup_test_file.txt';
    const unittestdb = 'unittestdb';

    let c: BackupLoadingComponent;
    let messages: any;
    let settingsService: any;
    let backupProvider: any;


    afterEach(done => new PouchDB(unittestdb).destroy().then(done));


    beforeEach(() => {

        spyOn(console, 'warn');

        const dialogProvider = jasmine.createSpyObj('dialogProvider', ['chooseFilepath']);
        const modalService = jasmine.createSpyObj('modalService', ['open']);
        messages = jasmine.createSpyObj('messages', ['add']);
        settingsService = jasmine.createSpyObj('settingsService', ['getSelectedProject', 'addProject']);
        backupProvider = jasmine.createSpyObj('backupProvider', ['dump', 'readDump']);

        c = new BackupLoadingComponent(
            modalService,
            messages,
            settingsService,
            backupProvider
        );

        settingsService.getSelectedProject.and.returnValue('selectedproject');
        dialogProvider.chooseFilepath.and.returnValue(Promise.resolve(backupFilePath));
    });


    it('load backup: project not specified', async done => {

        c.projectName = '';
        c.path = './store/backup_test_file.txt';
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR_NO_PROJECT_NAME]);
        done();
    });


    it('load backup: filenotexists', async done => {

        c.projectName = unittestdb;
        c.path = './store/backup_test_file.txt';

        backupProvider.readDump.and.returnValue(Promise.reject(Backup.FILE_NOT_EXIST));
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]);
        done();
    });


    it('load backup: cannotreaddb', async done => {

        spyOn(console, 'error');

        c.projectName = unittestdb;
        c.path = './package.json';

        backupProvider.readDump.and.returnValue(Promise.reject('reason'));
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR]);
        done();
    });


    it('readDump: show success message', async done => {

        c.projectName = unittestdb;
        c.path = './package.json';
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_SUCCESS]);
        done();
    });


    it('readDump: create new project via settings', async done => {

        c.projectName = unittestdb;
        c.path = './package.json';
        await c.loadBackup();

        expect(settingsService.addProject).toHaveBeenCalledWith(unittestdb);
        done();
    });
});
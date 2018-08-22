import {Component} from '@angular/core';
import {Event, NavigationStart, Router} from '@angular/router';
import {Messages} from 'idai-components-2';
import {AppController} from './app-controller';
import {ReadImagestore} from './core/imagestore/read-imagestore';

const remote = require('electron').remote;

@Component({
    moduleId: module.id,
    selector: 'idai-field-app',
    templateUrl: './app.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppComponent {

    public alwaysShowClose = remote.getGlobal('switches').messages_timeout == undefined;

    constructor(private router: Router,
                private messages: Messages,
                appController: AppController,
                imagestore: ReadImagestore) {

        // To get rid of stale messages when changing routes.
        // Note that if you want show a message to the user
        // on changing route, you have to write something
        // like
        // { router.navigate(['target']); messages.add(['some']); }
        //
        router.events.subscribe((event: Event) => {
            if (event instanceof NavigationStart) {
                imagestore.revokeAll();
                this.messages.removeAllMessages();
            }
        });

        appController.setupServer();

        AppComponent.preventDefaultDragAndDropBehavior();
    }


    private static preventDefaultDragAndDropBehavior() {

        document.addEventListener('dragover', event => event.preventDefault());
        document.addEventListener('drop', event => event.preventDefault());
    }
}

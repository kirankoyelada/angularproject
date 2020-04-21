import {HostListener} from "@angular/core";
import { Constants } from '../constants/constants';
import { BaseComponent } from '../base.component';

export abstract class ComponentCanDeactivate extends BaseComponent {

  abstract  canDeactivate(): boolean;

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any) {
       //ISSUE-2084 fix
        localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
        localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
        localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
        // end issue-2084
        if (!this.canDeactivate()) {
            $event.returnValue = true;
        }
    }
}

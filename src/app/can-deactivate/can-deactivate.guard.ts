import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, RoutesRecognized, NavigationStart, NavigationCancel, NavigationEnd } from '@angular/router';
import { ComponentCanDeactivate } from './component-can-deactivate';
import { MarcEditComponent } from '../marc/marc-edit/marc-edit.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Observer, Observable } from 'rxjs';
import { ConfirmationDialogComponent } from '../components/shared/confirmation-dialog/confirmation-dialog.component';
import { Constants } from '../constants/constants';
import { filter, pairwise } from 'rxjs/operators';
import { PreviousRouteService } from '../services/previousRouteService';

@Injectable()
export class CanDeactivateGuard implements CanDeactivate<ComponentCanDeactivate> {

  constructor(private dialog: MatDialog, private location: Location, private router: Router,
    private previousRouteService: PreviousRouteService) {}
  canDeactivate(component: ComponentCanDeactivate, currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot) {
    // Allow navigation if the component says that it is OK or it doesn't have a canDeactivate function
    if (!component.canDeactivate || component.canDeactivate()) {
      return true;
    }

    //4692 fix
    if(!localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS)) {
      return true;
    }

    return Observable.create((observer: Observer<boolean>) => {
      // UnsavedChangesDialog defined somewhere else and imported above
      if (this.router.getCurrentNavigation().finalUrl.toString() === '/sessionTimeOut' ) {
        // if sessionTimeout then skip guard
        observer.next(true);
        observer.complete();
      }
      else {
        setTimeout(() => {
          if (!component.canDeactivate && this.router.getCurrentNavigation().trigger === 'popstate') {
            // change the route on click of back button
            this.location.go(currentState.url);
          }
          const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            height: 'auto',
            disableClose: true,
            data: {
              isCancelConfirm: true,
              isCopyErrorMsg: false,
              message: 'There are unsaved changes. Are you sure you want to leave this page? '
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result === '') {
              //console.log(this.previousRouteService.getPreviousUrl()+" "+this.router.url);
              if (!window.location.pathname && window.location.pathname !== '/') {
                history.replaceState(null, null, location.origin);
                history.pushState(null, null, this.previousRouteService.getPreviousUrl());
              }

              if (localStorage.getItem(Constants.LocalStorage.TEMPACTOR)) {
                localStorage.setItem(Constants.LocalStorage.ACTOR, localStorage.getItem(Constants.LocalStorage.TEMPACTOR));
                localStorage.removeItem(Constants.LocalStorage.TEMPACTOR);
              }
              if (localStorage.getItem(Constants.LocalStorage.TEMPSEARCHZ3950REQUEST)) {
                // tslint:disable-next-line: max-line-length
                localStorage.setItem(Constants.LocalStorage.SEARCHZ3950REQUEST, localStorage.getItem(Constants.LocalStorage.TEMPSEARCHZ3950REQUEST));
                localStorage.removeItem(Constants.LocalStorage.TEMPSEARCHZ3950REQUEST);
              }
              if (localStorage.getItem(Constants.LocalStorage.TEMPSEARCHREQUEST)) {
                localStorage.setItem(Constants.LocalStorage.BIBSEARCHREQUEST,
                    localStorage.getItem(Constants.LocalStorage.TEMPSEARCHREQUEST));
                localStorage.removeItem(Constants.LocalStorage.TEMPSEARCHREQUEST);
              }
              observer.next(false);
            }
            else {
              observer.next(result);
            }
            observer.complete();
          }
            , (_error) => {
              observer.next(false);
              observer.complete();
            });
        }, 0);
      }
    });
  }
}



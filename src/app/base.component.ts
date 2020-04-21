import { Component, Injectable } from '@angular/core';
import { User } from './security/user';
import { Permissions } from './security/permissions';
import { AuthenticationService } from './security/authentication.service';
import { Router } from '@angular/router';
import { Constants } from './constants/constants';

@Injectable()
export class BaseComponent {
    currentUser: User;
    defaultCatalogIds = ["1","2","3","4","5","6","7","8","9","10","11"];
    constructor(
        private baseRouter: Router,
        private baseAuthenticationService: AuthenticationService
    ) {
        this.baseAuthenticationService.currentUser.subscribe(x => this.currentUser = x);
        // Load permission on load page 
        // TO-DO to change approach how to load permission on each load.
        this.baseAuthenticationService.updateUserwithLatestPermissions();
    }

    hasAccess(permission: Permissions):boolean{
        return this.baseAuthenticationService.hasAccess(permission);
    }

    hasAccessAny(permissions: Permissions[]):boolean{
        return this.baseAuthenticationService.hasAccessAny(permissions);
    }

    logout() {
        this.baseAuthenticationService.logout();
        this.baseRouter.navigate(['/login']);
    }

    get displayName(){
        if(this.currentUser){
            return this.currentUser.FirstName + " " + this.currentUser.LastName;
        }
        return '';
    }

    get currentCustomerId(){
        return localStorage.getItem(Constants.LocalStorage.CUSTOMERID);
    }

    get barcodeSubField() {
        return localStorage.getItem(Constants.LocalStorage.BARCODESUBFIELDIN949);
    }

    get isInternalUser() {
        return this.hasAccess(Permissions.SET_INT_USR);
    }

    get isExternalUser() {
        //return this.hasAccess(Permissions.SRCH_CUST_WSPACE) || this.hasAccess(Permissions.SRCH_CUST_WSPACE_DEL_RECS) || this.hasAccess(Permissions.SRCh_ALL_CLS_Cust_WSPACE);
        return this.hasAccess(Permissions.SRCH_CUST_WSPACE) || this.hasAccess(Permissions.SRCH_CUST_WSPACE_DEL_RECS) || (this.currentCustomerId && this.isAllCustomerEnable);
    }

    get isAllCustomerEnable(){
        return this.hasAccess(Permissions.SRCH_ALL_CUST);
    }

    get isExternalPermission(){
       return this.hasAccess(Permissions.SRCH_CUST_WSPACE) || this.hasAccess(Permissions.SRCH_CUST_WSPACE_DEL_RECS);
    }
    
    public Permissions = Permissions;
}
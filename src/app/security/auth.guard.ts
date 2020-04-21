import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const currentUser = this.authenticationService.currentUserValue;
        if (currentUser) {
            // check if route is restricted by role
            if (route.data.permissions) {
                var hasAccess:Boolean = false;
                if(route.data.permissions instanceof Array){
                    hasAccess = this.authenticationService.hasAccessAny(route.data.permissions);
                }
                else{
                    hasAccess = this.authenticationService.hasAccess(route.data.permissions);
                }
                if(!hasAccess){
                    // role not authorised so redirect to home page
                    this.router.navigate(['/unauthorized']);
                    return false;
                }
            }

            // authorised so return true
            return true;
        }

        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
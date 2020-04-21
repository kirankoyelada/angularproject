import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from './user';
import { Permissions } from './permissions';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ConfigurationService } from '../services/configuration.service';
import { Constants } from '../constants/constants';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  private updatePermissionTriggered = false;
  _baseURL: string;
  _refreshServiceDelay: number;

  constructor(private http: HttpClient, private appInsights: ApplicationInsights, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
    this._refreshServiceDelay = configurationService.currentConfiguration().refreshServiceDelay;
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string) {
    const credentials = {
      username,
      password
    };


    const url = this._baseURL + '/api/login/login';

    return this.http.post<any>(url, credentials)
      .pipe(map(user => {
        // login successful if there's a jwt token in the response
        if (user && user.token) {
          // store user details and jwt token in local storage to keep user logged in between page refreshes
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.appInsights.setAuthenticatedUserContext(username, null, true);
          this.currentUserSubject.next(user);
        }

        return user;
      }));
  }

  refreshToken(): Observable<User> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const token = currentUser.token;
    const refreshToken = currentUser.refreshToken;
    const refreshRequest = { token, refreshToken };
    const url = this._baseURL + '/api/login/refreshtoken';

    return this.http.post<any>(url , refreshRequest).pipe(
        map(user => {
          if (user && user.token) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
          return user;
        }));
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    this.appInsights.clearAuthenticatedUserContext();
    this.currentUserSubject.next(null);
  }

  hasAccess(permission: Permissions): boolean {
    return this.currentUserValue.Permissions.includes(permission.toString());
  }

  hasAccessAny(permissions: Permissions[]): boolean {
    let hasAccess = false;
    for (let i = 0; i < permissions.length; i++) {
      hasAccess = this.hasAccess(permissions[i]);
      if (hasAccess) {
        break;
      }
    }
    return hasAccess;
  }

  public IsRefreshRequired(): boolean {
    let callservice = true;
    let lastRefreshTime: string = localStorage.getItem(Constants.LocalStorage.USERDATAREFRESH);
    if (lastRefreshTime != undefined) {
      let currentTime: number = Date.now();
      let currentRefreshDelaySecs: number = (currentTime - Number.parseInt(lastRefreshTime)) / 1000;
      if (currentRefreshDelaySecs < this._refreshServiceDelay) {
        callservice = false;
      }
    }
    return callservice;
  }

  public updateUserwithLatestPermissions() {
    if (this.currentUserValue.UserName && !this.updatePermissionTriggered) {
      this.updatePermissionTriggered = true;
      if (this.IsRefreshRequired()) {
        const url = this._baseURL + '/api/UserConfiguration/GetUserPermissionsByName?userName=' + this.currentUserValue.UserName;
        this.http.get<string[]>(url).subscribe(result => {
          this.currentUserValue.Permissions = result;
          localStorage.setItem('currentUser', JSON.stringify(this.currentUserValue));
          localStorage.setItem(Constants.LocalStorage.USERDATAREFRESH, Date.now().toString()); // Add current Refresh time
          this.currentUserSubject.next(this.currentUserValue);
          this.updatePermissionTriggered = false;
        }, (error) => {
          this.updatePermissionTriggered = false;
        });
      } else {
        this.updatePermissionTriggered = false;
      }
    }
  }

  public updateCurrentUserPermissions(permissions: string[]) {
    this.currentUserValue.Permissions = permissions;
    localStorage.setItem('currentUser', JSON.stringify(this.currentUserValue));
    this.currentUserSubject.next(this.currentUserValue);
  }
}

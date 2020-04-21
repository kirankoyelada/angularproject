import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user';
import { Role, Permission } from 'src/app/shared/role';
import { Constants } from '../constants/constants';
import { ConfigurationService } from '../services/configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};
@Injectable({
  providedIn: 'root'
})
export class UserConfigurationService {

  public revealSpaces$: EventEmitter<boolean> = new EventEmitter();
  _baseURL: string;

  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  getUsers(): Observable<User[]> {
    const url = this._baseURL + '/api/UserConfiguration/GetAllUsers';
    return this.http.get<User[]>(url);
  }

  getRoles(): Observable<Role[]> {
    const url = this._baseURL + '/api/SystemSettings/GetRoles';
    return this.http.get<Role[]>(url);
  }

  getPermissions(): Observable<Permission[]> {
    const url = this._baseURL + '/api/SystemSettings/GetPermissions';
    return this.http.get<Permission[]>(url);
  }

  saveUser(user: User): Observable<string> {
    const url = this._baseURL + '/api/UserConfiguration/SaveUser';
    const userData = JSON.stringify(user);
    return this.http.post<string>(url, userData, httpOptions);
  }

  saveLastUserLoginTime(actor: string): Observable<string> {
    const url = this._baseURL + '/api/UserConfiguration/saveLastUsedDateTime';
    const userData = JSON.stringify(actor);
    return this.http.post<string>(url, userData, httpOptions);
  }

  saveUserPrefernces(user: User): Observable<any> {
    const url = this._baseURL + '/api/UserConfiguration/SaveUserPrefernces';
    const userData = JSON.stringify(user);
    this.revealSpaces$.emit(( user.revealSpaces != null ? user.revealSpaces : false));
    return this.http.post<any>(url, userData, httpOptions);
  }

  getRevealSpaces(): boolean {
    const user = localStorage.getItem(Constants.LocalStorage.USER);
    const userObj = JSON.parse(user);
    return ((userObj.revealSpaces != null) ? userObj.revealSpaces : false);
  }

  ToggleRevealSpaces(): boolean {
    // Updates the LocalStorage
    const revealspaces = localStorage.getItem('RevealSpaces');
    let reveal = false;
    if (revealspaces === undefined || revealspaces == null) {
      reveal  = false;
    } else {
      reveal =  ( revealspaces === '1' ) ? true : false;
    }

    reveal = !reveal ;
    localStorage.setItem('RevealSpaces', (reveal ? '1' : '0'));
    this.revealSpaces$.emit(reveal);
    return reveal;
  }

  EmitRevealSpace() {
    const revealspaces = localStorage.getItem('RevealSpaces');
    let reveal = false;
    if (revealspaces === undefined || revealspaces == null) {
      reveal  = false;
    } else {
      reveal =  ( revealspaces === '1' ) ? true : false;
    }
    reveal = (reveal) ? reveal : this.getRevealSpaces();
    if ( reveal ) {
      this.revealSpaces$.emit(reveal);
    }
  }

  ResetRevealSpaces() {
    localStorage.removeItem('RevealSpaces');
  }

  getUserByName(userName: string): Observable<User> {
    const url = this._baseURL + '/api/UserConfiguration/GetUserByName?userName=' + userName;
    return this.http.get<User>(url);
  }
}

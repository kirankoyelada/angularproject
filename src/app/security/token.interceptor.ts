import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpSentEvent, HttpHeaderResponse, HttpProgressEvent, HttpResponse, HttpUserEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { AuthenticationService } from './authentication.service';
import { catchError, switchMap, finalize, filter, take } from 'rxjs/operators';
import { User } from './user';
import { from, throwError } from 'rxjs';
import { UserIdleSettingsService } from '../shared/sessionSettings/userIdleSettings.service';
import { Constants } from '../constants/constants';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService, private userIdleSettingsService:UserIdleSettingsService) { }

  isRefreshingToken = false;  
  tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  intercept(request: HttpRequest<any>, next: HttpHandler):
   Observable<HttpSentEvent | HttpHeaderResponse | HttpProgressEvent | HttpResponse<any> | HttpUserEvent<any> | any> {
    this.userIdleSettingsService.ResetTimer();
    if (request.url.includes('/refreshtoken')) {
        return next.handle(request);
    }
    const currentUser = JSON.parse(localStorage.getItem(Constants.LocalStorage.CURRENTUSER));
    const isLoggedIn = currentUser && currentUser.token;
    if (isLoggedIn) {
          var expiry = new Date( (new Date(  currentUser.expires)).getTime() - (300 * 1000));
          var currentTime = new Date();
          if ( currentTime > expiry) {
            console.log("Refreshing as Token Expiring next 5 mins" + request.url);
            return <any>this.HandleWithRefreshToken(request, next);
          }
          request = this.addTokenToRequest(request, currentUser.token);
      }

    return next.handle(request).pipe(
        catchError(err => {
          if (request.url.includes('/login')) {
            return throwError(err);
          }
          if (request.url.includes('/refreshtoken')) {
            return <any> this.logout();
          }
          if (err instanceof HttpErrorResponse) {
            switch ((err as HttpErrorResponse).status) {
              case 401:
                return this.HandleWithRefreshToken(request, next) as any;
              case 400:
                console.log('400 error in token interceptor for ' + request.url);
                return throwError(err); // this.authenticationService.logout() as any;
            }
            return throwError(err);
          } else {
            return throwError(err);
          }
        })
      );
  }

  private  HandleWithRefreshToken(request: HttpRequest<any>, next: HttpHandler) {

    if (!this.isRefreshingToken) {
      this.isRefreshingToken = true;

      // Reset here so that the following requests wait until the token
      // comes back from the refreshToken call.
      this.tokenSubject.next(null);
      return  this.authenticationService.refreshToken().pipe(
          switchMap((user: any) => {
            if (user) {
              this.tokenSubject.next(user.token);
              localStorage.setItem('currentUser', JSON.stringify(user));
              return next.handle(this.addTokenToRequest(request, user.token));
            }
            return <any>this.logout();
          }),
        catchError(err => {
          console.log(err);
            return <any>this.logout();
          }),
          finalize(() => {
            this.isRefreshingToken = false;
          })
        );
    } else {
      return this.tokenSubject
        .pipe(filter(token => token != null),
          take(1),
          switchMap(token => {            
            return next.handle(this.addTokenToRequest(request, token));
          }));
    }
  }

  private logout() {
    console.log('logout iniated from token interceptor');
    this.authenticationService.logout();
    location.reload(true);
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {    
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}

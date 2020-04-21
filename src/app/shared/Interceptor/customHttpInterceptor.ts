import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpResponse,
  HttpRequest,
  HttpHandler,
  HttpSentEvent,
  HttpHeaderResponse,
  HttpProgressEvent,
  HttpUserEvent
} from "@angular/common/http";
import { HttpEvent } from "@angular/common/http";
import { tap } from "rxjs/operators";
import { SpinnerService } from "./spinner.service";
import { Constants } from "src/app/constants/constants";
//declare let ga: Function;
declare let gtag: Function;
@Injectable()
export class CustomHttpInterceptor implements HttpInterceptor {
  constructor(private spinnerService: SpinnerService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpSentEvent | HttpHeaderResponse | HttpProgressEvent | HttpResponse<any> | HttpUserEvent<any>> {
    // Only turn off caching for API calls to the server.
    let nextReq = null;
    if (req.url.indexOf('/api/') >= 0) {
      nextReq = req.clone({
        headers: req.headers.set('Cache-Control', 'no-cache')
          .set('Pragma', 'no-cache')
          .set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT')
          .set('If-Modified-Since', '0')
      });
    } else {
      nextReq = req;
    }
    return next.handle(nextReq).pipe(
      tap(
        (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            //Google analytics event tracking for entire application level
            var i = 0;
            var pathName = "";
            for (i = 3; i < req.url.split("/").length; i++) {
              if (req.url.split("/").length - 1 === i) {
                pathName += "/" + req.url.split("/")[i].split("?")[0];
              } else pathName += "/" + req.url.split("/")[i];
            }
            this.eventEmitter(req.method, pathName, req.body);
          }
        },
        error => { }
      )
    );
  }
  public eventEmitter(
    eventCategory: string,
    eventAction: string,
    eventLabel: string = null,
    eventValue: number = null
  ) {
    gtag('event', eventAction, {
      'event_category': eventCategory,
      'event_label': eventLabel,
      'value': eventValue
    });
  }
}

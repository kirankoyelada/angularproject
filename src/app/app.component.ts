import { Component, EventEmitter } from '@angular/core';
import { Constants } from '../app/constants/constants';
import { HttpRequest, HttpHandler, HttpEvent, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpinnerService } from './shared/interceptor/spinner.service';
import { MAT_AUTOCOMPLETE_SCROLL_STRATEGY } from '@angular/material';
import { CloseScrollStrategy, Overlay } from '@angular/cdk/overlay';
import { Router, NavigationEnd } from '@angular/router';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
// declare gtag as a function to set and sent the events
declare let gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
      useFactory: scrollFactory,
      deps: [Overlay]
    }
  ]
})
export class AppComponent {
  title = 'BTCATWebApp';
  showSpinner: boolean;
  constructor(private spinnerService: SpinnerService,
              private appInsights: ApplicationInsights,
              private router: Router) {
       // Using Rx's built in `distinctUntilChanged ` feature to handle url change c/o @dloomb's answer
        this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {

          gtag('config', window['GoogleKey']);
          gtag('event', 'timing_complete', {
             'name' : 'load',
             'value' : 3549,
             'event_category' : 'JS Dependencies'
           });
          gtag('page', event.urlAfterRedirects);

          appInsights.trackPageView({ uri: event.urlAfterRedirects});
        }
      });
     }

  get loadingDefault(): boolean {
    return (this.spinnerService._loadingDefault);
  }

  get loading(): boolean {
    return (this.spinnerService._loading);
  }

  ngOnInit() {
    this.appInsights.loadAppInsights();

    // Clearing the search local storage on page load
    if (window.location.hash == "#/login" || (window.history && window.history.length <= 2)) {
      localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
      localStorage.removeItem(Constants.LocalStorage.ADDMORESETTINGS);
      localStorage.removeItem(Constants.LocalStorage.EXPANDSEARCH);
      localStorage.removeItem(Constants.LocalStorage.ADDMORECOLUMNS);
      localStorage.removeItem(Constants.LocalStorage.SAVECATALOGITEMS);
      localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
      localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);      
      localStorage.removeItem(Constants.LocalStorage.ROLEBASEDMACROS);   
      localStorage.removeItem(Constants.LocalStorage.DELETEDDBCHECKED);    
      localStorage.removeItem(Constants.LocalStorage.MARCSETTINGS);
    
    }

    // Clearing the facet selected value which was stored in session storage while refreshing the application
    //sessionStorage.clear();
  }
}

export function scrollFactory(overlay: Overlay): () => CloseScrollStrategy {
  return () => overlay.scrollStrategies.close();
}

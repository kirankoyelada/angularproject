import { Injectable } from '@angular/core';
import { FacetsResults } from 'src/app/services/search';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Constants } from 'src/app/constants/constants';
import { HttpClient } from '@angular/common/http';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private actorName: string;
  private defaultCatalogIds = ["1","2","3","4","5","6","7","8","9","10","11"];
  selectedFacetValues = [];
  z3950MarcItem: any;
  cmnServFacetResponse: FacetsResults;
  IsSearchExpand = false;
  _baseURL: string;

  constructor(private http: HttpClient, configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  private messageSource = new BehaviorSubject('false');
  currentMessage = this.messageSource.asObservable();

  private searchFieldsChanged = new BehaviorSubject(false);
  searchFieldsChanged$ = this.searchFieldsChanged.asObservable();

  changeMessage(message: string) {
    this.messageSource.next(message);
  }

  onSearchFieldsChanged(isMoreItemsAdded: boolean) {
    this.searchFieldsChanged.next(isMoreItemsAdded);
  }

  setZ3950MarcItem(value: any) {
    sessionStorage.setItem('z3950MarcItem', JSON.stringify(value));
  }

  getRecordSource(): string {
    return sessionStorage.getItem('marcRecordSource');
  }

  setRecordSource(source: string) {
    sessionStorage.setItem('marcRecordSource', source);
  }

  get actor(): string {
    return this.actorName;
  }
  set actor(value: string) {
    this.actorName = value;
  }

  getSelectedFacetValues() {
    if (this.selectedFacetValues.length <= 0) {
      const values = JSON.parse(localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST));
      if ( values && values.SearchRequest && values.SearchRequest[0].facetValue) {
        this.selectedFacetValues = values.SearchRequest[0].facetValue;
      }
    }
    return this.selectedFacetValues;
  }

  setSelectedFacetValues(value: string, facetType: string) {
    this.selectedFacetValues.push( { FacetValue: value, FacetType: facetType});
  }

  getUserPermissions(): Observable<string[]> {
    const userName = localStorage.getItem(Constants.LocalStorage.USERNAME);
    if (userName) {
      const url = this._baseURL + '/api/UserConfiguration/GetUserPermissionsByName?userName=' + userName;
      return this.http.get<string[]>(url);
    } else {
      return of([]);
    }
  }

  isMarc21ValidationsEnable() {
    return localStorage.getItem(Constants.LocalStorage.ISMARC21VALIDATIONS);
  }

  isZ3950ProfileSearch(): boolean {
    // const z3950SearchRequest: boolean = JSON.parse(localStorage.getItem(Constants.LocalStorage.SEARCHZ3950REQUEST));
    // return z3950SearchRequest;
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );

    if (items != null && items.length > 0) {
      var filterItems = items.filter(
        x =>
          x.isActive &&
          this.defaultCatalogIds.indexOf(x.id) === -1
      );
      if (filterItems.length === 0) {
        return false;
      } else {
        return true;
      }
    }
    else {
      return false;
    }
  }

  getActiveInstitutions(): Observable<any[]> {
    const url = this._baseURL  + '/api/Institution/getActiveInstitutions';
    return this.http.get<any[]>(url);
  }

  rTrim(str) {
    if (str) {
      return str.replace(/\s+$/, '');
    }
  }

  lTrim(str) {
    if (str && str !== '') {
      return str.replace(/^\s+/, '');
    }
  }

}

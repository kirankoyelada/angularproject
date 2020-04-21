import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerAccount, Customers, CustomerMasterAccount, CustomerModel, SearchCustomerAccount } from '../customer';
import { map } from 'rxjs/operators';
import { Constants } from 'src/app/constants/constants';
import { ConfigurationService } from 'src/app/services/configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  _baseURL: string;
  _refreshServiceDelay: number;
  AllCustomers: Customers[] = [];

  constructor(private http: HttpClient, private configurationService:ConfigurationService) {
    this._baseURL = this.configurationService.currentConfiguration().apiURL;
    this._refreshServiceDelay = this.configurationService.currentConfiguration().refreshServiceDelay;
  }

  searchCustomers(searchTerm: string): Observable<CustomerAccount[]> {
    const url = this._baseURL + '/api/Customer/SearchCustomers?searchTerm=' + searchTerm;
    return this.http.get<CustomerAccount[]>(url);
  }

  getAllCustomers(): Observable<CustomerAccount[]> {
    const url = this._baseURL + '/api/Customer/GetAllCustomerDetails';
    return this.http.get<CustomerAccount[]>(url);
  }

  updateCustomerName(selectedCustomer:CustomerAccount):Observable<string>{
    const url = this._baseURL + '/api/Customer/UpdateCustomerName';
    const customerData = JSON.stringify(selectedCustomer);
    return this.http.post<string>(url, customerData, httpOptions);
  }

  getCustomerAccounts(searchValue:string, searchBy:string, institutionId: string): Observable<CustomerMasterAccount[]> {
    const url = this._baseURL + '/api/Customer/GetCustomerAccounts?searchValue='+ searchValue +'&searchBy=' + searchBy +'&institutionId=' + institutionId;
    return this.http.get<CustomerMasterAccount[]>(url);
  }

  updateAccountsCustomerName(modifiedCutomerAccounts:Customers):Observable<string>{
    const url = this._baseURL + '/api/Customer/UpdateAccountsCustomerName';
    const customerData = JSON.stringify(modifiedCutomerAccounts);
    return this.http.post<string>(url, customerData, httpOptions);
  }

  public IsRefreshRequired(servicename, delayInSecs: number = 0): boolean {
    let callservice = true;
    let lastRefreshTime: string = localStorage.getItem(servicename);
    if (lastRefreshTime != undefined) {
      let currentTime: number = Date.now();
      let currentRefreshDelaySecs: number = (currentTime - Number.parseInt(lastRefreshTime)) / 1000;
      console.log(currentRefreshDelaySecs);
      if (currentRefreshDelaySecs < (delayInSecs > 0 ? delayInSecs : this._refreshServiceDelay)) {
        callservice = false;
      }
    }
    return callservice;
  }

   getCustomers(): Observable<Customers[]> {
    const url = this._baseURL + '/api/Customer/GetAllCustomers';
    if (this.AllCustomers.length === 0 || this.IsRefreshRequired(Constants.LocalStorage.CUSTOMERDATAREFRESH, 3600)) {
      this.AllCustomers = [];
      localStorage.setItem(Constants.LocalStorage.CUSTOMERDATAREFRESH, Date.now().toString());
      return this.http.get<Customers[]>(url).pipe(
        map(data => {
          this.AllCustomers = data;
          return data; })
      );
    } else {
      return Observable.create((observer: any) => {
        observer.next(this.AllCustomers);
      });
    }
  }
  getCustomersByInstitution(institutionType: string):Observable<Customers[]> {
    const url = this._baseURL + '/api/Customer/GetCustomerByInstitute?institution='+institutionType;
    return this.http.get<Customers[]>(url);
  }

  getNewCustomers(institutionType: string): Observable<CustomerModel[]> {
    const url = this._baseURL + '/api/Customer/GetNewCustomers?institution='+institutionType;
    return this.http.get<CustomerModel[]>(url);
  }

  getCustomersAccounts(institutionType: string):Observable<SearchCustomerAccount[]>{
    const url = this._baseURL + '/api/Customer/SearchCustomerAccounts?institution='+institutionType;
    return this.http.get<SearchCustomerAccount[]>(url);
  }

  getAllUserCustomers(user:string,associatedCustomerGuids:string[]): Observable<Customers[]> {
    const url = this._baseURL + '/api/Customer/GetAllUserCustomers?user='+ user +'&associatedCustomerGuids=' + associatedCustomerGuids;
    return this.http.post<Customers[]>(url,associatedCustomerGuids,httpOptions);
  }
}

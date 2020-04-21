import { Injectable } from '@angular/core';
import { ConfigurationService } from '../services/configuration.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Institution, InstitutionVM, EditCustomerEnvironmentSettingsVM, AddCustomerEnvironmentSettingsVM } from './institution';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};
@Injectable({
  providedIn: 'root'
})

export class EnvSettingsService {
  _baseURL: string
  constructor(private http:HttpClient,
              private configurationService:ConfigurationService) {
    this._baseURL = this.configurationService.currentConfiguration().apiURL;
  }
  public getAllInstitutionsWithCustomers(): Observable<InstitutionVM[]> {
    const url = this._baseURL  + '/api/Institution/getAllInstitutionsWithCustomers';
    return this.http.get<InstitutionVM[]>(url);
  }

  public getAllInstitutions(): Observable<Institution[]> {
    const url = this._baseURL  + '/api/Institution/getAllInstitutions';
    return this.http.get<Institution[]>(url);
  }
  
    public getInstitutionWithCustomersById(institutionId:string): Observable<InstitutionVM> {
    const url = this._baseURL  + '/api/Institution/getInstitutionWithCustomersById?institutionId='+institutionId;
    return this.http.get<InstitutionVM>(url);
  }

  public getInstitutionById(institutionId:string): Observable<InstitutionVM> {
    const url = this._baseURL  + '/api/Institution/getInstitutionById?institutionId='+institutionId;
    return this.http.get<InstitutionVM>(url);
  }

  public getInstitutionByCustomerId(customerId:string): Observable<EditCustomerEnvironmentSettingsVM> {
    const url = this._baseURL  + '/api/Institution/getInstitutionByCustomerId?customerId='+customerId;
    return this.http.get<EditCustomerEnvironmentSettingsVM>(url);
  }
  public editCustomerEnvironmentSettings(custEnvSettings: EditCustomerEnvironmentSettingsVM): Observable<boolean> {
    const url = this._baseURL  + '/api/Institution/updateCustomerEnvironmentSettings';
    const custEnvSettingsData = JSON.stringify(custEnvSettings);
    return this.http.post<boolean>(url, custEnvSettingsData, httpOptions);
  }

  public saveInstitution(institution: Institution): Observable<boolean> {
    const url = this._baseURL + '/api/Institution/updateInstitution';
    const institutionData = JSON.stringify(institution);
    return this.http.post<boolean>(url, institutionData, httpOptions);
  
  }
  public addCustomerEnvironmentSettings(custEnvSettings: AddCustomerEnvironmentSettingsVM): Observable<boolean> {
      const url = this._baseURL + '/api/Institution/addCustomerEnvironmentSettings';
      const custEnvSettingsData = JSON.stringify(custEnvSettings);
      return this.http.post<boolean>(url, custEnvSettingsData, httpOptions);
    }

}

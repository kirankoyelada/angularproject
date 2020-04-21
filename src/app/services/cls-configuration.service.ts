import { Injectable } from '@angular/core';
import { Z3950Profile } from '../Z39.50Profile/model/z3950';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CLSCustomerConfigurationDTO } from '../customer/_dtos/btcat.customer.vm.dtos';
import { CLSCustomerConfiguration, CustomerConfigurationDTO, SaveCustomerConfigurationDTO, CustomerAccount } from '../customer/shared/customer';
import { ConfigurationService } from './configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json"
  })
};

@Injectable({
  providedIn: 'root'
})
export class ClsConfigurationService {
  z3950Locallist:Z3950Profile[];
  macroLocal:string[];
  // Variable Initialization
  _baseURL: string

  // Constructor Initialization
  constructor(private httpClient: HttpClient, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  public getCustomerConfiguartionDetail(customerId: string): Observable<CustomerConfigurationDTO> {
    const url = this._baseURL + '/api/Customer/GetCustomerConfiguration?customerId=' + customerId;
    return this.httpClient.get<CustomerConfigurationDTO>(url);
  }



  public SaveCustomerConfiguration(request: SaveCustomerConfigurationDTO): Observable<any> {
    let url = this._baseURL + "/api/Customer/SaveCustomerConfiguration";

    let data = JSON.stringify(request);
    return this.httpClient.post<any>(url, data, httpOptions);
  }

  public getAccountNumberSuffixConfiguration(accountNumber: string): Observable<any> {
    const url = this._baseURL + '/api/Customer/getAccountNumberSuffixConfiguration?accountNumber=' + accountNumber;
    return this.httpClient.get<any>(url);
  }

  public SaveAccountNumberSuffixConfiguration(request: CustomerAccount): Observable<any> { 
    let url = this._baseURL + "/api/Customer/saveAccountNumberSuffixConfiguration";
    let data = JSON.stringify(request);
    return this.httpClient.post<any>(url, data, httpOptions);
  }

}

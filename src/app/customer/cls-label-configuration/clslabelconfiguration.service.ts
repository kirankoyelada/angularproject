import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CLSCustomerLabelConfiguration, CustomerAccount } from '../shared/customer';
import { CLSCustomerLabelConfigurationDTO } from '../_dtos/btcat.customer.vm.dtos';
import { ConfigurationService } from 'src/app/services/configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json"
  })
};

@Injectable({
  providedIn: 'root'
})
export class ClslabelconfigurationService {

  // Variable Initialization
  _baseURL: string

  // Constructor Initialization
  constructor(private httpClient: HttpClient, private configurationService:ConfigurationService) {
    this._baseURL = this.configurationService.currentConfiguration().apiURL;
  }

  public getCLSustomerLabelConfiguartionDetailById(id: string): Observable<CLSCustomerLabelConfiguration> {
    const url = this._baseURL + '/api/Customer/GetCLSCustomerLabelConfiguration?customerId=' + id;
    return this.httpClient.get<CLSCustomerLabelConfiguration>(url);
  }

  public getAllCustomerDetail(): Observable<CustomerAccount[]> {
    const url = this._baseURL + '/api/Customer/GetAllCustomerDetails';
    return this.httpClient.get<CustomerAccount[]>(url);
  }

  public saveClsCustomerLabelConfiguartion(request: CLSCustomerLabelConfigurationDTO): Observable<string> {
    let url = this._baseURL + "/api/Customer/SaveClsCustomerLabelConfiguration";

    let data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }
}

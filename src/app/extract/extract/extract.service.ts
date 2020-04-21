import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationService } from 'src/app/services/configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json"
  })
};

@Injectable({
  providedIn: 'root'
})
export class ExtractService {
  
  // Variable Initialization
  _baseURL: string

  // Constructor Initialization
  constructor(private httpClient: HttpClient, private configurationService:ConfigurationService) {
    this._baseURL = this.configurationService.currentConfiguration().apiURL;
  }

  public  saveclsLableExtractConfiguration(request: any) : Observable<string> {
    let url = this._baseURL + "/api/Customer/SaveClsCustomerLabelConfiguration";
    let data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }

  extractCLSLableConfiguration(request: any): Observable<any> {
    const url = this._baseURL + `/api/Extract/extractCLSLabelConfiguration`;
    const data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }

  extractCLSMARCOutProcessManual(request: any): Observable<any> {
    const url = this._baseURL + `/api/Extract/extractCLSMARCOutProcessManual`;
    const data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }

  extractOCLCMARCManual(request: any): Observable<any> {
    const url = this._baseURL + `/api/Extract/OCLCMARCExtractManual`;
    const data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }

  undo979TagOCLCExtract(customerId: any, startDate: any):Observable<any>{
    const url = this._baseURL + `/api/Extract/undo979tagoclcextract?customerId=${customerId}&startDate=${startDate}`;
    return this.httpClient.post<string>(url, httpOptions);
  }
  convert960To949TagUnflipProcess(request: any):Observable<any>{
    const url = this._baseURL + `/api/Extract/convert960to949unflipprocess`;
    const data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }

  getOrderProcessLog(request: any): Observable<any> {
    const url = this._baseURL + `/api/Extract/getOrderProcessLog`;
    const data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }

  getNOSProcessLog(request: any): Observable<any> {
    const url = this._baseURL + `/api/Extract/getNOSProcessLog`;
    const data = JSON.stringify(request);
    return this.httpClient.post<string>(url, data, httpOptions);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Z3950Profile } from '../model/z3950';
import { ConfigurationService } from 'src/app/services/configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json"
  })
};

@Injectable({
  providedIn: 'root'
})
export class Z3950Service {

  // Variable Initialization
  _baseURL: string

  // Constructor Initialization
  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  getAllZ3950Profiles() : Observable<Z3950Profile[]>{
    let url = this._baseURL + "/api/Z3950Profile/GetAllSubset";
    return this.http.get<Z3950Profile[]>(url);
  }

  GetAllProfilesBySearchTerm(searchText:string) : Observable<Z3950Profile[]>{
    let url = this._baseURL + "/api/Z3950Profile/SearchZ3950Profile?searchText="+searchText;
    return this.http.get<Z3950Profile[]>(url);
  }

  getZ3950ProfilesByUserId(userId: string) : Observable<Z3950Profile>{
    let url = this._baseURL + "/api/Z3950Profile/GetData?userId=" + userId;
    return this.http.get<Z3950Profile>(url);
  }

  deleteZ3950Profile(request: Z3950Profile) : Observable<any>{
    let url = this._baseURL + "/api/Z3950Profile/DeleteProfile";
    let data = JSON.stringify(request);
    return this.http.post<any>(url, data, httpOptions);
  }

  saveZ3950Profile(request: Z3950Profile): Observable<any> {
    let url = this._baseURL + "/api/Z3950Profile/SaveZ3950Profile";
    let data = JSON.stringify(request);
    return this.http.post<any>(url, data, httpOptions)
  }








}

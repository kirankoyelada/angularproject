import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Macro } from '../macro';
import { ConfigurationService } from 'src/app/services/configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json"
  })
};

@Injectable({
  providedIn: 'root'
})
export class MacroService {

  // Variable Initialization
  _baseURL: string

  // Constructor Initialization
  constructor(private http: HttpClient, private configurationService:ConfigurationService) {
    this._baseURL = this.configurationService.currentConfiguration().apiURL;
  }


  public getMacroById(id: string): Observable<Macro> {
    const url = this._baseURL  + '/api/Template/GetTemplateById?Id=' + id;
    return this.http.get<Macro>(url);
  }

  getloadExistingPythonScripts() : Observable<any[]> {
    const url = this._baseURL  + '/api/Template/GetloadExistingPythonScripts';
    return this.http.get<any[]>(url);
  }

   saveMacro(request: Macro): Observable<string> {
    let url = this._baseURL + "/api/macro/SaveMacro";
    let data = JSON.stringify(request);
    return this.http.post<string>(url, data, httpOptions);
  }


  public getallMacros(): Observable<Macro[]> {
    const url = this._baseURL  + '/api/macros/getall';
    return this.http.get<Macro[]>(url);
  }

  public executeMacro(request: any): Observable<any> {
    let url = this._baseURL + "/api/macros/executeBatchMacro?downloadDependencies=true";
    let data = JSON.stringify(request);
    return this.http.post<any>(url, data, httpOptions);
  }

  batchMacroExecution(marcData:any,userName:string):Observable<any>{
    let url = this._baseURL + "/api/macros/executeBatchMacro?userName="+userName;
    const marData=JSON.stringify(marcData);
    return this.http.post<any>(url,marData,httpOptions);
  }

  createMacro(fd:FormData,customerOnly:boolean):Observable<any>{
    let url = this._baseURL + "/api/MacroAdmin/CreateMacro?customerOnly="+customerOnly;
    return this.http.post<any>(url,fd);
  }

  replaceMacro(fd:FormData):Observable<any>{
    let url = this._baseURL + "/api/MacroAdmin/ReplaceScript";
    return this.http.post<any>(url,fd);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Template, ViewTemplate } from '../template';
import { TemplateDTO, MarcFieldDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { Constants } from 'src/app/constants/constants';
import { ConfigurationService } from 'src/app/services/configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json"
  })
};

@Injectable({
  providedIn: 'root'
})
export class TemplateService {

   CopiedFields: MarcFieldDTO[];
  // Variable Initialization
  _baseURL: string

  // Constructor Initialization
  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  getAllTemplates(isTemplatesPage: boolean): Observable<ViewTemplate[]>{
    let url = this._baseURL + "/api/Template/GetAllTemplates?role=" + localStorage.getItem(Constants.LocalStorage.ACTOR) + "&isTemplatePage="+ isTemplatesPage;
    return this.http.get<ViewTemplate[]>(url);
  }

  getAllTemplatesBySearchTerm(searchText:string): Observable<Template[]>{
    let url = this._baseURL + "/api/Template/SearchTemplate?searchText="+searchText;
    return this.http.get<Template[]>(url);
  }

  public getTemplateById(id: string): Observable<Template> {
    const url = this._baseURL  + '/api/Template/GetTemplateById?Id=' + id;
    return this.http.get<Template>(url);
  }

  deleteTemplate(request: TemplateDTO): Observable<any> {
    let url = this._baseURL + "/api/Template/DeleteTemplate";
    if (request.level === "Global") {
      url = this._baseURL + "/api/Template/DeleteGlobalTemplate";
    } else if (request.level === "Local") {
      url = this._baseURL + "/api/Template/DeleteLocalTemplate";
    } else if (request.level === "Institutional") {
      url = this._baseURL + "/api/Template/DeleteInstitutionTemplate";
    }
    let data = JSON.stringify(request);
    return this.http.post<any>(url, data, httpOptions);
  }

  saveTemplate(request: TemplateDTO): Observable<any> {
    let url = this._baseURL + "/api/Template/SaveTemplate";
    if(request.level === "Global"){
      url = this._baseURL + "/api/Template/SaveGlobalTemplate";
    }
    else if(request.level === "Local"){
      url = this._baseURL + "/api/Template/SaveLocalTemplate";
    }
    else if(request.level === "Institutional"){
      url = this._baseURL + "/api/Template/SaveInstitutionTemplate";
    }
    let data = JSON.stringify(request);
    return this.http.post<any>(url, data, httpOptions);
  }
}

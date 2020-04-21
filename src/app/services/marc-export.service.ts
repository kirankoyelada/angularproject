import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MarcExport } from '../marc-export/marcexport';
import { ConfigurationService } from './configuration.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class MarcExportService {

  _baseURL: string

  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

    getAllMarcExportConfig(): Observable<MarcExport[]> {
        const url = this._baseURL + '/api/ExportMarc/getmarcexportconfig';
        return this.http.get<MarcExport[]>(url);
    }
    executeMarcExportConfig(request: MarcExport, executedBy: string, startDateTime: any, endDateTime: any): Observable<any> {
        const url = this._baseURL + `/api/ExportMarc/runmarcexport?executedBy=${executedBy}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
        const data = JSON.stringify(request);
        return this.http.post<any>(url, data, httpOptions);
    }
    saveMarcExportConfig(request: MarcExport): Observable<any> {
        const url = this._baseURL + '/api/ExportMarc/upsertmarcexportconfig';
        const data = JSON.stringify(request);
        return this.http.post<any>(url, data, httpOptions);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, } from 'rxjs';
import { GAPCustomerMarc } from '../template/GAPCustomerMarc';
import { BatchMacro } from '../marc/shared/marc';
import { ConfigurationService } from '../services/configuration.service';
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};
@Injectable({
  providedIn: 'root'
})
export class UploadRecordFileService {

  _baseURL: string

  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  UploadRecordFile(fd:FormData):Observable<GAPCustomerMarc[]>{
    //http://localhost:56372 /api/MARCMgmt/ getMarcsFromFile
    let url = this._baseURL + "/api/Gap/getMarcsFromFile";
    return this.http.post<GAPCustomerMarc[]>(url,fd);
  }

  SaveUploadRecordFile(marcData:GAPCustomerMarc[],customerID:string,userName:string):Observable<any>{
    let url = this._baseURL + "/api/Gap/saveGAPCustomerMarc?customerId="+customerID+"&userName="+userName;
    const marData=JSON.stringify(marcData);
    return this.http.post<any>(url,marData,httpOptions);
  }

  GetGapLoadStatus(exceutionId:string):Observable<any>{
    let url = this._baseURL + "/api/Gap/GapLoadStatus?id="+exceutionId;
    return this.http.get<string>(url);
  }

  GetMarcRecordsRange(from:Number,to:Number):Observable<BatchMacro[]>{
    let url = this._baseURL + "/api/MARCMgmt/getAllMarcRecords?from="+from+"&to="+to;
    return this.http.get<BatchMacro[]>(url);
  }
}

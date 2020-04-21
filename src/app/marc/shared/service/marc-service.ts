import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Marc, MarcEditorSettings, SystemSettings, MarcField, MarcSubField, MarcRecordHistory, MergeMarc } from '../marc';
import { Observable } from 'rxjs';
import { MarcFieldDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { Constants } from 'src/app/constants/constants';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

const httpOptionsForFile = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  }), responseType: 'blob' as 'json'
};

const httpOptionsMutliPart = { responseType: 'blob' as 'json'
};

@Injectable()
export class MarcService {
  id: string;
  marcUrl: string;
  CopiedFields: MarcFieldDTO[];
  _baseURL: string

  constructor(private http: HttpClient, private configurationService:ConfigurationService) {
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  getMarcRecordById(id: string): Observable<Marc> {
    const url = this._baseURL + '/api/MARCMgmt/marc?marcId=' + id;
    return this.http.get<Marc>(url);
  }
  getDeletedMarcRecordById(id: string): Observable<Marc> {
    const url = this._baseURL + '/api/MARCMgmt/getDeletedMarcRecord?marcId=' + id;
    return this.http.get<Marc>(url);
  }

  getMarcRecords(ids: string[]): Observable<Marc[]> {
    let param = '';
    ids.forEach(id => {
      param = param + `marcIds=${id}&`;
    });
    // selectedCourses=1050&selectedCourses=2000
    const url = this._baseURL + '/api/MARCMgmt/marcs?' + param.slice(0, -1);
    return this.http.get<Marc[]>(url);
  }
  //This service will call the soft delete method in controller
  deleteMarcRecordById(id: string): Observable<string> {
    const url = this._baseURL + '/api/MARCMgmt/deleteMarc?marcId=' + id;
    return this.http.delete<string>(url);
  }

  cloneMarcRecordById(id: string): Observable<Marc> {
    const url = this._baseURL + '/api/MARCMgmt/cloneMarc?marcId=' + id + '&catalogingSource=' + 'NjBwBT';
    return this.http.get<Marc>(url);
  }

  getMarcRecordByTemplateId(id: string): Observable<Marc> {
    const url = this._baseURL + '/api/MARCMgmt/marcFromTemplate?templateId=' + id + '&catalogingSource=' + 'NjBwBT';
    return this.http.get<Marc>(url);
  }

  getMarcRecord(id: string): Observable<Marc> {
    const url = this._baseURL + '/api/MARCMgmt/marc?marcId=' + id;
    return this.http.get<Marc>(url);
  }

  getAuthorityRecord(id: string): Observable<Marc> {
    const url = this._baseURL + '/api/AuthorityRecord/authRec?authorityId=' + id;
    return this.http.get<Marc>(url);
  }

  getMarcSettings(): Observable<SystemSettings> {
    const url = this._baseURL + '/api/SystemSettings/systemsettings';
    return this.http.get<SystemSettings>(url);
  }

  updateMarcRecord(request: Marc, savetoCustomerWS: boolean, customerId:string): Observable<any> {

    let url = this._baseURL + '/api/MARCMgmt/updatemain';
    if (request && !request.isSaveToBTCATMain) {
      url = this._baseURL + '/api/MARCMgmt/updateworkspace';
    }
    if(savetoCustomerWS){
      url = this._baseURL + '/api/MARCMgmt/updateCustomerMarc?customerId=' + customerId;
    }
    const data = JSON.stringify(request);
    return this.http.post<string>(url, data, httpOptions);
  }

  createMarcRecord(request: Marc, controlNumberPrefix: string, templateId: string, isZ3950Edit: boolean, isupdate010: boolean, savetoCustomerWS: boolean, customerId:string): Observable<any> {
    templateId = templateId ? templateId : '';
    let url = this._baseURL + '/api/MARCMgmt/createmain?templateId=' + templateId + '&prefix=' + controlNumberPrefix + '&isZ3950Edit=false&isupdate010=false';
    if (request && !request.isSaveToBTCATMain && templateId != '') {
      url = this._baseURL + '/api/MARCMgmt/createworkspace?templateId=' + templateId + '&prefix=' + controlNumberPrefix + '&isZ3950Edit=false&isupdate010=false';
    }
    else if (request && request.isSaveToBTCATMain && templateId === '') {
      if (isZ3950Edit) {
        url = this._baseURL + '/api/MARCMgmt/clonemain?templateId=' + templateId + '&prefix=' + controlNumberPrefix + '&isZ3950Edit=' + isZ3950Edit + '&isupdate010=' + isupdate010;
      } else
        url = this._baseURL + '/api/MARCMgmt/clonemain?templateId=' + templateId + '&prefix=' + controlNumberPrefix + '&isZ3950Edit=false&isupdate010=false';
    }
    else if (request && !request.isSaveToBTCATMain && templateId === '') {
      if (isZ3950Edit) {
        if(savetoCustomerWS){
          url = this._baseURL + '/api/MARCMgmt/createCustomerMarc?customerId=' + customerId + '&isupdate010=' + isupdate010;
        }
        else{
          url = this._baseURL + '/api/MARCMgmt/cloneworkspace?templateId=' + templateId + '&prefix=' + controlNumberPrefix + '&isZ3950Edit=' + isZ3950Edit + '&isupdate010=' + isupdate010;
        }
      } else
        url = this._baseURL + '/api/MARCMgmt/cloneworkspace?templateId=' + templateId + '&prefix=' + controlNumberPrefix + '&isZ3950Edit=false&isupdate010=false';
    }
    const data = JSON.stringify(request);
    return this.http.post<string>(url, data, httpOptions);
  }

  getMarcRecordsForMerge(srcId: string, destId: string): Observable<MergeMarc> {
    const url = this._baseURL + '/api/MARCMgmt/marcsForMerge?srcMarcId=' + srcId + '&destMarcId=' + destId;
    return this.http.get<MergeMarc>(url);
  }

  getMarcRecordHistoryForMerge(destMarcRecHistoryId: string, otherMarcRecHistoryId: string): Observable<MergeMarc> {
    const url = this._baseURL + '/api/MARCRecordHistory/marcRecordHistoryForMerge?destMarcRecHistoryId=' + destMarcRecHistoryId + '&otherMarcRecHistoryId=' + otherMarcRecHistoryId;
    return this.http.get<MergeMarc>(url);
  }

  getMarcRecordHistory(recordNumber: Number): Observable<MarcRecordHistory[]> {
    const url = this._baseURL + '/api/MARCRecordHistory/marcRecordHistoryByRecordNumber?recordNumber=' + recordNumber;
    return this.http.get<MarcRecordHistory[]>(url);
  }

  public getMarcRecordHistoryPagination(recordNumber: Number, minVersionNumber: Number, maxVersionNumber: Number): Observable<MarcRecordHistory[]> {
    const url = this._baseURL + '/api/MARCRecordHistory/marcPagination?recordNumber=' + recordNumber + '&minVersionNumber=' + minVersionNumber + '&maxVersionNumber=' + maxVersionNumber;
    return this.http.get<MarcRecordHistory[]>(url);
  }
  getMarcRecordHistoryById(id: string): Observable<MarcRecordHistory> {

    const url = this._baseURL + '/api/MARCRecordHistory/getMarcRecordHistoryById?id=' + id;
    return this.http.get<MarcRecordHistory>(url);
  }

  mergeMarcRecord(request: Marc, otherMarcRecordId: string, retain: boolean): Observable<any> {
    const url = this._baseURL + '/api/MARCMgmt/merge?otherMarcRecordId=' + otherMarcRecordId + "&retain=" + retain;
    const data = JSON.stringify(request);
    return this.http.post<string>(url, data, httpOptions);
  }

  getMarcGeneratedPdf(marcRecord: any, delimiter: string, lineSpace: string, currentDateTime:string): Observable<any> {
    const url = this._baseURL + '/api/MARCMgmt/GenerateMarcPdf?delimiter=' + encodeURI(delimiter) + "&lineSpace=" + lineSpace + "&localDateTime=" + currentDateTime;
    const marcData = JSON.stringify(marcRecord);
    return this.http.post<string>(url, marcData, httpOptionsForFile);
  }

  generateORSNumber(): Observable<any> {
    const url = this._baseURL + '/api/MARCMgmt/generateORSNumber';
    return this.http.get<any>(url);
  }

  downloadMarc(fd:FormData): Observable<any> {
    const url = this._baseURL + '/api/MARCMgmt/downloadMarcFile';
    return this.http.post<string>(url, fd, httpOptionsMutliPart);
  }
}

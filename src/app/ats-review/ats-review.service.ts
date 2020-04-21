import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marc } from '../marc/shared/marc';
import { ConfigurationService } from '../services/configuration.service';


const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};

@Injectable()
export class AtsReviewService {

    constructor(private http: HttpClient, private configurationService:ConfigurationService) { }

    getAtsMarcRecordByIds(ids:any, tag, subFieldCode): Observable<Marc[]> {        
        const url = this.configurationService.currentConfiguration().apiURL + '/api/MARCMgmt/getAtsReviewRecords?tag=' + tag + '&subFieldCode='+ subFieldCode;
        const data = JSON.stringify(ids);
        return this.http.post<Marc[]>(url, data, httpOptions);
    }
}
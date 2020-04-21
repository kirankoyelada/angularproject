import { Injectable } from '@angular/core';
import { MarcState } from '../shared/store/marc-state';
import { MarcAdapter } from '../shared/service/marc-adapter.service';
import { Observable } from 'rxjs';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { CommonService } from '../../shared/service/common.service';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';

@Injectable({
  providedIn: 'root'
})
export class MarcEditContainerResolver implements Resolve<any> {
  constructor(private marcAdapter: MarcAdapter,
              private commonService: CommonService) { }
  resolve(route: ActivatedRouteSnapshot): Observable<MarcState[]> {
    const ids: string[] = [];
    const marcParmList: string[] = route.params.marcParams.split(',');
    if (marcParmList && !this.commonService.isZ3950ProfileSearch()) {
      marcParmList.forEach(marcParam => {
        const marcParamSplit = marcParam.split(':');
        const id = marcParamSplit[0] ? marcParamSplit[0] : '';
        ids.push(id);
      });
      return this.marcAdapter.getMarcs(ids);
    }
  }
}



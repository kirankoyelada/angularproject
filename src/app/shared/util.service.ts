import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { KeyValue } from '../marc/shared/marc';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  getDateinSystemFormat(editedDate: any) {
    if (editedDate !== '') {
      // get browser language
      const language = navigator.language;
      const estDate: moment = moment(editedDate);
      // set browser languate as local language
      moment.locale(navigator.language);
      const zone = moment.tz.guess(); // get the zone from local system
      const estTime = moment.tz(estDate.format('YYYY-MM-DD HH:mm:ss'), 'America/New_York'); // get EST date from api and set
      const localTime = estTime.clone().tz(zone); // get current time in local system
      const localDateTime = localTime.format('L') + ' ' + localTime.format('LT'); // contact date and time
      editedDate = localDateTime;
    }
    return editedDate;
  }

  compare(a: KeyValue, b: KeyValue) {
    const valueA = a.value.toUpperCase();
    const valueB = b.value.toUpperCase();

    let comparison = 0;
    if (valueA > valueB) {
      comparison = 1;
    } else if (valueA < valueB) {
      comparison = -1;
    }
    return comparison;
  }

}

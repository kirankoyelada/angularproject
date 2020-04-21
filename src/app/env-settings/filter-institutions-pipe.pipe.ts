import { Pipe, PipeTransform } from '@angular/core';
import { isObject } from 'util';
import _ from 'lodash';

@Pipe({
  name: 'filterInstitutionsPipe'
})
export class FilterInstitutionsPipePipe implements PipeTransform {

  transform(items: any, searchText: string): any[] {
    if (!items) return [];
    if (!searchText || searchText === '') return [];
    let users = searchText.split(" ");
    let institutions: any = [];

    items.forEach(x => {
      var isIncludes: boolean = false;
      let name = x.name;
      isIncludes = users.every(v => name.toLowerCase().includes(v.toLowerCase()));
      if (isIncludes) {
        let index = institutions.findIndex(obj => {
          return JSON.stringify(obj) === JSON.stringify(x);
        });
        if (index === -1) {
          institutions.push(x);
        }
      }
    });

    let sortedUserItems = _.sortBy(institutions, ['name']);

    if(institutions.length === 0){
      institutions.name='Institution not found';
      institutions.push(institutions);
      return institutions;
    }
    return sortedUserItems;
  }

}

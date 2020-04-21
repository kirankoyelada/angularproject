import { Pipe, PipeTransform } from "@angular/core";
import * as _ from 'lodash';
import { isObject } from 'util';
@Pipe({
  name: "filter"
})
export class FilterPipePipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText || searchText === '' || isObject(searchText)) return [];
    let users = searchText.split(" ");
    let useritems: any = [];

    items.forEach(x => {
      var isIncludes: boolean = false;
      let name = x.lastName + ", " + x.firstName;
      isIncludes = users.every(v => name.toLowerCase().includes(v.toLowerCase()));
      if (isIncludes) {
        let index = useritems.findIndex(obj => {
          return JSON.stringify(obj) === JSON.stringify(x);
        });
        if (index === -1) {
          useritems.push(x);
        }
      }
    });

    let sortedUserItems = _.sortBy(useritems, ['lastName','firstName']);

    if(useritems.length === 0){
      useritems.lastName='';
      useritems.firstName='User not found';
      useritems.push(useritems);
      return useritems;
    }

    return sortedUserItems;
  }
}

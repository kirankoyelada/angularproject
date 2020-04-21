import { Pipe, PipeTransform } from '@angular/core';
import { isObject } from 'util';
import * as _ from 'lodash';

@Pipe({
  name: 'filterCustomerByName'
})
export class FilterCustomerByNamePipe implements PipeTransform {

  transform(lCustomers: any[], searchText: any): any[] {
    if (!lCustomers) return [];
    if (!searchText || searchText === '' || isObject(searchText)) return [];
    let searchData = searchText.split(' ');
    let filteredCustomers: any = [];
    lCustomers.forEach(x => {
      var isIncludes: boolean = false;
      if (x.customerName) {
        isIncludes = searchData.every(v => x.customerName.toLowerCase().includes(v.toLowerCase()));
        if (isIncludes) {
          let index = filteredCustomers.findIndex(obj => {
            return JSON.stringify(obj) === JSON.stringify(x);
          });
          if (index === -1) {
            if(filteredCustomers.find(y=>y.customerName === x.customerName)){

            }else
            filteredCustomers.push(x);
          }
        }
      }
    });

    if (filteredCustomers.length == 0) {
      filteredCustomers.customerName = 'Customer not found';
      filteredCustomers.push(filteredCustomers);
      return filteredCustomers;
    }
    else {
      let sortedFilteredCustomers = _.sortBy(filteredCustomers, ['customerName']);
      return sortedFilteredCustomers;
    }
  }
}

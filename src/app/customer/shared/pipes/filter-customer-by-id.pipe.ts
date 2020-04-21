import { Pipe, PipeTransform } from '@angular/core';
import { isObject } from 'util';
import * as _ from 'lodash';

@Pipe({
  name: 'filterCustomerById'
})
export class FilterCustomerByIdPipe implements PipeTransform {

  transform(lCustomers: any[], searchText: any): any[] {
    if (!lCustomers) return [];
    if (!searchText || searchText === '' || isObject(searchText)) return [];
    let searchData = searchText.split(' ');
    let filteredCustomers: any = [];
    lCustomers.forEach(x => {
      var isIncludes: boolean = false;
      isIncludes = searchData.every(v => x.customerId.toLowerCase().includes(v.toLowerCase()));
      if (isIncludes) {
        let index = filteredCustomers.findIndex(obj => {
          return JSON.stringify(obj) === JSON.stringify(x);
        });
        if (index === -1) {
          if (filteredCustomers.find(y => y.customerId === x.customerId)) {

          } else
            filteredCustomers.push(x);
        }
      }
    });

    if (filteredCustomers.length == 0) {
      filteredCustomers.customerName = 'Customer Id not found';
      filteredCustomers.push(filteredCustomers);
      return filteredCustomers;
    }
    else {
      let sortedFilteredCustomers = _.sortBy(filteredCustomers, ['customerId']);
      return sortedFilteredCustomers;
    }
  }

}

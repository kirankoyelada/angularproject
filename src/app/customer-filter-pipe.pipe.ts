import { Pipe, PipeTransform } from '@angular/core';
import { isObject } from 'util';
import * as _ from 'lodash';

@Pipe({
  name: 'customerfilter'
})
export class CustomerFilterPipe implements PipeTransform {

  transform(lCustomers: any[], searchText: any): any[] {
    if (!lCustomers) return [];
    if (!searchText || searchText === '' || isObject(searchText)) return [];
    let searchData = searchText.split(' ');
    let filteredCustomers: any = [];
    lCustomers.forEach(x => {
      var isIncludes: boolean = false;
      let name = "";
      if (x.customerId && x.customerName) {
        name = x.customerName == null ? x.customerId : x.customerName + ", " + x.customerId;
      }
      else if (x.customerId) {
        name = x.customerId;
      }
      else if (x.customerName) {
        name =  x.customerName;
      }
      isIncludes = searchData.every(v => name.toLowerCase().includes(v.toLowerCase()));
        if (isIncludes) {
          let index = filteredCustomers.findIndex(obj => {
            return JSON.stringify(obj) === JSON.stringify(x);
          });
          if (index === -1) {
            filteredCustomers.push(x);
          }
        }
      
    });

    if (filteredCustomers.length == 0) {
      filteredCustomers.customerName = 'Customer not found';
      filteredCustomers.push(filteredCustomers);
      return filteredCustomers;
    }
    else {
      let sortedFilteredCustomers = _.sortBy(filteredCustomers, ['customerId', 'customerName']);
      return sortedFilteredCustomers;
    }
  }
}

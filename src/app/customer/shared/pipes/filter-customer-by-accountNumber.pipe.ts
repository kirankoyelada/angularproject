import { Pipe, PipeTransform } from '@angular/core';
import { isObject } from 'lodash';
import * as _ from 'lodash';

@Pipe({
  name: 'filterCustomerByAccountNumber'
})
export class FilterCustomerByAccountNumberPipe implements PipeTransform {

  transform(accountsList: any[], searchText: any): any[] {
    if (!accountsList) return [];
    if (!searchText || searchText === '' || isObject(searchText)) return [];
    
    let filteredAccounts: any = [];
    filteredAccounts = accountsList.filter(x => x.accountNumber!=null && x.accountNumber.toLowerCase().includes(searchText.toLowerCase()));

    if (filteredAccounts.length == 0) {
      filteredAccounts.accountNumber = 'Account not found';
      filteredAccounts.push(filteredAccounts);
      return filteredAccounts;
    }
    else {
      let sortedFilteredAccounts = _.sortBy(filteredAccounts, ['customerId', 'accountNumber']);
      let topAccounts = sortedFilteredAccounts.splice(0, 200);
      return topAccounts;
    }

    //********OLD Filter logic for with space in search value */
    // let searchData = searchText.split(' ');
    // accountsList.forEach(x => {
    //   var isIncludes: boolean = false;
    //     isIncludes = searchData.every(v => x.accountNumber.includes(v));
    //     if (isIncludes) {
    //       let index = filteredAccounts.findIndex(obj => {
    //         return JSON.stringify(obj) === JSON.stringify(x);
    //       });
    //       if (index === -1) {
    //         if(filteredAccounts.find(y=>y.accountNumber === x.accountNumber)){

    //         }else
    //         filteredAccounts.push(x);
    //       }
    //     }
    // });
  }
}

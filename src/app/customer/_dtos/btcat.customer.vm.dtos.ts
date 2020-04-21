import { LabelPrintConfiguration, LabelConfiguration, CLSCustomerLabelConfiguration, CustomerMasterAccount, MainAccount, CLSCustomerConfiguration, CLSCustomerContactDetails, CLSCustomerInternalContactDetails, CLSCustomerOthers, OCLCCustomerConfiguration, ATSReviewFields } from '../shared/customer';
import { jsonpCallbackContext } from '@angular/common/http/src/module';
import { Z3950Profile } from '../../Z39.50Profile/model/z3950';

export class CustomerMasterAccountDTO {
  masterAccount: string;  
  customerId: string;
  customerName:string;
  mainAccounts: MainAccountDTO[];
  isShowMasterCheckbox: boolean;
  isCheckMasterCheckbox: boolean;
  isExpanded:boolean;
  id: string;
  static fromSource(json: CustomerMasterAccount, isNew: boolean, customerName: string): CustomerMasterAccountDTO {

    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      masterAccount: json.masterAccount ? json.masterAccount : '',     
      id: json.id ? json.id : '', 
      customerId: json.customerId ? json.customerId : '',
      customerName: json.customerName ? json.customerName : '',
      mainAccounts: json.mainAccounts.map((x) => {
        // tslint:disable-next-line: no-use-before-declare
        return MainAccountDTO.fromSource(x, isNew, customerName);
      }),
      isShowMasterCheckbox: this.isShowMasterCheckBox(json.mainAccounts, isNew, customerName),
      isCheckMasterCheckbox: this.isCheckMasterCheckBox(json.mainAccounts, isNew, customerName),
      isExpanded:  false
    };
  }
  private static isShowMasterCheckBox(mainAccounts: MainAccount[], isNew: boolean, customerName: string): boolean {
    if (isNew) {
      var customerExists = [];
      mainAccounts.filter(x => {
        if (x.customerName != null)
          customerExists.push(x);
      });

      var data = [];
      mainAccounts.filter(x => {
        if (x.customerName == null || x.customerName == '')
          data.push(x);
      });
      if (customerExists.length == mainAccounts.length)
        return false;
      else if (data.length > 0)
        return true;

    }
    else {
      var existCustomers = [];
      mainAccounts.filter(y => {
        if ((y.customerName != null && y.customerName.toLowerCase() == customerName.toLowerCase())
          || y.customerName == null || y.customerName == '')
          existCustomers.push(y);
      });
      if (existCustomers.length > 0)
        return true;
      else
        return false;
    }
  };

  private static isCheckMasterCheckBox(mainAccounts: MainAccount[], isNew: boolean, customerName: string): boolean {
    if (isNew) {
      var checkExistingAccounts = [];
      mainAccounts.filter(y => {
        if (y.customerName == null || y.customerName == '')
          checkExistingAccounts.push(y);

      });
      if (mainAccounts.length > 0)
        return false;
      else
        return true;
    }
    else {
      var existingCustomers = [];
      mainAccounts.filter(y => {
        if ((y.customerName != null && y.customerName.toLowerCase() == customerName.toLowerCase()) ||
          (y.customerName != null && y.customerName.toLowerCase() != customerName.toLowerCase()))
          existingCustomers.push(y);
      });
      if (existingCustomers.length == mainAccounts.length)
        return true;
      else
        return false;

    }
  };

}

export class MainAccountDTO {
  accountNumber: string;
  id: string;
  customerName: string;
  accountName: string;
  isChecked: boolean;
  isShowCheckBox: boolean;
  static fromSource(json: MainAccount, isNew: Boolean, customerName: string): MainAccountDTO {
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      accountNumber: json.accountNumber,
      id: json.id,
      customerName: json.customerName,
      accountName: json.accountName,
      isChecked: this.isCheckBoxSelected(json, isNew, customerName),
      isShowCheckBox: this.isSelectCheckBox(json, isNew, customerName),
    };
  }
  private static isSelectCheckBox(mainAccount: MainAccount, isNew: Boolean, customerName: string): boolean {
    if (isNew) {
      if (mainAccount.customerName == '' || mainAccount.customerName == null)
        return true
      else
        return false;
    }
    else {
      if ((mainAccount.customerName != null && mainAccount.customerName.toLowerCase() == customerName.toLowerCase()) || mainAccount.customerName == '' || mainAccount.customerName == null) {
        return true;

      }
      else
        return false;

    }
  }

  private static isCheckBoxSelected(mainAccount: MainAccount, isNew: Boolean, customerName: string): boolean {
    if (isNew) {
      if (mainAccount.customerName == '' || mainAccount.customerName == null)
        return false
      // else
      //   return true;
    }
    else {
      if (mainAccount.customerName != null && mainAccount.customerName.trim().toLowerCase() == customerName.trim().toLowerCase())
        return true;
      else
        return false;

    }
  }
}


// View model for the CLS Customer Label Configuration
export class CLSCustomerLabelConfigurationDTO {
  id?: string;
  customerId?: string;
  barcodeComment?: string;
  barcodeSymbology?: string;
  barcodeSubFieldIn949?: string;
  templateOverwrite: boolean;
  displayHumanReadableCheckDigit: boolean;
  checkDigit: boolean;
  spineLabel: LabelPrintConfiguration;
  oneLineSpineLabel: LabelPrintConfiguration;
  eyeReadableBarcode: LabelPrintConfiguration;
  branchLabel: LabelPrintConfiguration;
  labelConfigurations: LabelConfiguration[];
  createdBy:string;
  lastModifiedBy:string;
  static fromSource(json: CLSCustomerLabelConfiguration): CLSCustomerLabelConfigurationDTO {
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      id: json.id ? json.id : '',
      customerId: json.customerId ? json.customerId : '',
      barcodeComment: json.barcodeComment ? json.barcodeComment : '',
      barcodeSymbology: json.barcodeSymbology ? json.barcodeSymbology : '',
      barcodeSubFieldIn949: json.barcodeSubFieldIn949 ? json.barcodeSubFieldIn949 : '',
      templateOverwrite: json.templateOverwrite,
      displayHumanReadableCheckDigit: json.displayHumanReadableCheckDigit,
      checkDigit: json.checkDigit,
      spineLabel: json.spineLabel,
      oneLineSpineLabel: json.oneLineSpineLabel,
      eyeReadableBarcode: json.eyeReadableBarcode,
      branchLabel: json.branchLabel,
      labelConfigurations: json.labelConfigurations,
      createdBy:json.createdBy,
      lastModifiedBy :json.lastModifiedBy
    };
  }
}

export class CLSCustomerConfigurationDTO {
  id: string; 
  customerId?: string;
  catalogs: Z3950Profile[];
  macros: string[];
  createdBy?: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
  customerContacts: CLSCustomerContactDetails[];
  internalContacts: CLSCustomerInternalContactDetails[];
  atsReviewFields :ATSReviewFields[];
  customerOthersDetails: CLSCustomerOthers;
  oclcDetails: OCLCCustomerConfiguration;
  static fromSource(json: CLSCustomerConfiguration): CLSCustomerConfigurationDTO {
    let customerContactDetailsObj = [];
    let internalContactDetailsObj = [];
    let atsReviewFieldsObj  = [];
    let customerOthersDetailsObj = new CLSCustomerOthers;
    let oclcDetailsObj = new OCLCCustomerConfiguration;
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      id: json.id,
      catalogs: json.catalogs,
      macros: json.macros,
      customerContacts: json.customerContacts?json.customerContacts:customerContactDetailsObj,
      createdDate: json.createdDate,
      lastModifiedBy: json.lastModifiedBy,
      lastModifiedDate: json.lastModifiedDate,
      internalContacts: json.internalContacts?json.internalContacts:internalContactDetailsObj,
      customerOthersDetails: json.customerOthersDetails?json.customerOthersDetails:customerOthersDetailsObj,
      oclcDetails: json.oclcDetails ? json.oclcDetails : oclcDetailsObj,
      atsReviewFields: json.atsReviewFields ? json.atsReviewFields : atsReviewFieldsObj,
    };
  }
}

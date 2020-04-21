import { MarcEditorSettings } from '../marc/shared/marc';


export class Institution{
    name:string;
    environmentSettings:MarcEditorSettings;
    id:string;
    createdBy:string;
    createdDate:string;
    lastModifiedBy:string;
    lastModifiedDate:string;
  }

 export class  InstitutionVM{
  institution :Institution;
  customers:CustomerInstitution[];
  isExpanded:boolean=false;
 }
 export class CustomerVM {
  id: string;
  customerName: string;
  institutionId :string;
  HasSettings:boolean;
  isSelected:boolean = false;
  // selectedAccounts: string[];

}
export class  CustomerInstitution {
  id:string;
  institutionId:string;
  customerName:string;
  hasSettings:boolean;
  isSelected:boolean = false;
}

export class EditCustomerEnvironmentSettingsVM{
  name:string;
  environmentSettings:MarcEditorSettings;
  customerId:string;
  id:string;
  customerName:string;
}

export class AddCustomerEnvironmentSettingsVM{
  environmentSettings:MarcEditorSettings;
  customerIds:string[];
  institutionId:string;
}

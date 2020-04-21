import { MarcField } from "../marc/shared/marc";

export class GAPCustomerMarc{
  Title?:string;
  Author?:string;
  Fields:MarcField[];
  GAPCustId:number;
}

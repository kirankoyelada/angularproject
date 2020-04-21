import { MarcFieldDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { Role, Permission } from 'src/app/shared/role';

export class Marc {
    [x: string]: any;
    id: string;
    fields: MarcField[];
    recordNumber: number;
    createdBy: string;
    createdDate: Date;
    lastModifiedBy: string;
    lastModifiedDate: Date;
    isActive: boolean;
    isBTCATMain: boolean;
    RecordControlNumber:string;
    customerId: string;
}

export class MarcField {
    tag: string;
    data: string;
    type: string;
    ind1: string;
    ind2: string;
    subfields: MarcSubField[];
    color: string;
    subFieldDescription: string;
    isValid: boolean;
    isValidData: boolean;
    originalData: string;
}

export class MarcSubField {
    code: string;
    data: string;
    authorityId: string;
}

export class MarcEditorSettings {
    tagcolor: string;
    font: string;
    indcolor: string;
    delimiter: string;
    subfieldcolor: string;
    highlightedcolor: string;
    fontsize: string;
    backgroundcolor: string;
    revealSpaces: boolean;
    ftpLocation:string;
    userName:string;
    password:string;
}

// Model for Merge Marc
export interface  MergeMarc {
    source: Marc;
    destination: Marc;
    final: Marc;
  }
export class SystemSettings {
    MarcEditorSettings: MarcEditorSettings;
    BibMarcData: MarcBibData[];
    Z3950AttributeOptions: Z3950AttributeOptions;
    Z3950SearchType: AttributeValues[];
    TimeOut: TimeOut;
    TemplateTypes: TemplateType[];
    Roles: Role[];
    Permissions: Permission[];
    ExportMarcConfigData: ExportMarcConfigData;
    CLSCustomerLabelDefaultConfiguration: any;
    Catalogs:any[];
    atsReviewFields:any[];
    roleBasedMacros:RoleBasedMacro[];
    fontFamilies : any[];
}

export interface RoleBasedMacro{
  role:string,
  macros:string[],
}

export interface ExportMarcConfigData {
  tagIndicatorsKeyValue: KeyValue[];
  ctrlNumberPrefixValues: string[];
  marcFormatKeyValue: KeyValue[];
}

export interface KeyValue {
  key: string;
  value: string;
}
export class TemplateType {
    name: string;
    defaultBibMarcData: MarcField[];
}

export class TimeOut {
    idleTime: string;
    sessionTimeOut: string;
}

export class MarcBibData {
    description: string;
  ind1: MarcIndicator[];
  ind2: MarcIndicator[];
  isExpandable?: boolean;
  // TODO: Not sure why isObsolete is needed in the master data from server
  isObsolete?: boolean;
  repeatable?: boolean;
  subfields?: MarcBibSubFields[];
  subElements?: MarcBibSubElements[];
  tag: string;
  type?: string;
}

export interface MarcIndicator {
    code: string;
    description: string;
    isObsolete:boolean;
}

export class MarcBibSubFields {
    code: string;
    description: string;
    repeatable: boolean;
    isObsolete:boolean;
}

export class MarcBibSubElements {
  defaultValue: string;
  description: string;
  element: string;
  isEditable: boolean;
  isvisible: boolean;
  isValid: boolean;
  length: string;
  materialType: MaterialType[];
  repeatable: boolean;
  validationRules: string[];
  values?: Value[];
}

export class MaterialType {
  materialType: string;
  type: string;
  relativefields: RelativeField[];
}

export class RelativeField {
  description: string;
  element: string;
  length: string;
  validationRules: string[];
  values: Value[];
}

export class Value {
  code: string;
  description: string;
  isDisable: boolean;
  materialType: string;
}


export class Z3950AttributeOptions {
    Use: AttributeSettings[];
    Relation: AttributeSettings[];
    Position: AttributeSettings[];
    Structure: AttributeSettings[];
    Truncation: AttributeSettings[];
    Completeness: AttributeSettings[];
}


export class AttributeSettings
{
    Type: number;
    Values: AttributeValues[]
}

export class AttributeValues {
    name: string;
    value: number;
    order: number;
    type:string;
}


export class MarcRecordHistory
{
    [x: string]: any;
    id: string;
    fields: MarcField[];
    recordNumber: number;
    createdBy: string;
    createdDate: Date;
    lastModifiedBy: string;
    lastModifiedDate: Date;
    isActive: boolean;
    isBTCATMain: boolean;
    versionNumber:number;
    title : string;
    isSelect : boolean;
    isLatestRecord : boolean;
    orginalMarcId: any;
    RecordControlNumber: string;
    customerId: string;
    recordSource: string;
}

export class Catalogs
{
    id: string;
    profileName: string;
    isActive: boolean;
    profileDescription: string;
    databaseName: string;
    customerName: string;
}

export class BatchMacro
{
  [x: string]: any;
    id: string;
    fields: MarcField[];
    recordNumber: number;
    createdBy: string;
    createdDate: Date;
    lastModifiedBy: string;
    lastModifiedDate: Date;
    isActive: boolean;
    isBTCATMain: boolean;
    RecordControlNumber:string;
    Author:string;
    Title:string;
}

import { Z3950Profile } from '../../Z39.50Profile/model/z3950';
import { CLSCustomerConfigurationDTO } from '../_dtos/btcat.customer.vm.dtos';
import { MarcEditorSettings } from 'src/app/marc/shared/marc';

export class Customer {
    customerId: string;
    customerName: string;
    customerSuffix: string;
    customerAccounts: CustomerAccount[];
    clsCustomerLabelConfiguration: CLSCustomerLabelConfiguration;
}

export class SearchCustomerAccount {
    customerId: string;
    accountNumber: string;
}

export class CustomerAccount {
    id: string;
    customerId: string;
    accountNumber: string;
    accountName: string;
    accountPrefix: string;
    accountSuffix: string;
    contactEmail: string;
    masterAccount: string;
    executionId: string;
    suffixConfiguration: SuffixConfiguration[];
    customerName: string;
    sentEmailToCustomer: boolean;
    combineATS: boolean;
    isDisableCombineAts: boolean;//not saved in database
    isMasterAccount: boolean;
}

export class SuffixConfiguration {
    id: string;
    suffix: string;
    descriptionOfSuffix: string;
    combineATS: boolean;
    outputFileName: string;
    outputFileLocation: string;
    contactforLAccount: string;
    emailSubjectLine: string;
}


export class CustomerConfigurationDTO {
    customerAccounts: CustomerAccount[];
    customerConfiguration: CLSCustomerConfiguration;
}

export class SaveCustomerConfigurationDTO {
    customerAccounts: CustomerAccount[];
    customerConfigurationDTO: CLSCustomerConfigurationDTO;
    associatedUserIds:string[];
    customerId: string;
}

export class CLSCustomerConfiguration {
    id: string;
    customerId: string;
    customerName: string;
    catalogs: Z3950Profile[];
    macros: string[];
    createdBy: string;
    createdDate: Date;
    lastModifiedBy: string;
    lastModifiedDate: Date;
    accountNumbers: CLSCustomerAccountNumbers[];
    customerContacts: CLSCustomerContactDetails[];
    internalContacts: CLSCustomerInternalContactDetails[];
    customerOthersDetails: CLSCustomerOthers;
    oclcDetails: OCLCCustomerConfiguration;
    atsReviewFields: ATSReviewFields[];
}

export class CLSCustomerAccountNumbers {
    accountNumber: string;
    accountId: string;
    suffix: string;
    contactEmail: string;
}

export class CLSCustomerContactDetails {
    contactName: string;
    email: string;
    phoneNumber: string;
}

export class CLSCustomerInternalContactDetails {
    contactName: string;
    email: string;
}

export class CLSCustomerOthers {
    combineATSsAcrossLAccounts: boolean;
    recordCountOnOutput: string;
    itemTag: string;
    fileFormat: string;
    subfieldsShouldBeRemoved949: string;
    alphaToNumericSubfield: AlphaToNumericSubfield[] = [];
    renumberTag: RenumberTag[] = [];
    retain9XXTags: any;
    sendEmailNotificationToCustomer :boolean;
    isMarcValidations : boolean;
    environmentSettings:MarcEditorSettings;
}

export class AlphaToNumericSubfield {
    tag: string;
    alphaSubfield: string;
    numericSubfield: string;
}

export class RenumberTag {
    tagFrom: string;
    tagTo: string;
}

export class OCLCCustomerConfiguration {
    holdingCode: string;
    projectId: string;
    isScheduled: boolean;
    scheduledInfo: ScheduledInfo;
}

export class ScheduledInfo {
    type: string;
    dateOfWeek: string;
    startDateTime: Date;
}

export class CLSCustomerLabelConfiguration {
    id: string;
    customerId: string;
    customerName: string;
    barcodeComment: string;
    barcodeSymbology: string;
    barcodeSubFieldIn949: string;
    templateOverwrite: boolean;
    displayHumanReadableCheckDigit: boolean;
    checkDigit: boolean;
    spineLabel: LabelPrintConfiguration;
    oneLineSpineLabel: LabelPrintConfiguration;
    eyeReadableBarcode: LabelPrintConfiguration;
    branchLabel: LabelPrintConfiguration;
    labelConfigurations: LabelConfiguration[];
    createdBy: string;
    lastModifiedBy: string;
}

export class LabelConfiguration {
    labelType: LabelType;
    labelPrintConfiguration: LabelPrintConfiguration;
    labelFields: LabelField[];
    orderDisplayFields: OrderDisplay[];
    fontConfiguration: FontConfiguration[];
}

export class OrderDisplay {
    displayName: string;
    displayOrder: number;

}

export class LabelField {
    displayName: string;
    tag: string;
    subField: string;
    isChecked: boolean
}

export class LabelPrintConfiguration {
    font: string;
    fontSize: number;
    fontWeight: string;
    alignment: string;
}

export class FontConfiguration {
    font: string;
    fontSize: number;
    maxLines: number;
    maxChars: number;
}

export enum LabelType {
    Bibliographic = "Bibliographic",
    Alpha1 = "Alpha1",
    Alpha2 = "Alpha2",
    Genre = "Genre",
    Misc = "Misc",
    LibraryName = "LibraryName"
}

export interface LabelFontFamily {
    key: string,
    name: string
}

export interface LabelFontSize {
    key: number,
    name: number
}

export interface LabelFontWeight {
    key: string,
    name: string
}

export interface LabelFontAlignment {
    key: string,
    name: string
}

export interface BarCodeSymbology {
    key: string,
    name: string
}

export class CustomerMasterAccount {
    masterAccount: string;
    customerId: string;
    customerName: string;
    mainAccounts: MainAccount[];
    id: string;
}

export class MainAccount {
    customerName?: string;
    accountNumber: string;
    accountName: string;
    id: string;
}

export class Customers {
    id: string;
    customerName: string;
    //selectedAccounts: string[];
    institutionId: string;
    selectedIds: string[];
    selectedCustomerIds: string[];
    createdBy?: string;
    createdDate?: Date;
    lastModifiedBy?: string;
    lastModifiedDate?: Date;
}
export class CustomerInstitution{
    id:string;
    customerName:string;
    selectedIds:string[];
    selectedCustomerIds:string[];
    institutionId:string;
}

export class CustomerModel {
    customerId: string;
    customerName: string;
    institutionId :string;
    HasSettings:boolean;
    isSelected:boolean = false;
    // selectedAccounts: string[];

}

export class LabelExtractLog {
    CustomerId: string;
    CustomerName: string;
    AtsNumbers: string[];
    extractedBy: string;
    LabelExtractCount: number;
    //InCompleteRecords : Map<number, Array<string>>;
    InCompleteRecords: { [key: number]: string[]; }
    // IncompleteRecords
    NonMatchedATSNumbers: string[];
}

export class InCompleteRecords {
    record: number;
    name: Array<string>;
}


export class LabelExtractConfig {
    id: string;
    customerId: string;
    customerName: string;
    atsNumbers: string[];
    labelExtractConfigNotification: LabelExtractConfigNotification
}

export class LabelExtractConfigNotification {
    atsNumbers: string[];
    labelExtractConfigNotificationRecords: LabelExtractConfigNotificationRecord[];

}
export class LabelExtractConfigNotificationRecord {
    recordNumber: string;
    missingMandatoryField: string;
}
export class CLSMARCOutProcessExtractLog {
    CustomerId: string;
    CustomerName: string;
    AtsNumbers: string[];
    extractedBy: string;
    InCompleteRecords: { [key: number]: string[]; }
    NonMatchedATSNumbers: string[];
    CLSMarcOutFiles: FileName[];
    ErrorMessage:string;
}

export class FileName {
    FileName: string;
    RecordsCount: string;
    NumberOf949TagsInFile: string;
    AccountNumber: string;
}

export class ATSReviewFields {
    label: string;
    tag: string;
    subFieldCode: string;
    isLabelValid: boolean;
    isTagValid: boolean;
    isSubFieldValid: boolean;
    editable: boolean;
    isNew: boolean;
}

export class OCLCExportState {
    customerId: string;
    customerName: string;
    startDateTime: Date;
    endDateTime: Date;
    userStartDateTime: string;
    userEndDateTime: string;
    extractedBy: string;
    extractCount: number;
    error: string;
}
export class UnFlipRecordsRequest {
    CustomerId: string;
    CustomerName: string;
    AtsNumbers: string[];
    NonMatchedATSNumbers: string[];

}

export class CLSExtractOrderProcessLog {
    customerId: string;
    customerName: string;
    accountNumber: string;
    atsNumber: string;
    startDate: string;
    endDate: string;
    generatedType: string;
    outputFileName: string;
    noOfBibRecords: number;
    noOfItemRecords: number;
    error: string;
}

export class NOSProcessLog{
    fileName: string;
    startDate: string;
    endDate: string;
    atsNumber: string;
    noOfBibRecords: number;
    noOfItemRecords: number;
    error: string;
}
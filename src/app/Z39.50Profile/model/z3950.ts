export class Z3950Profile{
    id : string;
    isActive : boolean;
    isDeleted:boolean;
    customerName : string;
    profileName? : string;
    profileDescription : string;
    databaseName : string;
    loginOptions : LoginOption[];
    hostAddress : string;
    portNumber : string;
    searchDatabase : string;
    isSearchTypeBib : boolean;
    attributeOptions : AttributeOption[];  
    createdBy: string;
    createdDate: Date;    
    lastModifiedBy: string;
    lastModifiedDate: Date;
    NonEncrypt: boolean;
    inBoundSource:string;
}

export class LoginOption {
    loginType: string;
    userId: string;
    password: string;
}

export class AttributeOption {
    searchType: string;
    attributes: Attributes[];
    type: string;
}

export class Attributes {
   attributename : string;
   description : string;
   value : string;  
}
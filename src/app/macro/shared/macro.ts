import { Marc } from 'src/app/marc/shared/marc';

export class Macro { 
    [x: string]: any;
    id: string;
    name: string;
    fileName:string;
    filePath:string;
    inputVariables:InputParameters[];
    description: string;
    type: string;
    level: string;
    institution: string;
    clsCustomer : string;
    keyAssignment:string;
    dependency:string;
    variables: string;
    macroDetails : any;
    isActive: boolean;
    createdBy: string;
    createdDate: Date;
    lastModifiedBy: string;
    lastModifiedDate: Date;
    lastModifiedDateString:string;
    customerOnly: boolean;
    macroName: string;
} 

export class InputParameters{
    variableName:string;
    variableValue:string;
}

export class MacroRequest{
    MacroName :string;
    MarcItem  : Marc;
}

export class ViewMacro { 
    [x: string]: any;
    id: string;
    name: string;
    description: string;
    type: string;
    level: string;
    institution: string;
    clsCustomer : string;
    keyAssignment:string;
    dependency:string;
    variables: string;
    macroDetails : any;
    isActive: boolean;
    lastUsedDateTime: Date;
    createdBy: string;
    createdDate: Date;
    lastModifiedBy: string;
    lastModifiedDate: Date;
    lastModifiedDateString:string;
    lastUsedDateString:string;
} 

export class FilterParams{
    type: string;
    local:boolean;
    global:boolean;
    institutional:boolean;
    institution: string;
    search: string;
}

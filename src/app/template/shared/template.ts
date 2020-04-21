import { MarcField } from 'src/app/marc/shared/marc';

export class Template { 
    [x: string]: any;
    id: string;
    name: string;
    description: string;
    type: string;
    level: string;
    institution: string;
    fields: MarcField[] = [];
    isActive: boolean;
    createdBy: string;
    createdDate: Date;
    lastModifiedBy: string;
    lastModifiedDate: Date;
    lastModifiedDateString:string;
} 

export class ViewTemplate { 
    [x: string]: any;
    id: string;
    name: string;
    description: string;
    type: string;
    level: string;
    institution: string;
    fields: MarcField[] = [];
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
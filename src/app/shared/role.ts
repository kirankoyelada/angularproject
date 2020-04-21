
export class Role {
    code: string;
    name: string;
    isActive: boolean;
    permissions:string[];
    catalogs:string[];
    sortOrder: number;
    isPartial: boolean;
}

export class Permission {
    code: string;
    name: string;
    isActive: boolean;
    sortOrder: number;
}

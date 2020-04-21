
import { MarcSubField, MarcField, Marc, MarcBibSubElements, MarcIndicator, MarcBibData, MarcEditorSettings, Z3950AttributeOptions, AttributeValues, TimeOut, TemplateType, SystemSettings } from '../marc/shared/marc';
import { Template } from '../template/shared/template';
import { Constants } from '../constants/constants';

// View model for the Marc
export class MarcDTO {
  id: string;
  fields: MarcFieldDTO[];
  recordNumber: number;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
  isActive: boolean;
  isBTCATMain: boolean;
  isSaveToBTCATMain: boolean;
  RecordControlNumber:string;
  customerId: string;
  static fromSource(json: Marc, delimiter: string = ''): MarcDTO {
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      createdBy: json.createdBy,
      fields: json.fields.map((x, index) => {
        // tslint:disable-next-line: no-use-before-declare
        return MarcFieldDTO.fromSource(x, index, delimiter);
      }),
      createdDate: json.createdDate,
      id: json.id,
      isActive: json.isActive,
      isBTCATMain: json.isBTCATMain,
      lastModifiedBy: json.lastModifiedBy,
      lastModifiedDate: json.lastModifiedDate,
      recordNumber: json.recordNumber,
      isSaveToBTCATMain: false,
      RecordControlNumber:json.RecordControlNumber,
      customerId: json.customerId
    };
  }
}
// View model for the MarcField
export class MarcFieldDTO {
  id: string;
  tag: string;
  data: string;
  type: string;
  ind1: string;
  ind2: string;
  subfields: MarcSubFieldDTO[];
  subelements?: MarcSubElementsDTO[];
  color: string;
  subFieldDescription: string;
  isValid: boolean;
  // TODO: State shouldn't be handled in the dto
  isIndi1valid: boolean;
  isIndi2valid: boolean;
  isSubfieldValid: boolean;
  isValidData: boolean;
  originalData: string;
  // Custom Fields
  isFieldEditable: boolean;
  // TODO: Remove this property
  isFieldExpanded: boolean;
  // Use this instead of isFieldExpanded, which looks like the state
  isFieldExpandable: boolean;
  isLeaderCtrlField: boolean;
  // TODO: Change in Cosmos DB System Settings
  isSystemGenerated: boolean;
  // TODO: Not needed
  // isCreateAllowed: boolean;
  isDeleteDisabled: boolean;
  authorityId: string;
  errMsg: string;
  ind1ErrMsg: string;
  ind2ErrMsg: string;
  isTagChanged: boolean;
  isInd1Changed: boolean;
  isInd2Changed: boolean;
  isSubFieldChanged: boolean;
  isNew: boolean;
  static fromSource(json: MarcField, index: number, delimiter: string = ''): MarcFieldDTO {
    if (json === undefined) {
      return undefined;
    }

    if (json === null) {
      return null;
    }

    return {
      authorityId: '',
      color: json.color,
      data: json.data,
      id: `${json.tag}-${index}`,
      ind1: json.ind1 ? json.ind1 : '',
      ind2: json.ind2 ? json.ind2 : '',
      isFieldEditable: (json.tag === 'Leader' || json.tag === '997' || json.type === 'controlfield') ? false : true,
      // TODO need to remove this//Added Compoenent level
      isFieldExpanded: false, // (json.tag === 'Leader' || json.tag === '997' || json.type === 'controlfield') ? false : true,
      // TODO: Change in Cosmos DB System Settings
      isFieldExpandable: (json.tag === 'Leader' || json.tag === '006' || json.tag === '007' || json.tag === '008') ? true : false,
      // TODO: Change in Cosmos DB System Settings
      isLeaderCtrlField: (json.type === 'controlfield' || json.tag === 'Leader') ? true : false,
      // TODO: Change in Cosmos DB System Settings
      isSystemGenerated: Constants.SystemGeneratedTags.find(a => a === json.tag),
      // TODO: Change in Cosmos DB System Settings
      // isCreateAllowed: Constants.NotAllowedTagsInCreate.find(a => a === json.tag),
      isDeleteDisabled: this.checkIfDisabled(json) ? true : false,
      isValid: json.isValid ? json.isValid : true,
      isIndi1valid: true,
      isIndi2valid: true,
      isSubfieldValid: true,
      isValidData: json.isValidData ? json.isValidData : true,
      originalData: (json.tag === 'Leader' || (json.type && json.type === 'controlfield')) ? json.data : json.originalData,
      subFieldDescription: this.getSubFieldDescription(json, delimiter),
      // tslint:disable-next-line: no-use-before-declare
      subfields: json.subfields ? json.subfields.map((x, indx) => MarcSubFieldDTO.fromJSON(x, indx)) : null,
      subelements: null,
      tag: json.tag,
      type: json.type,
      errMsg: '',
      ind1ErrMsg: '',
      ind2ErrMsg: '',
      isTagChanged: false,
      isInd1Changed: false,
      isInd2Changed: false,
      isSubFieldChanged: false,
      isNew: false,
    };
  }
  private static checkIfDisabled(json: MarcField): boolean {
    if ((json.tag === 'Leader' || json.tag === '997' || json.type === 'controlfield')
      && json.tag === 'Leader' || json.tag === '006' || json.tag === '007' || json.tag === '008' ||
      json.tag === '001' || json.tag === '005' || json.tag === '003' || json.tag === '997') {
      return true;
    }
    return false;
  }
  private static getSubFieldDescription(field: MarcField, delimiter: string = ''): string {
    if (field.tag === 'Leader') {
      return field.data ? field.data.substring(5, 10) + field.data.substring(17, 20) : '';
    } else if (field.type && field.type === 'controlfield') {
      return field.data;
    } else {
      return (field.subfields && field.subfields.length !== 0) ? field.subfields.map(x => `${delimiter}${x.code}${x.data}`).join('') : ''; // Removing the space between subfields.
    }
  }
}
// View model for the MarcSubField
export class MarcSubFieldDTO {
  id: string;
  code: string;
  data: string;
  authorityId: string;
  static fromJSON(json: MarcSubField, index: number): MarcSubFieldDTO {
    if (json === undefined) {
      return undefined;
    }

    if (json === null) {
      return null;
    }

    return {
      authorityId: json.authorityId,
      code: json.code,
      data: json.data,
      id: `${json.code}-${index}`
    };
  }
}

export class EditTagDTO {
  tag: string;
  type: string;
  description: string;
  isObsolete: boolean;
  isRepeatable: boolean;
}
export interface CopyPasteEventParams {
  action: string;
  copyPositions?: number[];
  pastePositions?: number[];
  replacePositions?: boolean;
}
export interface EventParams {
  controlName: string;
  position: any;
  action: string;
  controlPosition?: number;
}
export interface MarcFieldUpdateEventParams {
  field: MarcFieldDTO;
  position: any;
  action: string;
}

// View model for the Marc
export class TemplateDTO {
  id: string;
  fields: MarcFieldDTO[];
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
  isActive: boolean;
  name: string;
  type: string;
  level: string;
  description: string;
  institution: string;
  static fromSource(json: Template, delimiter: string = ''): TemplateDTO {
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      createdBy: json.createdBy,
      fields: json.fields ? json.fields.map((x, index) => {
        // tslint:disable-next-line: no-use-before-declare
        return MarcFieldDTO.fromSource(x, index, delimiter);
      }) : [],
      createdDate: json.createdDate,
      id: json.id,
      isActive: json.isActive,
      lastModifiedBy: json.lastModifiedBy,
      lastModifiedDate: json.lastModifiedDate,
      name: json.name,
      type: json.type ? json.type : '',
      level: json.level ? json.level : '',
      description: json.description,
      institution: json.institution
    };
  }
}


export class MarcSubElementsDTO {
  defaultValue?: string;
  description?: string;
  element?: string;
  isEditable?: boolean;
  isvisible?: boolean;
  isValid?: boolean;
  length?: string;
  materialType?: MaterialTypeDTO[];
  repeatable?: boolean;
  validationRules: string[];
  values?: ValueDTO[];
  static fromSource(value: string, subElement: MarcBibSubElementsDTO): MarcSubElementsDTO {
    if (!value || !subElement) {
      return;
    }
    const marcSubElement = new MarcSubElementsDTO();
    if (subElement) {
      // marcSubElement.defaultValue = subElement.defaultValue ? subElement.defaultValue : '';
      marcSubElement.description = subElement.description;
      marcSubElement.element = subElement.element;
      marcSubElement.isEditable = subElement.isEditable;
      marcSubElement.isValid = subElement.isValid;
      marcSubElement.isvisible = subElement.isvisible;
      marcSubElement.length = subElement.length;
      marcSubElement.materialType = subElement.materialType;
      marcSubElement.repeatable = subElement.repeatable;
      marcSubElement.validationRules = subElement.validationRules;
      marcSubElement.values = subElement.values;
      if (+subElement.length > 1) {
        const charArray = subElement.element.split('-');
        const data = value.substring(
          +charArray[0],
          +charArray[1] + 1
        );
        marcSubElement.defaultValue = data.trim();
      } else {
        const data = value.charAt(+subElement.element);
        marcSubElement.defaultValue = data.trim() !== '' ? data : data.trim();
      }
    }


    return marcSubElement;
  }
}


// View model for MarcBibData

export class SystemSettingsDTO {
  MarcEditorSettings: MarcEditorSettings;
  BibMarcData: MarcBibDataDTO[];
  Z3950AttributeOptions: Z3950AttributeOptions;
  Z3950SearchType: AttributeValues[];
  TimeOut: TimeOut;
  TemplateTypes: TemplateType[];
  static fromSource(json: SystemSettings): SystemSettingsDTO {
    return {
      MarcEditorSettings: json.MarcEditorSettings,
      BibMarcData: json.BibMarcData.map(data => MarcBibDataDTO.fromSource(data)),
      Z3950AttributeOptions: json.Z3950AttributeOptions,
      Z3950SearchType: json.Z3950SearchType,
      TimeOut: json.TimeOut,
      TemplateTypes: json.TemplateTypes
    };
  }
}

export class MarcBibDataDTO {
  description: string;
  ind1: MarcIndicator[];
  ind2: MarcIndicator[];
  isExpandable: boolean;
  // TODO: Not sure why isObsolete is needed in the master data from server
  isObsolete: boolean;
  repeatable: boolean;
  subfields: MarcBibSubfieldsDTO[];
  subElements: MarcBibSubElementsDTO[];
  tag: string;
  type: string;
  static fromSource(json: MarcBibData): MarcBibDataDTO {
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      description: json.description,
      ind1: json.ind1,
      ind2: json.ind2,
      isExpandable: json.isExpandable,
      isObsolete: json.isObsolete,
      repeatable: json.repeatable,
      subElements: json.subElements.map((x, index) => {
        // tslint:disable-next-line: no-use-before-declare
        return MarcBibSubElementsDTO.fromSource(x);
      }),
      subfields: json.subfields,
      tag: json.tag,
      type: json.type
    };
  }
}

export interface MarcIndicatorDTO {
  code: string;
  description: string;
  // TODO: As per master data bo isObsolete flag for indicator
  isObsolete: boolean;
}

export class MarcBibSubfieldsDTO {
  code: string;
  description: string;
}

export class MarcBibSubElementsDTO {
  defaultValue?: string;
  // value: string;
  description?: string;
  element?: string;
  isEditable?: boolean;
  isvisible?: boolean;
  isValid?: boolean;
  length?: string;
  materialType?: MaterialTypeDTO[];
  repeatable?: boolean;
  validationRules?: string[];
  values?: ValueDTO[];
  static fromSource(json: MarcBibSubElements): MarcBibSubElementsDTO {
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
      defaultValue: json.defaultValue,
      // value: '',
      description: json.description,
      element: json.element,
      isEditable: json.isEditable,
      isValid: json.isValid,
      isvisible: json.isvisible,
      length: json.length,
      materialType: json.materialType,
      repeatable: json.repeatable,
      validationRules: json.validationRules,
      values: json.values
    };
  }
}

export class MaterialTypeDTO {
  materialType: string;
  type: string;
  relativefields: RelativeFieldDTO[];
}

export class RelativeFieldDTO {
  defaultValue?: string;
  description?: string;
  element?: string;
  isEditable?: boolean;
  isvisible?: boolean;
  isValid?: boolean;
  length?: string;
  materialType?: MaterialTypeDTO[];
  repeatable?: boolean;
  validationRules?: string[];
  values?: ValueDTO[];
  static fromSource(json: RelativeFieldDTO): MarcSubElementsDTO {
    if (json === undefined) {
      return undefined;
    }
    if (json === null) {
      return null;
    }
    return {
    defaultValue: json.defaultValue ? json.defaultValue : '',
    description: json.description,
    element: json.element,
    isEditable: json.isEditable,
    isValid: json.isValid,
    isvisible: json.isvisible,
    length: json.length,
    materialType: json.materialType,
    repeatable: json.repeatable,
    validationRules: json.validationRules,
    // tslint:disable-next-line: no-unused-expression
    values: json.values
    };
  }
}

export class ValueDTO {
  code?: string;
  description?: string;
  isDisable?: boolean;
  materialType?: string;
}




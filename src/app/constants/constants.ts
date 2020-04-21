export const Constants: any = {
  BIBLIOGRAPHIC: "bibliographic",
  AUTHORITY: "authority",
  ALL: 'all',
  Search: {
    ISBN: 'ISBN',
    UPC: 'UPC',
    LCCN: 'LCCN',
    TITLE: 'Title',
    KEYWORD: 'Keyword',
    AUTHOR: 'Author',
    SERIES: 'Series',
    AUTHORORTITLE: 'AuthororTitle',
    RECORDCONTROLNUMBER: 'RecordControlNumber',
    RECORDNUMBER: 'RecordNumber',
    CONTROLNUMBER: 'ControlNumber',
    PUBLICATION: 'Publication',
    FORMAT: 'Format',
    ENCODING: 'Encoding',
    CALLNUMBER: 'CallNumber',
    PUBLICATIONYEAR: 'PublicationYear',
    ENCODINGLEVEL: 'EncodingLevel',
    RECORDSOURCE: 'RecordSource',
    LANGUAGE: 'Language',
    AUDIENCE: 'Audience',
    SUBJECT: 'Subject',
    LC_CLASSIFICATION: 'LCClassification',
    PUBLISHER: 'Publisher',
    PUBDATE: 'PubDate',
    DATABASE_RECORD_NUMBER: 'DatabaseRecordNumber',
    DEWEYABRIDGED: 'DeweyAbridged',
    DEWEYUNABRIDGED: 'DeweyUnabridged',
    ANSCR: 'ANSCR',
    ISSN: 'ISSN',
    ENCODINGFACET: 'Encoding'
  },
  SearchType: {
    BEGINS: 'Begins',
    PHRASE: 'Phrase',
    EXACT: 'Exact',
    BROWSE: 'Browse',
    HEADING: 'Heading',
    WORD: 'Word',
    RANGE: 'Range'
  },
  Styles: {
    SHOWMORE_HEIGHT: '100%',
    SHOWMORE_HEIGHT_75: '75px',
    SHOWMORE_HEIGHT_300: '300px',
    SHOWLESS_HEIGHT: '75px',
    SHOWLESS_HEIGHT_85: '85px',
    SUBFIELD_TEXTAREA_HEIGHT: 30
  },
  ToolTip: {
    CHKBOX_MAX_SELECT_WARN: 'Maximum records limit reached',
    CHKBOX_DEFAULT: 'Select record to compare'
  },
  Sort: {
    ASC: 'asc'
  },
  LocalStorage: {
    CURRENTUSER: 'currentUser',
    BIBSEARCHREQUEST: 'searchRequest',
    ACTOR: 'actor',
    CUSTOMERID: 'CustomerID',
    MARCSETTINGS: 'marcSettings',
    ADDMORESETTINGS: 'addMoreSettings',
    MARCBIBDATA: 'marcBibData',
    EXPANDSEARCH: 'expandSearch',
    ADDMORECOLUMNS: 'addMoreColumns',
    SAVECATALOGITEMS: 'saveCatalogItems',
    Z3950ATTRIBUTEOPTIONS: 'z3950AttributeOptions',
    Z3950SEARCHTYPE: 'z3950SearchType',
    AUTHSEARCHREQUEST: 'authSearchRequest',
    SEARCHZ3950REQUEST: 'searchZ3950Request',
    CURRENTSEARCH: 'CurrentSearch',
    TEMPSEARCHREQUEST: 'tempSearchRequest',
    TEMPSEARCHZ3950REQUEST: 'tempSearchZ3950Request',
    DATATABLESSEARCHGRID: 'DataTables_searchGrid_/',
    TEMPACTOR: 'tempactor',
    TEMPLATES: 'templates',
    TEMPLATETYPES: 'templateTypes',
    TIMEOUT: 'timeOutDetails',
    FORMAUTH: "fromAuthToBasic",
    CLEARSEARCH: "clearSearch",
    DBRECSEARCHRQ: "dbRecNumSearchReq",
    ROLES: "roles",
    PERMISSIONS: "permissions",
    AUTHTOKEN: "authToken",
    USERNAME: "UserName",
    USERDISPLAYNAME:"UserDisplayName",
    USER: "User",
    ASSOCIATEDCUSTOMERS:"associatedCustomers",
    EXPORTMARCCONFIGDATA: "exportMarcConfigData",
    SELECTEDMARCRECORDS:"selectedMarcRecords",
    COMPAREMARCRECORDS:"compareMarcRecords",
    CLSCustomerLabelDefaultConfiguration:"CLSCustomerLabelDefaultConfiguration",
    ATSREVIEWFIELDS:"atsReviewFields",
    DEFAULTCATALOGS:"defaultCatalogs",
    ALLCATALOGS:"allCatalogs",
    CUSTOMERNAME:"customerName",
    ATSREVIEWRECORDS:"atsreviewids",
    COPIEDMARCFIELDS:"copiedMARCFields",
    COPIEDTEMPLATEFIELDS:"copiedTemplateFields",
    ATSREVIEWCOLUMNS: "atsReviewColumns",
    USERROLE: "userRole",
    ROLEBASEDMACROS: "roleBasedMacros",
    ISMARC21VALIDATIONS:"isMarc21Validations",
    USERDATAREFRESH: "CurrentUserRefreshTime",
    CUSTOMERDATAREFRESH: "CustomersRefreshTime",
    CUSTOMERSALL:"customersAll",
    BARCODESUBFIELDIN949:"barcodeSubFieldIn949",
    DELETEDDBCHECKED : "deletedDbChecked",
    FONTFAMILIES:"fontFamilies",
    DEFAULTENVSETTINGS:"DefaultEnvSettings",
    INSTITUTIONID:'InstitutionId'
  },
  ENTERKEY: 'Enter',
  TABKEY: 'Tab',
  FOCUS: 'focus',
  DELETEDDBPROFILENAME: 'Deleted DB',
  ControlFields: ['001', '003', '005', '006', '007', '008'],
  EncodingText: {
    OTHER: 'Other',
    PREPUB: 'Pre-Pub',
    CORE: 'Core',
    FULL: 'Full',
    LEVELTWO: '2',
    LEVELTHREE: '3',
    LEVELFIVE: '5',
    LEVELSEVEN: '7',
    LEVELM: 'M',
    LEVELJ: 'J',
    LEVELK: 'K',
    LEVELEIGHT: '8',
    LEVELFOUR: '4',
    LEVELBLANK: '',
    LEVELONE: '1',
    LEVELI: 'I',
    LEVELUNASSIGNED: 'U',
    LEVELNOTAPPLICABLE: 'N',
    UNASSIGNED: 'UnAssigned',
    NOTAPPLICABLE: 'NotApplicable'
  },

  Facets: {
    PUBDATE: 'Pub Date',
    FORMAT: 'Format',
    SUBJECT: 'Subject',
    AUTHOR: 'Author',
    SERIES: 'Series',
    ENCODINGLEVEL: 'Encoding Level',
    RECORDSOURCE: 'Record Source',
    LANGUAGE: 'Language',
    AUDIENCE: 'Audience',
    PUBLISHER: 'Publisher'
  },
  MandatoryTags: [
    {
      tag: "Leader",
      subFields: null,
      subElementsPos: ['0-4', '5', '6', '7', '17', '18']
    },
    {
      tag: "008",
      subFields: null,
      subElementsPos: ['0-5']
    },
    {
      tag: "040",
      subFields: [
        'a', 'c'
      ],
    },
    {
      tag: "245",
      subFields: [
        'a'
      ],
    },
    {
      tag: "260",
      subFields: [
        'c'
      ],
    },
    {
      tag: "300",
      subFields: [
        'a'
      ],
    },
  ],
  lengthValidations: [
    {
      tag: '020',
      subFields: [
        {
          code: 'a',
          minLength: 10,
          maxLength: 13,
        },
        {
          code: 'z',
          minLength: 10,
          maxLength: 13,
        },
      ]
    },
    {
      tag: '022',
      subFields: [
        {
          code: 'a',
          minLength: 9,
          maxLength: 9,
        },
      ],
    },
    {
      tag: '024',
      subFields: [
        {
          code: 'a',
          minLength: 12,
          maxLength: 12,
        },
      ],
      indicator: 1
    },
    {
      tag: '024',
      subFields: [
        {
          code: 'a',
          minLength: 14,
          maxLength: 14,
        },
      ], indicator: 7
    }
  ],

  validateISBNUPCData(subFieldCode, data, field) {
    let returnVal = true;
    let tagValidationData = this.lengthValidations.filter(h =>
      h.tag.includes(field.tag) && h.subFields.find(a => a.code == subFieldCode)
    );
    if (data && data.trim() != '' && field.tag != '024' && tagValidationData && tagValidationData.length > 0 && tagValidationData[0] && tagValidationData[0].subFields[0]) {
      const validationData = tagValidationData[0];
      if (data && data != null && !(data.length == validationData.subFields[0].minLength || data.length == validationData.subFields[0].maxLength)) {
        returnVal = false;
      } else {
        if (field.tag === '020') {
          if (!this.validateISBN(data)) {
            returnVal = false;
          }
        }
        if (field.tag === '022') {
          if (!this.validateISSN(data)) {
            returnVal = false;
          }
        }
      }
    } else if (data && data.trim() != '' && field.tag == '024' && tagValidationData && tagValidationData.length > 0 && tagValidationData[0] && tagValidationData[0].subFields[0]) {
      const validationData = tagValidationData.find(a => a.indicator == field.ind1);
      if (validationData && data && data != null && !(data.length == validationData.subFields[0].minLength || data.length == validationData.subFields[0].maxLength)) {
        returnVal = false;
      } else {
        if (!this.validateUPC(data)) {
          returnVal = false;
        }
      }
    }
    return returnVal;
  },
  validateISBN(isbnValue: string) {
    if (isbnValue.length == 10) {
      return this.validate10DigitISBN(isbnValue);
    } else {
      return this.validate13DigitISBN(isbnValue);
    }
  },
  validateUPC(upcValue: string) {
    if (upcValue.length == 12) {
      return this.validate12DigitUPC(upcValue);
    } else {
      return this.validate14DigitUPC(upcValue);
    }
  },
  validateISSN(issnValue: string) {
    // ISSN format :example: 0397-0639
    if (/^\d{4}-\d{3}[X0-9]$/.test(issnValue)) {
      issnValue = issnValue.replace('-', '');
      let checkValue;
      let digitToCheck = issnValue[7];
      issnValue = issnValue.slice(0, 7); // Take the first seven digits of the ISSN
      let weightingFactors = [8, 7, 6, 5, 4, 3, 2]; // Take the weighting factors
      let sum = 0;
      let i: number;
      // Multiply each digit in turn by its weighting factor and add them together
      for (i = 0; i < issnValue.length; i++) {
        sum += parseInt(issnValue[i]) * weightingFactors[i];
      }
      let remainder = sum % 11;
      if (remainder == 0) {
        checkValue = 0;
      } else {
        checkValue = 11 - (sum % 11);
        if (checkValue == 10) {
          checkValue = 'X';
        }
      }
      return (checkValue == digitToCheck);
    } else {
      return false;
    }
  },
  // validate 10 digit isbn
  validate10DigitISBN(isbnValue: string) {
    let checkValue;
    let weight = 10;    // multiplication first starts with 10
    let sum = 0;
    let digitToCheck = isbnValue[9];
    // taking the first nine digits
    isbnValue = isbnValue.slice(0, 9);
    // multiplying
    let i: number;
    // The first, leftmost, digit of the isbnValue is multiplied by ten,
    // then working from left to right, each successive digit is multiplied by one less than the one before.
    for (i = 0; i < isbnValue.length; i++) {
      // Each of the nine products calculated is added together
      sum += parseInt(isbnValue[i]) * (weight - i);
    }
    let remainder = sum % 11;
    if (remainder == 0) {
      checkValue = 0;
    } else {
      checkValue = 11 - (sum % 11);
      if (checkValue == 10) {
        checkValue = 'X';
      }
    }
    return (checkValue == digitToCheck);
  },
  // validate 13 digit isbn
  validate13DigitISBN(isbnValue: string) {
    let checkValue;
    let sum = 0;
    let digitToCheck = isbnValue[12];
    // taking the first nine digits
    isbnValue = isbnValue.slice(0, 12);
    // multiplying
    let i: number;
    for (i = 0; i < isbnValue.length; i++) {
      if (i % 2 == 1) {
        sum += 3 * parseInt(isbnValue[i]);
      } else {
        sum += parseInt(isbnValue[i]);
      }
    }
    checkValue = (10 - (sum % 10)) % 10;
    return (checkValue == digitToCheck);
  },
  // validate 12 digit UPC
  validate12DigitUPC(upcValue: string) {
    let digitToCheck = upcValue[11];
    upcValue = upcValue.slice(0, 11);
    let oddDigitsSum = 0;
    let evenDigitSum = 0;
    let sum = 0;
    let checkValue;
    let i;
    for (i = 0; i < upcValue.length; i++) {
      if (i % 2 == 1) {
        oddDigitsSum += parseInt(upcValue[i]);
      } else {
        evenDigitSum += parseInt(upcValue[i]);
      }
    }
    evenDigitSum = 3 * evenDigitSum;
    sum = oddDigitsSum + evenDigitSum;
    checkValue = (10 - (sum % 10)) % 10;
    return (checkValue == digitToCheck);
  },
  // validate UPC
  validate14DigitUPC(upcValue: string) {
    let digitToCheck = upcValue[13];
    upcValue = upcValue.slice(0, 13);
    let oddDigitsSum = 0;
    let evenDigitSum = 0;
    let sum = 0;
    let checkValue;
    let i;
    for (i = 0; i < upcValue.length; i++) {
      if (i % 2 == 1) {
        oddDigitsSum += parseInt(upcValue[i]);
      } else {
        evenDigitSum += parseInt(upcValue[i]);
      }
    }
    evenDigitSum = 3 * evenDigitSum;
    sum = oddDigitsSum + evenDigitSum;
    checkValue = (10 - (sum % 10)) % 10;
    return (checkValue == digitToCheck);
  },
  SystemGeneratedTags: ['000', '001', '005', '997'],
  SystemGeneratedTagsInOverride: ['Leader', '000', '005', '997'],
  SystemGeneratedTagsInCreate: ['010', '919'],
  RecordLengthWarningMessage: 'The length of the record has exceeded the maximum limit of 5000 bytes. Do you still want to proceed?',
  ISBNUPCISSNWarningMessage: 'The record contains invalid {0}. Do you still want to proceed?',
  TaglengthToValidate: [
    {
      tag: '020',
      subField: 'a'
    },
    {
      tag: '020',
      subField: 'z'
    },
    {
      tag: '022',
      subField: 'a'
    },
    {
      tag: '024',
      subField: 'a',
      indicator: '1'
    },
    ,
    {
      tag: '024',
      subField: 'a',
      indicator: '7'
    }
  ],
  Permissions: {
    SRC_BIB_MN: "SRC_BIB_MN",
    SRC_BIB_WS: "SRC_BIB_WS",
    EDT_BIB_MN: "EDT_BIB_MN",
    EDT_BIB_WS: "EDT_BIB_WS",
    CLN_BIB_MN: "CLN_BIB_MN",
    CLN_BIB_WS: "CLN_BIB_WS",
    DEL_BIB_MN: "DEL_BIB_MN",
    DEL_BIB_WS: "DEL_BIB_WS",
    CRT_BIB_MN: "CRT_BIB_MN",
    CRT_BIB_WS: "CRT_BIB_WS",
    MRG_REC: "MRG_REC",
    CRT_MAC: "CRT_MAC",
    IE_MAC: "IE_MAC",
    EDT_IMAC: "EDT_IMAC",
    EDT_LMAC: "EDT_LMAC",
    DEL_IMAC: "DEL_IMAC",
    DEL_LMAC: "DEL_LMAC",
    RUN_MAC: "RUN_MAC",
    ASS_MAC: "ASS_MAC",
    ASS_IMAC: "ASS_IMAC",
    ASS_LMAC: "ASS_LMAC",
    CED_GTEMP: "CED_GTEMP",
    CED_ITEMP: "CED_ITEMP",
    CED_LTEMP: "CED_LTEMP",
    CED_Z395: "CED_Z395",
    SET_LDATA: "SET_LDATA",
    SET_MDATA: "SET_MDATA",
    BT_EXT: "BT_EXT",
    OCL_EXT: "OCL_EXT",
    CLS_EXT: "CLS_EXT",
    CRT_RPT: "CRT_RPT",
    EDT_RPT: "EDT_RPT",
    UNF_MARC: "UNF_MARC",
    ACC_REC: "ACC_REC",
    CON_USR: "CON_USR",
    ATS_REV: "ATS_REV"
  }
}

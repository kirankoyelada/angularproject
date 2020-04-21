import { Z3950Profile } from '../Z39.50Profile/model/z3950';

export class BasicSearchRequest {
  SearchRequest: BasicSearch[];
}

export class BasicSearch {
  searchBy: string;
  term: string;
  type: string;
  profiles:string[];
  facetValue: FacetDetails;
  authSearch: boolean = false;
  customerId: string;
  UserPermissions: string[];
}

export class FilterZ3950Params {
  profileName: string;
  isChecked:boolean;
  totalRecords:number;
  matchedRecords:number;
  hostAddress:string;
  displayProfileName:string
}

export class Z3950SearchRequest
{
  SearchRequest: BasicSearch[];
  Profiles :Z3950Profile[];
  PageIndex:number;
  PageSize:number;
}


export class BasicSearchResponse {
  searchResults: MarcRecord[];
}

export class MarcRecord {
  RecordNumber: string;
  LCCN: string;
  ISBN: string;
  Title: string;
  Author: string;
  CallNumber: string;
  PublishingYear: string;
  PublishingYearSort:number;
  Format: string;
  EncodingLevel: string;
  RecordSource: string;
  Id: string;
  MARC_Record: any;
  MARC_RecordDescription: any;
  Mrecord:any;
  UPC: any;
  Source: any;
  TotalRecords: 0;
  IsSelect: boolean;
  RecordControlNumber:string;
  DeweyAbridged:string;
  DeweyUnabridged:string;
  ANSCR:string;
  ISSN:string;
  Reason: string;
}

export class AuthRecord {
  RecordNumber: string;
  Data: string;
  Display: string;
  HeadingType: string;
  BibRecordCount: string;
  Id: string;
  AuthorityId: string;
  MARC_Record: any;
  MARC_RecordDescription: any;
  Mrecord:any;
  SortOrder:number;
}

export class Facets {

  Titles: string[];
}

export class SearchResponse {
  MarcRecords: MarcRecord[];
  Facets: FacetsResults;
}

export class AuthoritySearchResponse {
  AuthorityRecords: AuthRecord[];
  Facets: FacetsResults;
  BaseIndex: number;
}

export class FacetResponse {
  facets: Facets[];
}

export class FacetDetails {
  FacetValue: string;
  FacetType: string;
}

export interface FacetAttributes {
  Count: number;
  Value: string;
}

export interface FacetsResults {
  Audience: FacetAttributes[];
  PublicationYear: FacetAttributes[];
  Format: FacetAttributes[];
  Subject: FacetAttributes[];
  Author: FacetAttributes[];
  Series: FacetAttributes[];
  EncodingLevel: FacetAttributes[];
  RecordSource: FacetAttributes[];
  Language: FacetAttributes[];
  Publisher: FacetAttributes[];
}
export class SearchCriteriaData {
    searchField: string;
    searchTerm: string;
    searchType: string;
}
export class SearchOperationReq {
    searchCriteria: SearchCriteriaData[];
    Catalogs: string[];
    Modifiers: string;
}

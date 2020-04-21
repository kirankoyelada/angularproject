import { Injectable } from "@angular/core";
import { of } from "rxjs";
import { delay } from "rxjs/operators";

const fakeData = [
  {
    id: "BTCATMain",
    index: 0,
    displayName: "BTCAT Main",
    fieldName: 'BTCATMain',
    dbName:'BTCAT Main',
    isChecked: true
  },
  {
    id: "BTCATWorkspace",
    index: 1,
    fieldName: "BTCATWorkspace",
    displayName: "BTCAT Workspace",
    dbName:'BTCAT Workspace',
    isChecked: true,
  },
  {
    id: "LOC",
    index: 2,
    displayName: "LOC",
    fieldName: 'LOC',
    isChecked: false,
    dbName:'LCDB'
  },
  {
    id: "DCPLZ",
    index: 3,
    fieldName: 'DCPLZ',
    displayName: "DCPLZ",
    dbName:'Unicorn',
    isChecked: false
  },
  {
    id: "DCPLOCLCZ3950",
    index: 4,
    fieldName: "DCPLOCLCZ3950",
    displayName: "DCPL OCLC Z39.50",
    dbName:'OLUCWorldcat',
    isChecked: false
  }
];

@Injectable()
export class SearchCatalogService {
  constructor() { }
  loadAllSearchCatalogItems() {
    return of(fakeData);
  }
}

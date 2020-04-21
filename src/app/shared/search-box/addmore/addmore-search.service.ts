import { Injectable } from "@angular/core";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import { SearchItem } from "./SearchItem";

const fakeData = [
  {
    id: "AddMoreKeyword",
    index: 0,
    displayName: "Keyword/ISBN/UPC",
    fieldName: 'Keyword',
    isChecked: true,
    isReadOnly: true,
    isContainOptions: false
  },
  {
    id: "AddMoreTitle",
    index: 1,
    fieldName: "Title",
    displayName: "Title",
    isChecked: true,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreAuthor",
    index: 2,
    displayName: "Author",
    fieldName: 'Author',
    isChecked: true,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreLCClassification",
    index: 3,
    fieldName: 'LCClassification',
    displayName: "LC Classification",
    isChecked: true,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMorePubDate",
    index: 4,
    fieldName: "PubDate",
    displayName: "Pub Date",
    isChecked: true,
    isReadOnly: false,
    isContainOptions: false
  },
  {
    id: "AddMoreISBN",
    index: 5,
    fieldName: 'ISBN',
    displayName: "ISBN",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: false
  },
  {
    id: "AddMoreUPC",
    index: 6,
    displayName: "UPC",
    fieldName: 'UPC',
    isChecked: false,
    isReadOnly: false,
    isContainOptions: false
  },
  {
    id: "AddMoreTitleOrAuthor",
    index: 7,
    fieldName: "AuthororTitle",
    displayName: "Author/Title",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreSeries",
    index: 8,
    fieldName: 'Series',
    displayName: "Series",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreSubject",
    index: 17,
    fieldName: 'Subject',
    displayName: "Subject",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreLCCN",
    index: 9,
    fieldName: 'LCCN',
    displayName: "LCCN",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: false
  },
  {
    id: "AddMoreRecordControlNumber",
    index: 10,
    fieldName: "RecordControlNumber",
    displayName: "Record Control Number",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMorePublisher",
    index: 11,
    fieldName: "Publisher",
    displayName: "Publisher",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreDatabaseRecordNumber",
    index: 12,
    fieldName: "DatabaseRecordNumber",
    displayName: "Database Record Number",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: false
  },
  {
    id: "AddMoreDeweyAbridged",
    index: 13,
    fieldName: "DeweyAbridged",
    displayName: "Dewey Abridged",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreDeweyUnabridged",
    index: 14,
    fieldName: "DeweyUnabridged",
    displayName: "Dewey Unabridged",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreANSCR",
    index: 15,
    fieldName: 'ANSCR',
    displayName: "ANSCR",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },
  {
    id: "AddMoreISSN",
    index: 16,
    fieldName: 'ISSN',
    displayName: "ISSN",
    isChecked: false,
    isReadOnly: false,
    isContainOptions: true
  },

];

@Injectable()
export class AddMoreService {
  constructor() { }
  loadAllSearchItems() {
    return of(fakeData);
  }
}

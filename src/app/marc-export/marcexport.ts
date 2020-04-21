export class MarcExport {
  id: string;
  parameterSetName: string;
  startDateTime?: Date;
  endDateTime?: Date;
  tagIndicatorCount: string;
  ctrlNumberPrefix: string[];

  tagsToRetain: string[];
  renumberTags: RenumberTags[];
  tagsToDelete: string[];
  createdBy: string;
  createdDate: Date;
  modifiedBy?: string;
  modifiedDate?: Date;
  startingRecordNumber : number;
  endingRecordNumber : number;
}
export interface RenumberTags {
  current: string;
  change: string;
}

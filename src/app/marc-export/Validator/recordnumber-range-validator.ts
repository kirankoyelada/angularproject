import { AbstractControl } from '@angular/forms';

// custom validator to check that two fields match
export function RecordNumberRangeValidator(c: AbstractControl) {
  const startingRecordNumber = c ? c.get('startingRecordNumber') : null;
  const endingRecordNumber = c ? c.get('endingRecordNumber') : null;

      // return null if controls haven't initialised yet
  if (!startingRecordNumber || !endingRecordNumber) {
        return null;
      }

  const startRecordNumber = startingRecordNumber.value;
  const endRecordNumber = endingRecordNumber.value;
        // set error on matchingControl if validation fails
  if (+endRecordNumber <= +startRecordNumber) {
            return { invalidRecordNumberRange: true, errMsg: 'Ending Record No should be greater than Starting Record No' };
        }
  return null;
}

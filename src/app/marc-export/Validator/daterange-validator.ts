import { AbstractControl } from '@angular/forms';

// custom validator to check that two fields match
export function DateRangeValidator(c: AbstractControl) {
    const startDateCtrl = c ? c.get('startDateTime') : null;
    const endDateCtrl = c ? c.get('endDateTime') : null;

    // return null if controls haven't initialised yet
    if (!startDateCtrl || !endDateCtrl) {
        return null;
    }

    const startDateTime = Date.parse(startDateCtrl.value);
    const endDateTime = Date.parse(endDateCtrl.value);
    // set error on matchingControl if validation fails
    if (startDateTime > endDateTime) {
        return { invalidDateRange: true, errMsg: 'Start Date and Time should be before End Date and Time' };
    }
    return null;
}

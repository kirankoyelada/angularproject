import { FormGroup } from '@angular/forms';

// custom validator to check that two fields match
export function HasMinLength(controlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];

        // return null if controls haven't initialised yet
        if (!control) {
          return null;
        }

        // set error on matchingControl if validation fails
        if (control.value.trim().length < 3) {
            control.setErrors({ minLengthErrorMessage: `Length should be 3` });
        } else {
            control.setErrors(null);
        }
    }
}

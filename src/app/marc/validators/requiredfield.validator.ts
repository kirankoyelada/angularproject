import { FormGroup } from '@angular/forms';

// custom validator to check that two fields match
export function RequiredField(controlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];

        // return null if controls haven't initialised yet
        if (!control) {
          return null;
        }

        // set error on matchingControl if validation fails
        if (control.value === '') {
            control.setErrors({ requiredErrorMessage: `Required` });
        } else {
            control.setErrors(null);
        }
    }
}

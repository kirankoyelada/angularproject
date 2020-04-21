import { AbstractControl } from '@angular/forms';

// custom validator to check that two fields match
export function NonZeroNumberValidator(c: AbstractControl) {
        // set error on matchingControl if validation fails
  if (!c) {
    return null;
  }
  if (+c.value === 0) {
            return { numberZero: true };
        }
  return null;
}

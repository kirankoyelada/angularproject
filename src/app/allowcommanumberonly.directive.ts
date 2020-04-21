
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'textarea[AllowCommaNumberOnly]'
})
export class AllowCommaNumberOnlyDirective {

  constructor(private _el: ElementRef) { }

  @HostListener('input', ['$event']) onInputChange(event) {
    const initalValue = this._el.nativeElement.value;
    if (event.inputType === 'insertFromPaste') {
      const nonMatchValue = initalValue.match(/[0-9,\s]/g);
      // tslint:disable-next-line: max-line-length
      this._el.nativeElement.value = (nonMatchValue != null && nonMatchValue.join('') === initalValue) ? initalValue.replace(/[^0-9\.,]/g, '') : '';
    } else {
      this._el.nativeElement.value = initalValue.replace(/[^0-9\.,]/g, '');
    }
    if (initalValue !== this._el.nativeElement.value) {
       this._el.nativeElement.dispatchEvent(new Event('input'));
       event.stopPropagation();
    }
  }
}

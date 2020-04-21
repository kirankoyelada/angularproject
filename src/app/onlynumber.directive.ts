
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'input[OnlyNumber]'
})
export class OnlyNumber {

  constructor(private _el: ElementRef) { }

  @HostListener('input', ['$event']) onInputChange(event) {
    const initalValue = this._el.nativeElement.value;
    var regEx = /^[0-9]*$/;
    if(event.inputType =='insertFromPaste' && !regEx.test(initalValue))
    {
      this._el.nativeElement.value = (regEx.test(initalValue)) ? initalValue.replace(/[^0-9]*/g, '') : '';
    }
    else{
      this._el.nativeElement.value = initalValue.replace(/[^0-9]*/g, '');
    }
    if (initalValue !== this._el.nativeElement.value) {
      this._el.nativeElement.dispatchEvent(new Event('input'));
      event.stopPropagation();
    }
  }
}

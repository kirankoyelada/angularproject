
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input[AllowNumberXOnly]'
})
export class AllowNumberXOnlyDirective {

  constructor(private _el: ElementRef) { }

  @HostListener('input', ['$event']) onInputChange(event) {
    const initalValue = this._el.nativeElement.value;
    if(event.inputType =='insertFromPaste')
    {
      var nonMatchValue= initalValue.match(/[xX0-9 ]/g);
      this._el.nativeElement.value = (nonMatchValue!= null && nonMatchValue.join('') == initalValue)?initalValue.replace(/[^xX0-9\- ]*/g, '') : '';
    }
    else{
      this._el.nativeElement.value = initalValue.replace(/[^xX0-9 ]*/g, '');
     // this.renderer.setValue(this._el.nativeElement,initalValue.replace(/[^0-9 \-]*/g, ''));
    }
    if (initalValue !== this._el.nativeElement.value) {
      this._el.nativeElement.dispatchEvent(new Event('input'));
      event.stopPropagation();
    }
  }
}

import { ElementRef, HostListener, Renderer2, AfterContentChecked, Directive } from '@angular/core';

@Directive({
  selector: 'textarea[autosize]'
})
export class AutosizeDirective implements AfterContentChecked {
  @HostListener('input',['$event.target'])
  onInput(textArea: HTMLTextAreaElement): void {
    this.adjust();
  }
  constructor(private element: ElementRef, private renderer: Renderer2) { }
  ngAfterContentChecked(): void {
    this.adjust();
  }
  adjust(): void {
    this.renderer.setStyle(this.element.nativeElement, 'overflow', 'hidden');
    this.renderer.setStyle(this.element.nativeElement, 'height', '0px');
    this.renderer.setStyle(this.element.nativeElement, 'height', `${this.element.nativeElement.scrollHeight}px`);
  }
}

import { Directive, HostListener, Input } from '@angular/core';

@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[moveNextByMaxLength]'
})
export class MoveNextByMaxLengthDirective {
    @Input() active: boolean;
    constructor() { }

    @HostListener('keyup', ['$event'])
    onKeyDown(e: any) {
        if (this.active) {
            if (e.key && e.keyCode && !(e.altKey && (e.keyCode === 82 || e.keyCode === 80  || e.keyCode === 87  || e.keyCode === 77  || e.keyCode === 76 ))// exclude Alt+r,Alt+p,Alt+w,Alt+m,Alt+l keys
            && ((e.ctrlKey && (e.keyCode == 89 || e.keyCode == 90 || e.keyCode == 86)) || (!e.ctrlKey && this.isValidKey(e.keyCode)))
                && e.srcElement.maxLength === e.srcElement.value.length) {
                if (e.key == "Tab") {
                    e.srcElement.focus();
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                if (e.srcElement.parentElement && e.srcElement.parentElement.nextElementSibling) {
                    const nextControl: any = e.srcElement.parentElement.nextElementSibling.children;
                    let i = 0;
                    // Searching for next similar control to set it focus
                    while (nextControl[i]) {
                        if (nextControl[i]) {
                            if ((nextControl[i].tagName === 'TEXT-EDITOR' || (e.target && e.target.value == '003' && nextControl[i].tagName === 'TEXTAREA') ||
                                nextControl[i].type === e.srcElement.type) && !nextControl[i].hidden) {
                                if (nextControl[i].tagName === 'TEXT-EDITOR') {
                                    nextControl[i].children[0].focus();
                                }
                                else if (e.target && e.target.value === '003' && nextControl[i].tagName === 'TEXTAREA') {
                                    nextControl[i].focus();
                                } else {
                                    nextControl[i].focus();
                                    nextControl[i].select();
                                }

                                e.preventDefault();
                                return;
                            }
                        } else {
                            return;
                        }
                        i++;
                    }
                }
            }
            e.preventDefault();
        }
    }

    isValidKey(keycode): boolean {

        return (keycode > 47 && keycode < 58) || // number keys
            keycode === 32 || // spacebar
            (keycode > 64 && keycode < 91) || // letter keys
            (keycode > 95 && keycode < 112) || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 223);   // [\]' (in order)
    }
}

import { Directive, ElementRef, Input, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appMarcEditor]'
})
export class MarcEditorDirective {
  @Input() delimiter;
  @Input() subFieldCodeColor;
  innerHtml: string;
  @Input() field: any;
  @Input() fontSize: any;
  @Input() fontFamily: any;

  ngAfterViewInit() {
    this.applySubFieldStyle(this.el.nativeElement.innerText, this.field);
    this.el.nativeElement.innerHTML = this.innerHtml;
  }

  constructor(public el: ElementRef) {
    if (el && el.nativeElement) {

      //key down
      el.nativeElement.onkeydown = (event: any) => {
        // handle ctrl+D
        if (event.ctrlKey && event.keyCode === 68) {
          this.applySubFieldStyle(this.el.nativeElement.innerText, this.field);
          this.el.nativeElement.innerHTML = this.innerHtml;
          event.preventDefault();
          event.stopPropagation();
          this.setFocus(event.target);
        }
      };

      el.nativeElement.oninput = (event: any) => {
        this.applySubFieldStyle(this.el.nativeElement.innerText,this.field,this.el.nativeElement.innerHTML);
        this.el.nativeElement.innerHTML = this.innerHtml;
        this.setFocus(event.target);
      };
    }
  }

  public setFocus(element: any) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(element, element.childNodes.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    element.focus();
  }

  private checkWordForAuthorityId(word: string, subFieldCode: string, field:any): string {
    var authorityId = "";
    for (var i = 0; i < field.subfields.length; i++) {
      if (field.subfields[i].code == subFieldCode && field.subfields[i].data ==
        word && field.subfields[i].authorityId != null) {
        authorityId = field.subfields[i].authorityId;
        break;
      }
    }
    return authorityId;
  }

  private applySubFieldDelimiterStyle(subFieldData: any, subFieldCode: any,lastChar : string,index : any) {
    if (subFieldData != "") {
      if (index == length - 1) {
        if(!lastChar.match(/(\s+)/)){
          const colorHtml = `<span  style='color:${this.subFieldCodeColor};
              font-family:${this.fontFamily};
               font-size:${this.fontSize}'>${this.delimiter + subFieldCode}</span>`;
        this.innerHtml += colorHtml;
        }
        else
        {
          const colorHtml = `<span  style='color:${this.subFieldCodeColor};
          font-family:${this.fontFamily};
           font-size:${this.fontSize}'>${this.delimiter + subFieldCode}&nbsp;</span>`;
    this.innerHtml += colorHtml;
        }
      }
      else{
        const colorHtml = `<span  style='color:${this.subFieldCodeColor};
        font-family:${this.fontFamily};
         font-size:${this.fontSize}'>${this.delimiter + subFieldCode}&nbsp;</span>`;
  this.innerHtml += colorHtml;
      }
    }
    else {
      const colorHtml = `<span  style='color:${this.subFieldCodeColor};
            font-family:${this.fontFamily};
             font-size:${this.fontSize}'>${this.delimiter + subFieldCode}</span>`;
      this.innerHtml += colorHtml;
    }
  }

  private applySubFieldDataStyle(subFieldData: any, subFieldCode: any, length: any, index: any, field :any ,lastChar : string) {
    if (subFieldData != "") {
      if (this.checkWordForAuthorityId(subFieldData, subFieldCode, field) != "") {
        var ahrefHtml = `<span><a style='font-family:${this.fontFamily};
      font-size:${this.fontSize}'  
      contenteditable="false"
      href="#/authority-view/${this.checkWordForAuthorityId
            (subFieldData, subFieldCode, field)}">${subFieldData}</a></span>`;
        this.innerHtml += ahrefHtml;
      }
      else {
        if (index == length - 1) {
          if(!lastChar.match(/(\s+)/)){
          this.innerHtml += `<span style='font-family:${this.fontFamily};
      font-size:${this.fontSize}'>${subFieldData}</span>`;
          }
          else
          {
            this.innerHtml += `<span style='font-family:${this.fontFamily};
            font-size:${this.fontSize}'>${subFieldData}&nbsp;</span>`;
          }
        }
        else {
          this.innerHtml += `<span style='font-family:${this.fontFamily};
        font-size:${this.fontSize}'>${subFieldData}&nbsp;</span>`;
        }
      }
    }
  }

  public applySubFieldStyle(input : string, field: any,html?: string) : any {
    this.innerHtml = '';
    const text = input as string;
    var lastChar = text[text.length - 1];
   // if (!lastChar.match(/(\s+)/)) {
      const allTextBlocks = text.split(this.delimiter);
      for (var i = 0; i < allTextBlocks.length; i++) {
        const textBlockTrim = allTextBlocks[i];
        if (textBlockTrim != "") {
          var subFieldCode = textBlockTrim.charAt(0)
          var subFieldData = allTextBlocks[i].substr(1, allTextBlocks[i].length - 1).trim();
          this.applySubFieldDelimiterStyle(subFieldData, subFieldCode,lastChar,i);
          this.applySubFieldDataStyle(subFieldData, subFieldCode, allTextBlocks.length, i,field,lastChar);
        }
      }
      if (lastChar == this.delimiter) {
        const colorHtml = `<span  style='color:${this.subFieldCodeColor};
      font-family:${this.fontFamily};
       font-size:${this.fontSize}'>${this.delimiter}</span>`;
        this.innerHtml += colorHtml;
      }
      this.el.nativeElement.style = "color:black;";
   //}
    // else {
    //   this.innerHtml = html;
    //   this.el.nativeElement.style = "color:black;";
    // }
    return this.innerHtml ;
  }
}

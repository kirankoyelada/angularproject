import {
  Component,
  ViewChild,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  SimpleChanges
} from "@angular/core";
import {
  Marc,
  MarcField,
  MarcEditorSettings,
  MarcSubField,
  SystemSettings
} from "../shared/marc";
import { MarcService } from "../shared/service/marc-service";
import { forkJoin, Subscription } from "rxjs";
import { MarcRecord } from "../../services/search";
import { Router } from "@angular/router";
import { CommonService } from "src/app/shared/service/common.service";
import { Constants } from "src/app/constants/constants";
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';
declare var $: any;

@Component({
  selector: "marc-differentiator",
  templateUrl: "./marc-differentiator.component.html"
})
export class MarcDifferentiatorComponent extends BaseComponent {
  @Input() marcs: MarcRecord[];
  // public properties
  sourceMarc: Marc;
  targetMarc: Marc;
  CWidowHeight: number;
  CHeaderHeight: number;
  CSearchHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  loadCount: number = 0;
  marcSettings: MarcEditorSettings;
  defaultMarcSettings:MarcEditorSettings;
  systemSettings: SystemSettings;
  isExpandSearchItem: string;
  sourceMarcId: string;
  targetMarcId: string;
  authorityId: string;
  marcSubscription: Subscription;
  isAllCustomerSelected: boolean = false;

  constructor(
    private service: MarcService,
    private commonService: CommonService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authenticationService: AuthenticationService
  ) {
    super(router, authenticationService);
  }

  ngOnInit(): void {
    this.sourceMarc = new Marc();
    this.targetMarc = new Marc();
    this.marcSettings = new MarcEditorSettings();
    this.systemSettings = new SystemSettings();
    this.defaultMarcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTENVSETTINGS));
    if (this.marcs && this.marcs.length == 2) {
      this.sourceMarcId = this.marcs[0].Id;
      this.targetMarcId = this.marcs[1].Id;
    }
    this.loadMarcDetails();
    this.commonService.currentMessage.subscribe(
      message => (this.isExpandSearchItem = message)

    );
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    if (items != null && items.length > 0) {
      this.isAllCustomerSelected = items.findIndex(i => i.isActive && i.profileName === "All Customers") != -1;
    }

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.marcs &&
      this.marcs &&
      changes.marcs.currentValue !== changes.marcs.previousValue
    ) {
      this.sourceMarc = new Marc();
      this.targetMarc = new Marc();
      this.marcSettings = new MarcEditorSettings();
      this.systemSettings = new SystemSettings();
      this.sourceMarcId = this.marcs[0].Id;
      this.targetMarcId = this.marcs[1].Id;
      this.loadMarcDetails();
    }
  }

  // get tag description to display as tool tip
  getTagDescription(tag: string): string {
    return "";
  }

  isZ3950ProfileSearch() {
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    sessionStorage.setItem("z3950recordcount", items.length.toString());
    if (items != null && items.length > 0) {
      var filterItems = items.filter(
        x =>
          x.isActive &&
          this.defaultCatalogIds.indexOf(x.id) === -1
      );
      if (filterItems.length == 0) {
        return false;
      } else {
        return true;
      }
    }
    else {
      return false;
    }
  }

  // call the api and get marc details and marc settings
  loadMarcDetails() {
    if (this.isZ3950ProfileSearch()) {
      this.sourceMarc = this.marcs[0].Mrecord;
      this.targetMarc = this.marcs[1].Mrecord;
      this.sourceMarc.RecordControlNumber = this.marcs[0].RecordControlNumber;
      this.targetMarc.RecordControlNumber = this.marcs[1].RecordControlNumber;

      if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null) {
        this.marcSettings = JSON.parse(
          localStorage.getItem(Constants.LocalStorage.MARCSETTINGS)
        );
      }

      this.sourceMarc.fields.forEach(field => {
        /*if a particular source tag is not present in target fields then dont need to
                                find the difference , highlight the source field
                        */
        if (!this.containsTag(this.targetMarc, field.tag)) {
          field.color = this.marcSettings.highlightedcolor ? this.marcSettings.highlightedcolor : this.defaultMarcSettings.highlightedcolor;
        } else {
          this.differentiate(field, this.targetMarc);
        }
      });
    }
    else {
      (this.marcSubscription = forkJoin([
        this.service.getMarcRecord(this.sourceMarcId),
        this.service.getMarcRecord(this.targetMarcId)
      ]).subscribe(results => {
        this.sourceMarc = results[0];
        this.targetMarc = results[1];
        if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null) {
          this.marcSettings = JSON.parse(
            localStorage.getItem(Constants.LocalStorage.MARCSETTINGS)
          );
        }
        this.sourceMarc.fields.forEach(field => {
          /*if a particular source tag is not present in target fields then dont need to
                                  find the difference , highlight the source field
                          */
          if (!this.containsTag(this.targetMarc, field.tag)) {
            field.color = this.marcSettings.highlightedcolor ? this.marcSettings.highlightedcolor : this.defaultMarcSettings.highlightedcolor;
          } else {
            this.differentiate(field, this.targetMarc);
          }
        });
      })),
        (err: any) => console.log(err);
    }
  }
  /* search split fix function - var values */
  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $("app-header nav").height();
    this.CSearchHeight = $("app-search-box .search_filter").height();
    this.CNavHeight = $(".mainNavSection").height();
    this.HeaderHeight =
      this.CHeaderHeight + this.CSearchHeight + this.CNavHeight;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    this.NewHeight = this.NewHeight - 115;
    this.cdr.detectChanges();
  }
  //check if target field tag is present in source fields
  containsTag(sourceMarc: Marc, targetTag: string) {
    var found = false;
    for (var i = 0; i < sourceMarc.fields.length; i++) {
      if (sourceMarc.fields[i].tag == targetTag) {
        found = true;
        break;
      }
    }
    return found;
  }
  ngAfterViewChecked() {
    this.CustomHeightFunction();

    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }
  //set color of the field based on conditions
  setColor(targetField: MarcField, sourceField: MarcField) {
    if (targetField.color != "#f7f7f7")
      targetField.color = this.marcSettings.highlightedcolor ? this.marcSettings.highlightedcolor : this.defaultMarcSettings.highlightedcolor;
    if (sourceField.color != "#f7f7f7")
      sourceField.color = this.marcSettings.highlightedcolor ? this.marcSettings.highlightedcolor : this.defaultMarcSettings.highlightedcolor;
  }

  //form a string reading all values from the MarcField to compare
  getFieldData(field: MarcField): string {
    var fieldDatabuilder = [];

    if (field.data != null) {
      var data = field.data.trim();
    }
    fieldDatabuilder.push(data);

    if (field.ind1 != null) {
      var ind1 = field.ind1.trim();
    }
    fieldDatabuilder.push(ind1);

    if (field.ind2 != null) {
      var ind2 = field.ind2.trim();
    }
    fieldDatabuilder.push(ind2);

    if (field.tag != null) {
      var tag = field.tag.trim();
    }
    fieldDatabuilder.push(tag);

    if (field.type != null) {
      var type = field.type.trim();
    }
    fieldDatabuilder.push(type);

    if (field.subfields != null)
      field.subfields.forEach(subfield => {
        if (subfield.code != null) {
          var code = subfield.code.trim();
        }
        fieldDatabuilder.push(code);
        if (subfield.data != null) {
          var sData = subfield.data.trim();
        }
        fieldDatabuilder.push(sData);
      });
    var fieldData = fieldDatabuilder.join("");
    return fieldData;
  }

  //logic to check if there is any difference between source and target fields
  differentiate(sourceField: MarcField, targetMarc: Marc) {
    loop2: for (var targetField of targetMarc.fields) {
      var colorChanged = false;
      if (!this.containsTag(this.sourceMarc, targetField.tag)) {
        targetField.color = this.marcSettings.highlightedcolor ? this.marcSettings.highlightedcolor : this.defaultMarcSettings.highlightedcolor;
      } else {
        var hasDuplicates =
          targetMarc.fields.filter(element => element.tag == sourceField.tag)
            .length > 1;
        if (targetField.tag == sourceField.tag) {
          if (
            this.getFieldData(sourceField) != this.getFieldData(targetField)
          ) {
            this.setColor(targetField, sourceField);
            colorChanged = true;
            if (hasDuplicates) {
              continue loop2;
            }
            break;
          }
          if (!colorChanged) {
            targetField.color = "#f7f7f7";
            sourceField.color = "#f7f7f7";
          }
        }
      }
    }
  }

  //unsubscribe the subscription
  ngOnDestroy() {
    if (this.marcSubscription) {
      this.marcSubscription.unsubscribe();
    }
  }
  EditMarcRecord(id: any, routeParam: number, marcItem: any) {
    //get the record source
    if (this.marcs) {
      let edit_marc_record = this.marcs.find(x => x.Id === marcItem.id); //get the edit marc record
      if (edit_marc_record) {
        this.commonService.setRecordSource(edit_marc_record.RecordSource);
      }
    }
    if (this.isZ3950ProfileSearch() && marcItem) {
      marcItem.fields.forEach(field => {
        field.color = "";
      });
      this.commonService.setZ3950MarcItem(marcItem);
      if (routeParam === 1) {
        sessionStorage.setItem("z3950recordcount", routeParam.toString());
      }
      this.router.navigate([
        "/z3950-edit"
      ]);
    }
    else {
      if (id) {
        this.router.navigate(["/bibliographic-edit/", id, routeParam]);
      }
    }

  }
}

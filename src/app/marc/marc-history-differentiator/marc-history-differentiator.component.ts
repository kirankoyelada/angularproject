import { Component, ViewChild, ChangeDetectorRef, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Marc, MarcField, MarcEditorSettings, MarcSubField, SystemSettings, MarcRecordHistory } from '../shared/marc';
import { MarcService } from '../shared/service/marc-service';
import { forkJoin, Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService } from 'src/app/shared/service/common.service';
import { Constants } from 'src/app/constants/constants';
import { UtilService } from 'src/app/shared/util.service';
import { Title } from '@angular/platform-browser';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';
declare var $: any;

@Component({
  selector: 'marc-history-differentiator',
  templateUrl: './marc-history-differentiator.component.html'
})

export class MarcHistoryDifferentiatorComponent extends BaseComponent {

  @Input() marcs: MarcRecordHistory[];
  // Emitting required data
  @Output() showingMergeButtonOnCondition: EventEmitter<string> = new EventEmitter<string>();

  // public properties
  sourceMarc: Marc;
  targetMarc: Marc;
  CWidowHeight: number;
  CHeaderHeight: number;
  CSearchHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  marcRecordsLength: number = 0;

        marcSettings: MarcEditorSettings;
        systemSettings: SystemSettings;
        isExpandSearchItem : string;
        sourceMarcId: string;
        targetMarcId: string;
        authorityId: string;
        marcSubscription: Subscription;
        orginalMarcId: string;
        versionNumber: number = 0;
        marcParams: string;
        defaultMarcSettings: MarcEditorSettings;

  constructor(private spinnerService: SpinnerService,
    private _titleService: Title,
    private route: ActivatedRoute,
    private service: MarcService,
    private utilService: UtilService,
    private commonService: CommonService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authenticationService: AuthenticationService) {
    super(router, authenticationService);
  }

  ngOnInit(): void {
    //Set page Title when this view is initialized
    this._titleService.setTitle('BTCAT | Record History Compare');

                this.sourceMarc = new Marc();
                this.targetMarc = new Marc();
                this.marcSettings = new MarcEditorSettings();
                this.systemSettings = new SystemSettings();
                this.defaultMarcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTENVSETTINGS));
                if (this.marcs && this.marcs.length == 2) { 
                        
                        this.service.getMarcRecordHistory(this.marcs[0].recordNumber).subscribe(item => {                              
                                if (item && item.length > 0) { 
                                this.versionNumber =  item[0].versionNumber;
                                }
                                this.loadMarcDetails();
                            });
                        this.sourceMarcId = this.marcs[0].id;
                        this.targetMarcId = this.marcs[1].id;
                }
                //this.loadMarcDetails();
                this.commonService.currentMessage.subscribe(message => this.isExpandSearchItem = message)                
        }

  ngOnChanges(): void {
    this.sourceMarc = new Marc();
    this.targetMarc = new Marc();
    this.marcSettings = new MarcEditorSettings();
    this.systemSettings = new SystemSettings();
    if (this.marcs && this.marcs.length == 2) {
      this.sourceMarcId = this.marcs[0].id;
      this.targetMarcId = this.marcs[1].id;
    }
    this.loadMarcDetails();
  }

  // get tag description to display as tool tip
  getTagDescription(tag: string): string {
    return "";
  }

  // call the api and get marc details and marc settings
  loadMarcDetails() {
    this.spinnerService.spinnerStart();
    this.marcSubscription = forkJoin([
      this.service.getMarcRecordHistoryById(this.sourceMarcId),
      this.service.getMarcRecordHistoryById(this.targetMarcId)]).subscribe(results => {
        this.spinnerService.spinnerStop();

        this.marcRecordsLength = 2;
        if (results[0].versionNumber >= results[1].versionNumber) {
          this.sourceMarc = results[0];
          this.targetMarc = results[1];
          this.orginalMarcId = results[0].orginalMarcId;
          // // Emitting values for merge button show on condition
          let versionDetails = '';
          if (this.versionNumber && this.sourceMarc && this.versionNumber === this.sourceMarc.versionNumber && this.marcRecordsLength == 2) {
            versionDetails = this.sourceMarc.versionNumber + ':' + this.targetMarc.versionNumber;
          }
          else {
            versionDetails = '';
          }
          this.showingMergeButtonOnCondition.emit(versionDetails);

        } else {
          this.sourceMarc = results[1];
          this.targetMarc = results[0];
          this.orginalMarcId = results[1].orginalMarcId;
          // // Emitting values for merge button show on condition
          let versionDetails = '';
          if (this.versionNumber && this.sourceMarc && this.versionNumber === this.sourceMarc.versionNumber && this.marcRecordsLength == 2) {
            versionDetails = this.targetMarc.versionNumber + ':' + this.sourceMarc.versionNumber;
          }
          else {
            versionDetails = '';
          }
          this.showingMergeButtonOnCondition.emit(versionDetails);
        }

        this.sourceMarc.editedDate = this.utilService.getDateinSystemFormat(this.sourceMarc.editedDate);
        this.targetMarc.editedDate = this.utilService.getDateinSystemFormat(this.targetMarc.editedDate);

        if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null) {
          this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
        }

                this.sourceMarc.fields.forEach(field => {
                        /*if a particular source tag is not present in target fields then dont need to
                                find the difference , highlight the source field
                        */
                        if (!this.containsTag(this.targetMarc, field.tag)) {
                                field.color = this.marcSettings.highlightedcolor ? this.marcSettings.highlightedcolor : this.defaultMarcSettings.highlightedcolor;
                        }
                        else {
                                this.differentiate(field, this.targetMarc);
                        }
                })
        }),
        (err: any) => console.log(err);
        }

  /* search split fix function - var values */
  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $("app-header nav").height();
    this.CSearchHeight = $("app-search-box .search_filter").height();
    this.CNavHeight = $(".mainNavSection").height();
    this.HeaderHeight =
      this.CHeaderHeight +
      this.CSearchHeight +
      this.CNavHeight;
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
    var fieldDatabuilder = []


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
      field.subfields.forEach((subfield) => {
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
                loop2:
                for (var targetField of targetMarc.fields) {
                        var colorChanged = false;
                        if (!this.containsTag(this.sourceMarc, targetField.tag)) {
                                targetField.color = this.marcSettings.highlightedcolor ? this.marcSettings.highlightedcolor : this.defaultMarcSettings.highlightedcolor;
                        }
                        else {
                                var hasDuplicates = (targetMarc.fields.filter(element => element.tag == sourceField.tag).length) > 1;
                                if (targetField.tag == sourceField.tag) {
                                        if ((this.getFieldData(sourceField) != this.getFieldData(targetField))) {
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
  EditMarcRecord() {
    if (this.orginalMarcId) {
      this.router.navigate(['/bibliographic-edit/', this.orginalMarcId, 0]);
    }
  }

  // close marc window
  close(marcId: string) {
    //Removes closed record
    let marcIndex = this.marcs.findIndex(x => x.id == marcId);
    if (marcIndex != -1) {
      this.marcs.splice(marcIndex, 1);
    }

    // Emitting values for merge button show on condition
    this.marcRecordsLength = this.marcs.length;
    let versionDetails = '';
    if (this.versionNumber && this.sourceMarc && this.versionNumber === this.sourceMarc.versionNumber && this.marcRecordsLength == 2) {
      versionDetails = this.sourceMarc.versionNumber + ':' + this.targetMarc.versionNumber;
    }
    else {
      versionDetails = '';
    }
    this.showingMergeButtonOnCondition.emit(versionDetails);

    let param: string = "";
    this.marcs.forEach(remainingMarc => {
      if (param.length > 0) {
        param = param + ",";
      }
      param = param + remainingMarc.id + ":" + remainingMarc.recordNumber;
    });
    this.router.navigate(["/compare-history-view/" + param]);
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    this.route.params.subscribe(params => {
      if (params['marcParams']) {
        this.marcParams = params['marcParams'];
        if (this.marcParams) {
          let marcParmList: string[] = this.marcParams.split(':');
          if (marcParmList && marcParmList.length > 2) {
            this.showingMergeButtonOnCondition.emit('');
          }
        }
      }
    });
  }
}

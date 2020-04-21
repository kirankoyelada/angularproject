import { Injectable, OnInit, EventEmitter } from '@angular/core';
import { MarcEditorSettings, MarcBibData, SystemSettings, TemplateType, ExportMarcConfigData, KeyValue } from '../marc/shared/marc';
import { Observable, of, config } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { EditTagDTO } from '../_dtos/btcat.vm.dtos';
import { Constants } from '../constants/constants';
import { UtilService } from '../shared/util.service';
import { ConfigurationService } from './configuration.service';


@Injectable({
  providedIn: 'root'
})
export class MarcSettingsService implements OnInit {

  private marcSettings: MarcEditorSettings;
  private marcBibData: MarcBibData[];
  private templateTypes: TemplateType[];
  private exportMarcConfigData: ExportMarcConfigData;
  private _baseURL: string

  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this.loadMarcSettings();
    this._baseURL = configurationService.currentConfiguration().apiURL;
  }

  ngOnInit(): void {

  }

  getMarcSettingsData(): MarcEditorSettings {
    if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null)
     this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
    return this.marcSettings;
  }

  getMarcBibData(): MarcBibData[] {
    return this.marcBibData;
  }

  getDelimiter(): string {
    return this.marcSettings ? this.marcSettings.delimiter : '';
  }

  getMarcBibDataByTag(tag: string): MarcBibData {
    const marcBibData = this.marcBibData.find(c => c.tag === tag);
    return (marcBibData !== null || marcBibData !== undefined) ? marcBibData : new MarcBibData();
  }

  getTemplateTypes(): TemplateType[] {
    const selectType: TemplateType = { name: 'Select', defaultBibMarcData: [] };
    if (this.templateTypes && this.templateTypes.filter(type => type.name === selectType.name).length === 0) {
      this.templateTypes.splice(0, 0, selectType);
    }
    return this.templateTypes;
  }

  getExportMarcConfigData(): ExportMarcConfigData {
    return this.exportMarcConfigData;
  }

  private loadMarcSettings() {
    const exportMarcConfigLocalStorage = localStorage.getItem(Constants.LocalStorage.EXPORTMARCCONFIGDATA);
    if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null &&
        localStorage.getItem(Constants.LocalStorage.MARCBIBDATA) != null &&
        localStorage.getItem(Constants.LocalStorage.TEMPLATETYPES) != null &&
        localStorage.getItem(Constants.LocalStorage.EXPORTMARCCONFIGDATA) != null &&
        localStorage.getItem(Constants.LocalStorage.EXPORTMARCCONFIGDATA) !== 'undefined') {
      this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
      this.marcBibData = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCBIBDATA));
      this.templateTypes = JSON.parse(localStorage.getItem(Constants.LocalStorage.TEMPLATETYPES));
      this.exportMarcConfigData = JSON.parse(localStorage.getItem(Constants.LocalStorage.EXPORTMARCCONFIGDATA));
    } else {
      this.getMarcSettings().subscribe(item => {
        if (item) {
          this.marcSettings = item.MarcEditorSettings;
          if (item.BibMarcData && item.BibMarcData.length > 0) {
            const marcBibData = item.BibMarcData.sort(
              (a: any, b: any) => a.tag - b.tag
            );
            localStorage.setItem(Constants.LocalStorage.MARCBIBDATA, JSON.stringify(marcBibData));
            this.marcBibData = marcBibData;
          }
          this.templateTypes = item.TemplateTypes;
          this.exportMarcConfigData = item.ExportMarcConfigData;
          localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.marcSettings));
          localStorage.setItem(Constants.LocalStorage.DEFAULTENVSETTINGS, JSON.stringify(this.marcSettings));
          localStorage.setItem(Constants.LocalStorage.TEMPLATETYPES, JSON.stringify(item.TemplateTypes));
          localStorage.setItem(Constants.LocalStorage.EXPORTMARCCONFIGDATA, JSON.stringify(item.ExportMarcConfigData));
        }
      });
    }
  }
  private getMarcSettings(): Observable<SystemSettings> {
    const url = this._baseURL + '/api/SystemSettings/systemsettings';
    return this.http.get<SystemSettings>(url);
  }
  // Helper Methods
  public getObsoleteAndDiscardedTags(): EditTagDTO[] {
    const leaderEditTags = this.getleaderMarcBibData().map(x => this.CreateEditTagDTO(x));
    const obsoleteEditTags = this.getObsoleteMarcBibData().map(x => this.CreateEditTagDTO(x));
    const discardedEditTags = this.getdiscardedMarcBibData().map(x => this.CreateEditTagDTO(x));
    return [...leaderEditTags, ...obsoleteEditTags, ...discardedEditTags];
  }

  getObsoleteMarcBibData(): MarcBibData[] {
    return this.marcBibData ? this.marcBibData.filter(x => x.isObsolete === true) : [];
  }

  getdiscardedMarcBibData(): MarcBibData[] {
    return this.marcBibData ? this.marcBibData.filter(x => x.tag.includes(Constants.SystemGeneratedTags)) : [];
  }

  getleaderMarcBibData(): MarcBibData[] {
    return this.marcBibData ? this.marcBibData.filter(x => x.tag.toLowerCase() === 'leader') : [];
  }
  getNonRepetableFixedMarcRecords(): EditTagDTO[] {
    const nonRepeatablefixedMarcRecords = this.marcBibData.filter(r => !r.repeatable &&
      ((r.type && r.type === 'controlfield'))).map(item => this.CreateEditTagDTO(item));
    return nonRepeatablefixedMarcRecords;
  }
  private CreateEditTagDTO(x: MarcBibData): EditTagDTO {
    const editTag = new EditTagDTO();
    editTag.tag = x.tag;
    editTag.type = x.type;
    editTag.description = x.description;
    editTag.isObsolete = x.isObsolete;
    editTag.isRepeatable = x.repeatable;
    return editTag;
  }
}

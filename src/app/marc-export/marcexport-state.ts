import { MarcExport } from './marcexport';
import { ExportMarcConfigData } from '../marc/shared/marc';
import { Observable } from 'rxjs';

export interface MarcExportState {
  currentMarcExportConfig: MarcExport;
  marcExportConfigList: MarcExport[];
  filteredConfigList: Observable<MarcExport[]>;
  exportMarcConfigData: ExportMarcConfigData;
  lastParamSet?: string;
  isParamSetModified: boolean;
  paramFocused: boolean;
  startDateFocused: boolean;
  endDateFocused: boolean;
  tagIndicatorFocused: boolean;
  ctrlPrefixFocused: boolean;

  toFocused: boolean;
}


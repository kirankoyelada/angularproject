import { MarcDTO, MarcFieldDTO, MarcIndicatorDTO, MarcSubElementsDTO, EditTagDTO } from 'src/app/_dtos/btcat.vm.dtos';

export interface MarcState {
  marc: MarcDTO;
  originalMarc: MarcDTO;
  toBeRemovedTags: EditTagDTO[];
  totalRecordLength: number;
  leaderDescription: string;
  leaderDataValue: string;
  currentMarcFieldPosition: number;
  overrideMarc21: boolean;
  displayWarnMessage: boolean;
  // selectedField: MarcFieldDTO;
  // selectedTag: string;
  // selectedInd1: MarcIndicatorDTO;
  // selectedInd2: MarcIndicatorDTO;
  // selectedSubField: string;
  // selectedSubelements: MarcSubElementsDTO[];
}

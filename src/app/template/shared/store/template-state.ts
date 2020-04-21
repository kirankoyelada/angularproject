import { TemplateDTO, EditTagDTO } from 'src/app/_dtos/btcat.vm.dtos';

export interface TemplateState {
  template: TemplateDTO;
  toBeRemovedTags: EditTagDTO[];
  totalRecordLength: number;
  leaderDescription: string;
  leaderDataValue: string;
  currentMarcFieldPosition: number;
  isAddNewEnabled: boolean;
}

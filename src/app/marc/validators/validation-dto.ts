import { MarcFieldDTO, MarcBibDataDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { MarcBibData } from '../shared/marc';

export interface ValidationParams {
  controls: string[];
  field?: MarcFieldDTO;
  bibData?: MarcBibDataDTO[];
}

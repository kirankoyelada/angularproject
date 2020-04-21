import { MarcState } from './marc-state';

import { MarcDTO } from 'src/app/_dtos/btcat.vm.dtos';

export interface MergeMarcState extends MarcState {
  source: MarcDTO;
  destination: MarcDTO;
}

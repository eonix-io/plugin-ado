import { IInputBase } from '@eonix-io/client';
import { IInputAppData } from '../../common/IAppData';

export interface IInputMapping {
   [key: string]: IInputBase<IInputAppData>;
}
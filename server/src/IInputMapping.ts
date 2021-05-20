import { IInputBase } from '@eonix-io/client';
import { IInputAppData } from './IAppData';

export interface IInputMapping {
   [key: string]: IInputBase<IInputAppData>;
}
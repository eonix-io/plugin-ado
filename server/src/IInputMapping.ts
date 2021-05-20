import { IInputBase } from '@eonix-io/client';
import { IInputAppData } from '../../common/IAppData';

/** Mapping of schema inputs by their adp reference name */
export interface IInputMapping {
   [key: string]: IInputBase<IInputAppData>;
}
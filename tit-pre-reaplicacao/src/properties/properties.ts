import { Properties } from './server-settings.js';
import { fromProperties } from '@brcap/env';

export const { getProperty } = fromProperties<Properties>();

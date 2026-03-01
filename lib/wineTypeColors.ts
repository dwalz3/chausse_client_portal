import { WineType } from '@/types';

export interface WineTypeColor {
  bg: string;
  text: string;
}

export const WINE_TYPE_COLORS: Record<WineType, WineTypeColor> = {
  Red:       { bg: '#FEE2E2', text: '#991B1B' },
  White:     { bg: '#FEF9C3', text: '#854D0E' },
  Sparkling: { bg: '#DBEAFE', text: '#1E40AF' },
  Orange:    { bg: '#FFEDD5', text: '#9A3412' },
  'Rosé':    { bg: '#FCE7F3', text: '#9D174D' },
  'Tea/NA':  { bg: '#CCFBF1', text: '#134E4A' },
  Vermouth:  { bg: '#EDE9FE', text: '#5B21B6' },
  Other:     { bg: '#F3F4F6', text: '#374151' },
};

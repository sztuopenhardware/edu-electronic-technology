import type { ChapterGroup, CircuitCase } from '../types';
import { CH1_TO_CH3 } from './ch1_ch3';
import { CH4_TO_CH6 } from './ch4_ch6';
import { CH7_TO_CH10 } from './ch7_ch10';
import { LAB_CHAPTER } from './labs';

export const CURRICULUM_CHAPTERS: ChapterGroup[] = [
  ...CH1_TO_CH3,
  ...CH4_TO_CH6,
  ...CH7_TO_CH10,
  LAB_CHAPTER,
];

export const ALL_CASES: CircuitCase[] = CURRICULUM_CHAPTERS.flatMap(
  (ch) => ch.cases
);

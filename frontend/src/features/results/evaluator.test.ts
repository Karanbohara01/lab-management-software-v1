import { describe, it, expect } from 'vitest';
import {
  evaluateFormula,
  evaluateResultFlag,
  evaluateDelta,
  computeCalculatedValues,
} from './evaluator';
import type { ResultValue } from './types';

describe('evaluator', () => {
  describe('evaluateFormula', () => {
    it('evaluates basic arithmetic', () => {
      expect(evaluateFormula('10 + 5 * 2', {})).toBe(20);
      expect(evaluateFormula('(10 + 5) * 2', {})).toBe(30);
      expect(evaluateFormula('100 / 4 - 5', {})).toBe(20);
      expect(evaluateFormula('2 ^ 3', {})).toBe(8);
    });

    it('resolves variables correctly', () => {
      const vars = { TC: 200, HDL: 50, TG: 150 };
      // Friedewald equation: LDL = TC - HDL - (TG / 5)
      expect(evaluateFormula('TC - HDL - TG / 5', vars)).toBe(120);
    });

    it('supports math functions like abs, round, pow, if', () => {
      expect(evaluateFormula('round(12.3456, 2)', {})).toBe(12.35);
      expect(evaluateFormula('abs(-42)', {})).toBe(42);
      expect(evaluateFormula('if(sexF == 1, 85, 100)', { sexF: 1 })).toBe(85);
      expect(evaluateFormula('if(sexF == 1, 85, 100)', { sexF: 0 })).toBe(100);
    });

    it('returns null on division by zero or malformed syntax', () => {
      expect(evaluateFormula('10 / 0', {})).toBeNull();
      expect(evaluateFormula('10 +', {})).toBeNull();
      expect(evaluateFormula('UNKNOWN_VAR * 2', {})).toBeNull();
    });
  });

  describe('evaluateResultFlag', () => {
    const bounds = {
      lowValue: 3.5,
      highValue: 5.0,
      criticalLow: 2.5,
      criticalHigh: 6.5,
    };

    it('identifies normal, low, high, and critical numeric values', () => {
      expect(evaluateResultFlag('4.2', 'NUMERIC', bounds)).toBe('NORMAL');
      expect(evaluateResultFlag('3.1', 'NUMERIC', bounds)).toBe('LOW');
      expect(evaluateResultFlag('2.2', 'NUMERIC', bounds)).toBe('CRITICAL_LOW');
      expect(evaluateResultFlag('5.8', 'NUMERIC', bounds)).toBe('HIGH');
      expect(evaluateResultFlag('7.1', 'NUMERIC', bounds)).toBe('CRITICAL_HIGH');
    });

    it('identifies qualitative flags', () => {
      expect(evaluateResultFlag('Positive', 'CATEGORICAL', {})).toBe('ABNORMAL');
      expect(evaluateResultFlag('Reactive', 'CATEGORICAL', {})).toBe('ABNORMAL');
      expect(evaluateResultFlag('Negative', 'CATEGORICAL', {})).toBe('NORMAL');
      expect(evaluateResultFlag('Non-reactive', 'CATEGORICAL', {})).toBe('NORMAL');
      expect(evaluateResultFlag('', 'CATEGORICAL', {})).toBe('NONE');
    });
  });

  describe('evaluateDelta', () => {
    it('computes delta percent and checks threshold', () => {
      const res = evaluateDelta(15, 10, 20);
      expect(res.deltaPercent).toBe(50);
      expect(res.deltaBreach).toBe(true);

      const res2 = evaluateDelta(11, 10, 20);
      expect(res2.deltaPercent).toBe(10);
      expect(res2.deltaBreach).toBe(false);
    });
  });

  describe('computeCalculatedValues', () => {
    it('computes panel calculated parameters live', () => {
      const values: ResultValue[] = [
        {
          id: 1,
          parameterId: 101,
          parameterCode: 'TP',
          parameterName: 'Total Protein',
          unit: 'g/dL',
          dataType: 'NUMERIC',
          displayOrder: 1,
          valueNumeric: null,
          valueText: null,
          flag: 'NONE',
          referenceText: '6.0 - 8.3',
          previousValue: null,
          deltaPercent: null,
          deltaBreach: false,
          comment: null,
          calculated: false,
          decimalPlaces: 1,
          allowedValues: [],
          method: null,
          groupHeading: null,
        },
        {
          id: 2,
          parameterId: 102,
          parameterCode: 'ALB',
          parameterName: 'Albumin',
          unit: 'g/dL',
          dataType: 'NUMERIC',
          displayOrder: 2,
          valueNumeric: null,
          valueText: null,
          flag: 'NONE',
          referenceText: '3.5 - 5.0',
          previousValue: null,
          deltaPercent: null,
          deltaBreach: false,
          comment: null,
          calculated: false,
          decimalPlaces: 1,
          allowedValues: [],
          method: null,
          groupHeading: null,
        },
        {
          id: 3,
          parameterId: 103,
          parameterCode: 'GLOB',
          parameterName: 'Globulin',
          unit: 'g/dL',
          dataType: 'NUMERIC',
          displayOrder: 3,
          valueNumeric: null,
          valueText: null,
          flag: 'NONE',
          referenceText: '2.0 - 3.5',
          previousValue: null,
          deltaPercent: null,
          deltaBreach: false,
          comment: null,
          calculated: true,
          calculationFormula: 'TP - ALB',
          decimalPlaces: 1,
          allowedValues: [],
          method: null,
          groupHeading: null,
        },
      ];

      const draft = {
        101: '7.5',
        102: '4.5',
      };

      const computed = computeCalculatedValues(values, draft, { gender: 'MALE', ageYears: 35 });
      expect(computed[103]).toBeDefined();
      expect(computed[103]!.value).toBe(3.0);
      expect(computed[103]!.display).toBe('3.0');
    });
  });
});

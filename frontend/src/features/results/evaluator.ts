import type { ParameterDataType } from '@/features/catalog/types';
import type { ResultFlag, ResultValue } from './types';

/**
 * Evaluates a mathematical expression against a dictionary of variables.
 * Compatible with backend FormulaEvaluator (supports +, -, *, /, ^, comparisons, and math functions).
 */
export function evaluateFormula(expression: string | null | undefined, variables: Record<string, number>): number | null {
  if (!expression || !expression.trim()) return null;

  try {
    let pos = 0;
    const src = expression.trim();

    function skipWs() {
      while (pos < src.length && /\s/.test(src.charAt(pos))) {
        pos++;
      }
    }

    function peek(): string {
      skipWs();
      return pos < src.length ? src.charAt(pos) : '';
    }

    function consume(char: string): boolean {
      skipWs();
      if (pos < src.length && src.charAt(pos) === char) {
        pos++;
        return true;
      }
      return false;
    }

    function expect(char: string) {
      if (!consume(char)) {
        throw new Error(`Expected '${char}' at ${pos}`);
      }
    }

    function parseExpression(): number {
      const left = parseAdditive();
      skipWs();
      for (const op of ['<=', '>=', '==', '<', '>']) {
        if (src.startsWith(op, pos)) {
          pos += op.length;
          const right = parseAdditive();
          switch (op) {
            case '<':
              return left < right ? 1 : 0;
            case '>':
              return left > right ? 1 : 0;
            case '<=':
              return left <= right ? 1 : 0;
            case '>=':
              return left >= right ? 1 : 0;
            default:
              return left === right ? 1 : 0;
          }
        }
      }
      return left;
    }

    function parseAdditive(): number {
      let value = parseMultiplicative();
      while (true) {
        skipWs();
        if (consume('+')) {
          value += parseMultiplicative();
        } else if (consume('-')) {
          value -= parseMultiplicative();
        } else {
          return value;
        }
      }
    }

    function parseMultiplicative(): number {
      let value = parsePower();
      while (true) {
        skipWs();
        if (consume('*')) {
          value *= parsePower();
        } else if (consume('/')) {
          const d = parsePower();
          if (d === 0) throw new Error('Division by zero');
          value /= d;
        } else {
          return value;
        }
      }
    }

    function parsePower(): number {
      const base = parseUnary();
      skipWs();
      if (consume('^')) {
        return Math.pow(base, parseUnary());
      }
      return base;
    }

    function parseUnary(): number {
      skipWs();
      if (consume('-')) {
        return -parseUnary();
      }
      if (consume('+')) {
        return parseUnary();
      }
      return parsePrimary();
    }

    function parsePrimary(): number {
      skipWs();
      if (consume('(')) {
        const v = parseExpression();
        expect(')');
        return v;
      }

      const c = peek();
      if (/\d|\./.test(c)) {
        const start = pos;
        while (pos < src.length && /[\d.]/.test(src.charAt(pos))) {
          pos++;
        }
        const num = parseFloat(src.substring(start, pos));
        if (isNaN(num)) throw new Error('Invalid number');
        return num;
      }

      if (/[A-Za-z_]/.test(c)) {
        const start = pos;
        while (pos < src.length && /[A-Za-z0-9_]/.test(src.charAt(pos))) {
          pos++;
        }
        const name = src.substring(start, pos);
        skipWs();
        if (peek() === '(') {
          return callFunction(name);
        }
        if (name in variables && variables[name] != null) {
          return variables[name]!;
        }
        throw new Error(`Unknown variable: ${name}`);
      }

      throw new Error(`Unexpected character: '${c}'`);
    }

    function callFunction(name: string): number {
      expect('(');
      const args: number[] = [];
      skipWs();
      if (peek() !== ')') {
        args.push(parseExpression());
        skipWs();
        while (consume(',')) {
          args.push(parseExpression());
          skipWs();
        }
      }
      expect(')');

      switch (name.toLowerCase()) {
        case 'abs':
          return Math.abs(args[0] ?? 0);
        case 'round': {
          const val = args[0] ?? 0;
          const dec = args[1] != null ? Math.max(0, Math.floor(args[1])) : 0;
          const factor = Math.pow(10, dec);
          return Math.round(val * factor) / factor;
        }
        case 'pow':
          return Math.pow(args[0] ?? 0, args[1] ?? 1);
        case 'min':
          return Math.min(...args);
        case 'max':
          return Math.max(...args);
        case 'exp':
          return Math.exp(args[0] ?? 0);
        case 'ln':
          return Math.log(args[0] ?? 0);
        case 'log10':
          return Math.log10(args[0] ?? 0);
        case 'if':
          return (args[0] ?? 0) !== 0 ? (args[1] ?? 0) : (args[2] ?? 0);
        default:
          throw new Error(`Unknown function: ${name}`);
      }
    }

    const res = parseExpression();
    skipWs();
    if (pos !== src.length || isNaN(res) || !isFinite(res)) {
      return null;
    }
    return res;
  } catch {
    return null;
  }
}

/**
 * Real-time evaluator for clinical result flags based on the value and reference/critical bounds.
 */
export function evaluateResultFlag(
  valueStr: string | null | undefined,
  dataType: ParameterDataType,
  bounds: {
    lowValue?: number | null;
    highValue?: number | null;
    criticalLow?: number | null;
    criticalHigh?: number | null;
  },
): ResultFlag {
  const trimmed = (valueStr ?? '').trim();
  if (!trimmed) return 'NONE';

  if (dataType === 'NUMERIC') {
    const num = Number(trimmed);
    if (isNaN(num)) return 'NONE';

    if (bounds.criticalLow != null && num < bounds.criticalLow) {
      return 'CRITICAL_LOW';
    }
    if (bounds.criticalHigh != null && num > bounds.criticalHigh) {
      return 'CRITICAL_HIGH';
    }
    if (bounds.lowValue != null && num < bounds.lowValue) {
      return 'LOW';
    }
    if (bounds.highValue != null && num > bounds.highValue) {
      return 'HIGH';
    }
    return 'NORMAL';
  }

  // Qualitative evaluations
  const upper = trimmed.toUpperCase();
  if (upper === 'POSITIVE' || upper === 'REACTIVE') {
    return 'ABNORMAL';
  }
  if (upper === 'NEGATIVE' || upper === 'NON-REACTIVE') {
    return 'NORMAL';
  }

  return 'NONE';
}

/**
 * Evaluates delta percentage change against previous patient result.
 */
export function evaluateDelta(
  numericValue: number | null | undefined,
  previousValue: number | null | undefined,
  deltaCheckPercent?: number | null,
): { deltaPercent: number | null; deltaBreach: boolean } {
  if (numericValue == null || previousValue == null || previousValue === 0) {
    return { deltaPercent: null, deltaBreach: false };
  }

  const delta = ((numericValue - previousValue) / Math.abs(previousValue)) * 100;
  const deltaPercent = Number(delta.toFixed(1));
  const threshold = deltaCheckPercent != null ? deltaCheckPercent : 20;
  const deltaBreach = Math.abs(deltaPercent) >= threshold;

  return { deltaPercent, deltaBreach };
}

/**
 * Live multi-pass calculated formula resolver for diagnostic panels.
 */
export function computeCalculatedValues(
  values: ResultValue[],
  draft: Record<number, string>,
  patient: { gender?: string; ageYears?: number | null },
): Record<number, { value: number | null; display: string }> {
  const vars: Record<string, number> = {
    sexM: patient.gender === 'MALE' ? 1 : 0,
    sexF: patient.gender === 'FEMALE' ? 1 : 0,
    age: patient.ageYears ?? 0,
  };

  // 1. Gather all entered numeric values by parameter code
  for (const v of values) {
    if (v.calculated || !v.parameterCode) continue;
    const raw = (draft[v.parameterId] ?? '').trim();
    if (raw !== '') {
      const num = Number(raw);
      if (!isNaN(num)) {
        vars[v.parameterCode] = num;
      }
    }
  }

  const results: Record<number, { value: number | null; display: string }> = {};

  // 2. Perform up to 4 iterative passes to resolve dependencies
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const v of values) {
      if (!v.calculated || !v.calculationFormula) continue;

      const computed = evaluateFormula(v.calculationFormula, vars);
      if (computed != null) {
        let rounded = computed;
        if (v.decimalPlaces != null) {
          const factor = Math.pow(10, v.decimalPlaces);
          rounded = Math.round(computed * factor) / factor;
        }

        const prev = results[v.parameterId]?.value;
        if (prev !== rounded) {
          results[v.parameterId] = {
            value: rounded,
            display: v.decimalPlaces != null ? rounded.toFixed(v.decimalPlaces) : String(rounded),
          };
          if (v.parameterCode) {
            vars[v.parameterCode] = rounded;
          }
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  return results;
}

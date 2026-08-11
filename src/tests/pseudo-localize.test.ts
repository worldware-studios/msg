import { describe, expect, test } from 'vitest';
import {
  pseudoLocalize,
  pseudoLocalizeMF1,
  pseudoLocalizeMF2,
  pseudoLocalizeNone
} from '../lib/pseudo-localize.js';

describe('pseudoLocalize helpers', () => {
  test('pseudoLocalizeMF2 localizes literals and preserves variables', () => {
    const result = pseudoLocalizeMF2('Hello, {$name}!');
    expect(result).toContain('{$name}');
    expect(result).not.toBe('Hello, {$name}!');
    expect(result.startsWith('Ħ') || result.includes('ŀ')).toBe(true);
  });

  test('pseudoLocalizeNone localizes the whole string', () => {
    const result = pseudoLocalizeNone('Hello world');
    expect(result).not.toBe('Hello world');
    expect(result.startsWith('Ħ') || result.includes('ŀ')).toBe(true);
  });

  test('pseudoLocalizeMF1 localizes content and preserves simple placeholders', () => {
    const result = pseudoLocalizeMF1('Hello, {name}!');
    expect(result).toContain('{name}');
    expect(result).not.toBe('Hello, {name}!');
    expect(result.startsWith('Ħ') || result.includes('ŀ')).toBe(true);
  });

  test('pseudoLocalizeMF1 localizes plural arm text and preserves ICU structure', () => {
    const source = '{count, plural, one {# file} other {# files}}';
    const result = pseudoLocalizeMF1(source);

    expect(result).toContain('{count, plural,');
    expect(result).toContain('one {');
    expect(result).toContain('other {');
    expect(result).toContain('#');
    expect(result).not.toBe(source);
    // Literal "file" / "files" should be accented; # and keys stay intact.
    expect(result).toMatch(/#\s+\S+/);
    expect(result.includes('file') || result.includes('files')).toBe(false);
  });

  test('pseudoLocalizeMF1 localizes select arm text and preserves keys', () => {
    const source = '{gender, select, male {He liked this} female {She liked this} other {They liked this}}';
    const result = pseudoLocalizeMF1(source);

    expect(result).toContain('{gender, select,');
    expect(result).toContain('male {');
    expect(result).toContain('female {');
    expect(result).toContain('other {');
    expect(result).not.toBe(source);
    expect(result.includes('liked')).toBe(false);
  });

  test('pseudoLocalizeMF1 does not localize function arg styles', () => {
    const source = 'Total: {amount, number, ::currency/EUR}';
    const result = pseudoLocalizeMF1(source);

    expect(result).toContain('{amount, number, ::currency/EUR}');
    expect(result).not.toBe(source);
    expect(result.startsWith('Ŧ') || result.includes('ǿ')).toBe(true);
  });

  test('pseudoLocalize dispatches by format', () => {
    expect(pseudoLocalize('Hi {$n}', 'MF2')).toContain('{$n}');
    expect(pseudoLocalize('Hi {n}', 'MF1')).toContain('{n}');
    expect(pseudoLocalize('plain', 'NONE')).not.toBe('plain');
  });
});

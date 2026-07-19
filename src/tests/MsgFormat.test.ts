import { describe, expect, test } from 'vitest';
import { MsgProject, MsgProjectData } from '../classes/MsgProject/MsgProject.js';
import { MsgResource } from '../classes/MsgResource/MsgResource.js';
import { MsgMessage } from '../classes/MsgMessage/MsgMessage.js';

const makeProjectData = (format?: 'MF1' | 'MF2' | 'NONE'): MsgProjectData => ({
  project: {
    name: 'format-test',
    version: 1,
    ...(format ? { format } : {})
  },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: { en: ['en'] }
  },
  loader: async () => ({ title: 'T', attributes: { lang: 'en', dir: 'ltr' }, messages: [] })
});

describe('MsgFormat: project-level format', () => {
  test('defaults to MF2 when not configured', () => {
    const project = MsgProject.create(makeProjectData());
    expect(project.format).toBe('MF2');
  });

  test('respects a configured format', () => {
    const project = MsgProject.create(makeProjectData('MF1'));
    expect(project.format).toBe('MF1');
  });
});

describe('MsgFormat: resource inheritance', () => {
  test('resource inherits the project format when unspecified', () => {
    const project = MsgProject.create(makeProjectData('MF1'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);

    expect(resource.attributes.format).toBe('MF1');
  });

  test('resource defaults to MF2 when the project defaults', () => {
    const project = MsgProject.create(makeProjectData());
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);

    expect(resource.attributes.format).toBe('MF2');
  });

  test('resource overrides the inherited project format', () => {
    const project = MsgProject.create(makeProjectData('MF1'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr', format: 'NONE' }
    }, project);

    expect(resource.attributes.format).toBe('NONE');
  });
});

describe('MsgFormat: message inheritance', () => {
  test('message inherits the resource format', () => {
    const project = MsgProject.create(makeProjectData('MF1'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);
    resource.add('key', '{count, plural, one {# file} other {# files}}');

    expect(resource.get('key')?.attributes.format).toBe('MF1');
  });

  test('message overrides the inherited resource format', () => {
    const project = MsgProject.create(makeProjectData('MF1'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);
    resource.add('key', 'raw string', { format: 'NONE' });

    expect(resource.get('key')?.attributes.format).toBe('NONE');
  });
});

describe('MsgFormat: MsgMessage.format', () => {
  test('formats MF2 by default when no format attribute is present', () => {
    const msg = MsgMessage.create({
      key: 'k',
      value: 'Hello',
      attributes: { lang: 'en' }
    });
    expect(msg.format({})).toBe('Hello');
  });

  test('formats an MF2 message when format is MF2', () => {
    const msg = MsgMessage.create({
      key: 'k',
      value: '.input {$count :number}\n .match $count\n one {{One file.}} *{{{$count} files.}}',
      attributes: { lang: 'en', format: 'MF2' }
    });
    expect(msg.format({ count: 1 })).toBe('One file.');
    expect(msg.format({ count: 3 })).toBe('3 files.');
  });

  test('formats an MF1 plural message when format is MF1', () => {
    const msg = MsgMessage.create({
      key: 'k',
      value: '{count, plural, one {# file} other {# files}}',
      attributes: { lang: 'en', format: 'MF1' }
    });
    expect(msg.format({ count: 1 })).toBe('1 file');
    expect(msg.format({ count: 5 })).toBe('5 files');
  });

  test('formats an MF1 select message when format is MF1', () => {
    const msg = MsgMessage.create({
      key: 'k',
      value: '{gender, select, male {He} female {She} other {They}} liked this',
      attributes: { lang: 'en', format: 'MF1' }
    });
    expect(msg.format({ gender: 'female' })).toBe('She liked this');
  });

  test('returns the raw string when format is NONE', () => {
    const raw = '{count, plural, one {# file} other {# files}}';
    const msg = MsgMessage.create({
      key: 'k',
      value: raw,
      attributes: { lang: 'en', format: 'NONE' }
    });
    expect(msg.format({ count: 5 })).toBe(raw);
  });
});

describe('MsgFormat: MsgMessage.formatToParts', () => {
  test('returns MF1 parts when format is MF1', () => {
    const msg = MsgMessage.create({
      key: 'k',
      value: '{count, plural, one {# file} other {# files}}',
      attributes: { lang: 'en', format: 'MF1' }
    });
    const parts = msg.formatToParts({ count: 5 });
    const text = parts.map(p => ('value' in p ? p.value : '')).join('');
    expect(text).toContain('5 files');
  });

  test('returns a single text part when format is NONE', () => {
    const raw = '{count, plural, one {# file} other {# files}}';
    const msg = MsgMessage.create({
      key: 'k',
      value: raw,
      attributes: { lang: 'en', format: 'NONE' }
    });
    expect(msg.formatToParts({})).toStrictEqual([{ type: 'text', value: raw }]);
  });
});

describe('MsgFormat: serialization', () => {
  test('resource omits format when it equals the project format', () => {
    const project = MsgProject.create(makeProjectData('MF2'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);

    const data = resource.getData();
    expect(data.attributes.format).toBeUndefined();
  });

  test('resource includes format when it differs from the project format', () => {
    const project = MsgProject.create(makeProjectData('MF2'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr', format: 'MF1' }
    }, project);

    const data = resource.getData();
    expect(data.attributes.format).toBe('MF1');
  });

  test('message omits format when it equals the resource format but keeps other differing attributes', () => {
    const project = MsgProject.create(makeProjectData('MF1'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);
    // format inherited (MF1, matches resource), but lang differs
    resource.add('key', 'value', { lang: 'fr' });

    const data = resource.getData();
    const msgData = data.messages!.find(m => m.key === 'key')!;
    expect(msgData.attributes?.lang).toBe('fr');
    expect(msgData.attributes?.format).toBeUndefined();
  });

  test('message includes format when it differs from the resource format', () => {
    const project = MsgProject.create(makeProjectData('MF2'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);
    resource.add('key', 'value', { format: 'MF1' });

    const data = resource.getData();
    const msgData = data.messages!.find(m => m.key === 'key')!;
    expect(msgData.attributes?.format).toBe('MF1');
  });

  test('message with fully matching attributes still omits its attributes entirely', () => {
    const project = MsgProject.create(makeProjectData('MF1'));
    const resource = MsgResource.create({
      title: 'R',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);
    resource.add('key', 'value');

    const data = resource.getData();
    const msgData = data.messages!.find(m => m.key === 'key')!;
    expect(msgData.attributes).toBeUndefined();
  });
});

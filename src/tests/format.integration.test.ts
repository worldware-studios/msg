import { describe, expect, test } from 'vitest';
import { MsgProject, MsgProjectData } from '../classes/MsgProject/MsgProject.js';
import { MsgResource, MsgResourceData } from '../classes/MsgResource/MsgResource.js';
import { MsgMessage } from '../classes/MsgMessage/MsgMessage.js';

const projectData = (format?: 'MF1' | 'MF2' | 'NONE'): MsgProjectData => ({
  project: { name: 'app', version: 1, ...(format ? { format } : {}) },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: { en: ['en'], zh: ['zh'] }
  },
  loader: async () => ({ title: 'T', attributes: { lang: 'en', dir: 'ltr' }, messages: [] })
});

describe('format integration: mixed MF1/MF2/NONE within one project', () => {
  test('formats each message according to its resolved format', () => {
    // Project defaults to MF1; resource inherits it.
    const project = MsgProject.create(projectData('MF1'));
    const resource = MsgResource.create({
      title: 'Home',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);

    resource.add('files', '{count, plural, one {# file} other {# files}}'); // inherits MF1
    resource.add('raw', 'literal {value}', { format: 'NONE' });             // NONE override
    resource.add('greeting', 'Hello!', { format: 'MF2' });                  // MF2 override

    expect(resource.get('files')?.format({ count: 2 })).toBe('2 files');
    expect(resource.get('raw')?.format({ value: 'x' })).toBe('literal {value}');
    expect(resource.get('greeting')?.format({})).toBe('Hello!');
  });

  test('serializes with inherited formats omitted and overrides retained, and round-trips', () => {
    const project = MsgProject.create(projectData('MF1'));
    const resource = MsgResource.create({
      title: 'Home',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);

    resource.add('files', '{count, plural, one {# file} other {# files}}'); // inherits MF1
    resource.add('raw', 'literal', { format: 'NONE' });                     // NONE override

    const data = resource.getData();

    // Resource format equals the project's -> omitted.
    expect(data.attributes.format).toBeUndefined();

    const files = data.messages!.find(m => m.key === 'files')!;
    const raw = data.messages!.find(m => m.key === 'raw')!;
    // 'files' inherits the resource format -> attributes omitted entirely.
    expect(files.attributes).toBeUndefined();
    // 'raw' differs -> format retained.
    expect(raw.attributes?.format).toBe('NONE');

    // Round-trip: rebuild from serialized data under the same project.
    const rebuilt = MsgResource.create(data as MsgResourceData, project);
    expect(rebuilt.get('files')?.format({ count: 1 })).toBe('1 file');
    expect(rebuilt.get('raw')?.format({})).toBe('literal');
  });

  test('MF2 remains the default so existing behavior is unchanged', () => {
    const project = MsgProject.create(projectData()); // no format -> MF2
    const resource = MsgResource.create({
      title: 'Home',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);
    resource.add('m', '.input {$n :number}\n .match $n\n one {{1 item}} *{{{$n} items}}');

    expect(resource.get('m')?.attributes.format).toBe('MF2');
    expect(resource.get('m')?.format({ n: 4 })).toBe('4 items');
  });

  test('format survives an end-to-end translate round-trip', () => {
    const project = MsgProject.create(projectData('MF1'));
    const source = MsgResource.create({
      title: 'Home',
      attributes: { lang: 'en', dir: 'ltr' },
      messages: [
        { key: 'files', value: '{count, plural, one {# file} other {# files}}' }
      ]
    }, project);

    const translated = source.translate({
      title: 'Home',
      attributes: { lang: 'zh', dir: 'ltr' },
      messages: [
        { key: 'files', value: '{count, plural, other {# 个文件}}' }
      ]
    });

    expect(translated.get('files')?.attributes.format).toBe('MF1');
    // Still formatted as MF1 (the plural resolves); bidi isolation chars may
    // wrap the number since the translated message carries no explicit lang.
    const formatted = translated.get('files')?.format({ count: 3 });
    expect(formatted).toContain('3');
    expect(formatted).toContain('个文件');
  });
});

describe('format coverage: default fallbacks', () => {
  test('project format falls back to MF2 when explicitly undefined', () => {
    const data = projectData();
    data.project.format = undefined;
    const project = MsgProject.create(data);
    expect(project.format).toBe('MF2');
  });

  test('a message without a format attribute resolves to MF2 on serialization', () => {
    const project = MsgProject.create(projectData());
    const resource = MsgResource.create({
      title: 'Home',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);

    // Insert a message that carries no format attribute at all.
    const bare = MsgMessage.create({ key: 'bare', value: 'x', attributes: { lang: 'en', dir: 'ltr', dnt: false } });
    resource.set('bare', bare);

    const data = resource.getData();
    const bareData = data.messages!.find(m => m.key === 'bare')!;
    // resolves to MF2 (resource default) -> attributes omitted as fully matching.
    expect(bareData.attributes).toBeUndefined();
  });

  test('a matching message with notes retains its notes on serialization', () => {
    const project = MsgProject.create(projectData());
    const resource = MsgResource.create({
      title: 'Home',
      attributes: { lang: 'en', dir: 'ltr' }
    }, project);
    resource.add('m', 'value', undefined, [{ type: 'DESCRIPTION', content: 'note' }]);

    const data = resource.getData();
    const msgData = data.messages!.find(m => m.key === 'm')!;
    expect(msgData.attributes).toBeUndefined();
    expect(msgData.notes).toStrictEqual([{ type: 'DESCRIPTION', content: 'note' }]);
  });
});

import { describe, expect, test } from 'vitest';
import { MsgProject, type MsgProjectData } from '../classes/MsgProject/MsgProject.js';
import { MsgResource, type MsgResourceData } from '../classes/MsgResource/MsgResource.js';
import { MsgMessage } from '../classes/MsgMessage/MsgMessage.js';

/**
 * End-to-end flow for typed message keys (issue #73): a typed source resource
 * with dot-separated keys, translations loaded from JSON fixtures through a
 * fallback chain, and the nested tree view on the result.
 *
 * Fixtures live in res/l10n/translations/tree/. zh adds a stale key that the
 * source no longer has; zh-HK adds a key that would collide with the `home`
 * branch. Both must be ignored rather than added or thrown.
 */
const projectData: MsgProjectData = {
  project: { name: 'tree', version: 1 },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: {
      en: ['en'],
      zh: ['zh'],
      'zh-HK': ['zh', 'zh-HK']
    }
  },
  loader: async (project: string, title: string, lang: string) => {
    const path = `../../res/l10n/translations/${project}/${lang}/${title}.json`;
    const data: MsgResourceData = (await import(path)).default;
    return data;
  }
};

// MF2 wraps substituted values in bidi isolation marks (U+2068/U+2069) by
// default; disable them so assertions compare the visible text.
const plain = { bidiIsolation: 'none' } as const;

const createHome = () => MsgResource.create({
  title: 'Home',
  attributes: { lang: 'en', dir: 'ltr' },
  notes: [{ type: 'DESCRIPTION', content: 'Home page strings.' }],
  messages: [
    { key: 'home.title', value: 'Welcome' },
    { key: 'home.cta.label', value: 'Hi, {$name}', notes: [{ type: 'PARAMETERS', content: '{$name} is the user name.' }] },
    { key: 'home.files', value: '{count, plural, one {# file} other {# files}}', attributes: { format: 'MF1' } },
    { key: 'footer', value: 'Footer' }
  ] as const
}, MsgProject.create(projectData));

describe('tree integration: typed resource through translation', () => {
  test('source tree formats messages through nested access', () => {
    const tree = createHome().toTree();

    expect(tree.home.title.format({})).toBe('Welcome');
    expect(tree.home.cta.label.format({ name: 'Ada' }, plain)).toBe('Hi, Ada');
    expect(tree.home.files.format({ count: 2 })).toBe('2 files');
    expect(tree.footer.toString()).toBe('Footer');
  });

  test('a single-locale translation replaces values and drops stale keys', async () => {
    const zh = await createHome().getTranslation('zh');

    expect([...zh.keys()].sort()).toEqual(['footer', 'home.cta.label', 'home.files', 'home.title']);
    expect((zh as MsgResource).has('home.stale')).toBe(false);

    const tree = zh.toTree();
    expect(tree.home.title.value).toBe('欢迎');
    expect(tree.home.cta.label.format({ name: 'Ada' }, plain)).toBe('你好，Ada');
    // The source message's MF1 format carries over to the translation.
    expect(tree.home.files.attributes.format).toBe('MF1');
    expect(tree.home.files.format({ count: 3 })).toBe('3 个文件');
    expect(Object.keys(tree.home).sort()).toEqual(['cta', 'files', 'title']);
  });

  test('a fallback chain layers translations and ignores a colliding unknown key', async () => {
    const zhHK = await createHome().getTranslation('zh-HK');
    const tree = zhHK.toTree();

    expect(zhHK.size).toBe(4);
    expect(zhHK.attributes.lang).toBe('zh-HK');
    // zh-HK overrides zh for home.title; everything else falls back to zh.
    expect(tree.home.title.value).toBe('歡迎');
    expect(tree.home.cta.label.value).toBe('你好，{$name}');
    expect(tree.footer.value).toBe('页脚');
    // `home` stays a branch: the fixture's conflicting `home` message is ignored.
    expect(tree.home).not.toBeInstanceOf(MsgMessage);
    // Notes travel with the source messages through every layer.
    expect(tree.home.cta.label.notes).toEqual([{ type: 'PARAMETERS', content: '{$name} is the user name.' }]);
    expect(zhHK.notes).toEqual([{ type: 'DESCRIPTION', content: 'Home page strings.' }]);
  });

  test('f() and s() aliases work on source, translated, fallback and pseudo trees', async () => {
    const source = createHome();
    const zh = await source.getTranslation('zh');
    const resources = [
      source,
      zh,
      await source.getTranslation('zh-HK'),
      await source.getTranslation('en-XA')
    ];

    for (const resource of resources) {
      const tree = resource.toTree();
      expect(tree.home.cta.label.f({ name: 'Ada' }, plain)).toBe(tree.home.cta.label.format({ name: 'Ada' }, plain));
      expect(tree.home.files.f({ count: 3 })).toBe(tree.home.files.format({ count: 3 }));
      expect(tree.home.title.s()).toBe(tree.home.title.toString());
      expect(tree.footer.s()).toBe(tree.footer.value);
    }

    const zhTree = zh.toTree();
    expect(zhTree.home.cta.label.f({ name: 'Ada' }, plain)).toBe('你好，Ada');
    expect(zhTree.home.files.f({ count: 3 })).toBe('3 个文件');
    expect(zhTree.footer.s()).toBe('页脚');
  });

  test('pseudo-localization keeps the tree shape and placeholders', async () => {
    const pseudo = await createHome().getTranslation('en-XA');
    const tree = pseudo.toTree();

    expect(Object.keys(tree).sort()).toEqual(['footer', 'home']);
    expect(tree.home.title.value).not.toBe('Welcome');
    expect(tree.home.title.attributes.lang).toBe('en-XA');
    expect(tree.home.cta.label.format({ name: 'Ada' })).toContain('Ada');
    expect(tree.home.files.format({ count: 1 })).toContain('1');
  });

  test('serialized data round-trips to an equivalent tree', () => {
    const source = createHome();
    const rebuilt = MsgResource.create(source.getData(), source.getProject());

    expect([...rebuilt.keys()]).toEqual([...source.keys()]);
    const tree = rebuilt.toTree();
    expect(tree.home.cta.label.format({ name: 'Ada' }, plain)).toBe('Hi, Ada');
    expect(tree.home.files.format({ count: 1 })).toBe('1 file');
  });

  test('a cloned resource keeps its keys and stays collision-checked', async () => {
    const clone = await createHome().getTranslation();

    expect([...clone.keys()].sort()).toEqual(['footer', 'home.cta.label', 'home.files', 'home.title']);
    expect(() => clone.add('home', 'conflict')).toThrow(TypeError);
  });
});

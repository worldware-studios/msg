import { describe, expect, test } from 'vitest';
import { MsgResource, type MsgTreeNode } from '../classes/MsgResource/MsgResource.js';
import { MsgMessage } from '../classes/MsgMessage/MsgMessage.js';
import { MsgProject, type MsgProjectData } from '../classes/MsgProject/MsgProject.js';

const projectData: MsgProjectData = {
  project: { name: 'tree-test', version: 1 },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: { en: ['en'], zh: ['zh'] }
  },
  loader: async () => ({ title: 'Tree', attributes: { lang: 'zh' }, messages: [] })
};

const makeResource = (keys: string[]) => {
  const project = MsgProject.create(projectData);
  const resource: MsgResource = MsgResource.create({ title: 'Tree', attributes: { lang: 'en' } }, project);
  keys.forEach(key => resource.add(key, `value of ${key}`));
  return resource;
};

describe('MsgResource: toTree', () => {
  test('nests dot-separated keys into branches', () => {
    const project = MsgProject.create(projectData);
    const resource = MsgResource.create({
      title: 'Tree',
      attributes: { lang: 'en' },
      messages: [
        { key: 'home.title', value: 'Home' },
        { key: 'home.cta.label', value: 'Go' },
        { key: 'footer', value: 'Footer' }
      ]
    }, project);

    const tree = resource.toTree();

    expect(tree.home.title).toBeInstanceOf(MsgMessage);
    expect(tree.home.title.value).toBe('Home');
    expect(tree.home.cta.label.value).toBe('Go');
    expect(tree.footer.value).toBe('Footer');
    expect(Object.keys(tree).sort()).toEqual(['footer', 'home']);
    expect(Object.keys(tree.home).sort()).toEqual(['cta', 'title']);
  });

  test('returns the same MsgMessage instances the resource stores', () => {
    const resource = makeResource(['a.b']);
    const branch = resource.toTree()['a'] as MsgTreeNode;
    expect(branch['b']).toBe(resource.get('a.b'));
  });

  test('keeps single-segment keys at the top level', () => {
    const tree = makeResource(['test-1', 'test-2']).toTree();
    expect(Object.keys(tree).sort()).toEqual(['test-1', 'test-2']);
    expect((tree['test-1'] as MsgMessage).value).toBe('value of test-1');
  });

  test('returns an empty tree for an empty resource', () => {
    expect(Object.keys(makeResource([]).toTree())).toEqual([]);
  });

  test('handles keys that shadow Object.prototype members', () => {
    const tree = makeResource(['constructor.title', 'toString', '__proto__.x', 'hasOwnProperty.y']).toTree();
    const ctor = tree['constructor'] as MsgTreeNode;
    expect((ctor['title'] as MsgMessage).value).toBe('value of constructor.title');
    expect((tree['toString'] as MsgMessage).value).toBe('value of toString');
    const proto = tree['__proto__'] as MsgTreeNode;
    expect((proto['x'] as MsgMessage).value).toBe('value of __proto__.x');
    expect(Object.keys(tree).sort()).toEqual(['__proto__', 'constructor', 'hasOwnProperty', 'toString']);
  });

  test('keeps empty segments as empty-string nodes', () => {
    const tree = makeResource(['a..b', '.lead']).toTree();
    const a = tree['a'] as MsgTreeNode;
    const empty = a[''] as MsgTreeNode;
    expect((empty['b'] as MsgMessage).value).toBe('value of a..b');
    const root = tree[''] as MsgTreeNode;
    expect((root['lead'] as MsgMessage).value).toBe('value of .lead');
  });

  test('reflects the resource at call time', () => {
    const resource = makeResource(['a.b']);
    const before = resource.toTree();
    resource.add('a.c', 'later');
    expect(Object.keys(before['a'] as MsgTreeNode)).toEqual(['b']);
    expect(Object.keys(resource.toTree()['a'] as MsgTreeNode).sort()).toEqual(['b', 'c']);
  });
});

describe('MsgResource: leaf/branch collisions', () => {
  test('adding a branch under an existing leaf throws', () => {
    const resource = makeResource(['a']);
    expect(() => resource.add('a.b', 'x')).toThrow(TypeError);
  });

  test('adding a leaf where a branch exists throws', () => {
    const resource = makeResource(['a.b']);
    expect(() => resource.add('a', 'x')).toThrow(TypeError);
  });

  test('collisions are detected at any depth', () => {
    const resource = makeResource(['a.b.c']);
    expect(() => resource.add('a.b', 'x')).toThrow(TypeError);
    expect(() => resource.add('a', 'x')).toThrow(TypeError);
    expect(() => resource.add('a.b.c.d', 'x')).toThrow(TypeError);
  });

  test('the error message names both keys', () => {
    const resource = makeResource(['a.b']);
    expect(() => resource.add('a', 'x')).toThrow(/"a".*"a\.b"|"a\.b".*"a"/);
  });

  test('a failed add leaves the resource unchanged', () => {
    const resource = makeResource(['a.b']);
    expect(() => resource.add('a', 'x')).toThrow(TypeError);
    expect([...resource.keys()]).toEqual(['a.b']);
    expect(() => resource.add('a.c', 'y')).not.toThrow();
  });

  test('create() throws when its messages collide', () => {
    const project = MsgProject.create(projectData);
    expect(() => MsgResource.create({
      title: 'Tree',
      attributes: {},
      messages: [{ key: 'a', value: '1' }, { key: 'a.b', value: '2' }]
    }, project)).toThrow(TypeError);
  });

  test('set() enforces collisions too', () => {
    const resource = makeResource(['a.b']);
    const msg = MsgMessage.create({ key: 'a', value: 'x' });
    expect(() => resource.set('a', msg)).toThrow(TypeError);
  });

  test('siblings and prefix-like names that are not segments do not collide', () => {
    expect(() => makeResource(['a.b', 'a.c', 'ab', 'a.bc', 'b'])).not.toThrow();
  });

  test('replacing an existing key is not a collision', () => {
    const resource = makeResource(['a.b']);
    expect(() => resource.add('a.b', 'replaced')).not.toThrow();
    expect(resource.get('a.b')?.value).toBe('replaced');
  });

  test('delete() frees the key path', () => {
    const resource = makeResource(['a.b', 'a.c']);
    resource.delete('a.b');
    expect(() => resource.add('a', 'x')).toThrow(TypeError); // a.c still uses branch "a"
    resource.delete('a.c');
    expect(() => resource.add('a', 'x')).not.toThrow();
    expect(resource.delete('missing')).toBe(false);
  });

  test('clear() frees every key path', () => {
    const resource = makeResource(['a.b']);
    resource.clear();
    expect(() => resource.add('a', 'x')).not.toThrow();
  });
});

describe('MsgResource: translate ignores unknown keys', () => {
  test('keys missing from the source resource are not added', () => {
    const resource = makeResource(['greeting']);
    const translated = resource.translate({
      title: 'Tree',
      attributes: { lang: 'zh' },
      messages: [
        { key: 'greeting', value: '你好' },
        { key: 'stale', value: '旧' }
      ]
    });

    expect(translated.size).toBe(1);
    expect(translated.get('greeting')?.value).toBe('你好');
    expect(translated.has('stale')).toBe(false);
  });

  test('an unknown key that would collide with a source key is ignored, not thrown', () => {
    const resource = makeResource(['a.b']);
    expect(() => resource.translate({
      title: 'Tree',
      attributes: { lang: 'zh' },
      messages: [{ key: 'a', value: 'x' }]
    })).not.toThrow();
  });

  test('getTranslation() drops keys only the translation file has', async () => {
    const project = MsgProject.create({
      ...projectData,
      loader: async () => ({
        title: 'Tree',
        attributes: { lang: 'zh' },
        messages: [{ key: 'greeting', value: '你好' }, { key: 'extra', value: '额外' }]
      })
    });
    const resource = MsgResource.create({
      title: 'Tree',
      attributes: { lang: 'en' },
      messages: [{ key: 'greeting', value: 'Hello' }]
    }, project);

    const translated = await resource.getTranslation('zh');

    expect([...translated.keys()]).toEqual(['greeting']);
    expect(translated.toTree().greeting.value).toBe('你好');
  });
});

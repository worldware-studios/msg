/**
 * Type-level tests for typed message keys (issue #73). These run under
 * Vitest's typecheck mode and are also covered by `npx tsc --noEmit`.
 */
import { describe, expectTypeOf, test } from 'vitest';
import { MsgResource, type MsgResourceData, type MsgTree, type MsgTreeNode } from '../classes/MsgResource/MsgResource.js';
import { MsgMessage } from '../classes/MsgMessage/MsgMessage.js';
import { MsgProject } from '../classes/MsgProject/MsgProject.js';

declare const project: MsgProject;

const typed = MsgResource.create({
  title: 'Typed',
  attributes: { lang: 'en' },
  messages: [
    { key: 'home.title', value: 'Home' },
    { key: 'home.cta.label', value: 'Go', notes: [{ type: 'DESCRIPTION', content: 'Button label' }] },
    { key: 'footer', value: 'Footer', attributes: { format: 'NONE' } }
  ] as const
}, project);

type TypedKeys = 'home.title' | 'home.cta.label' | 'footer';

describe('MsgResource key inference', () => {
  test('create() infers the key union when messages are `as const`', () => {
    expectTypeOf(typed).toEqualTypeOf<MsgResource<TypedKeys>>();
  });

  test('create() infers keys from a fully `as const` definition, including notes', () => {
    const definition = {
      title: 'Const',
      attributes: { lang: 'en', dir: 'ltr' },
      notes: [{ type: 'DESCRIPTION', content: 'Resource note' }],
      messages: [{ key: 'a.b', value: 'x' }, { key: 'c', value: 'y' }]
    } as const;
    expectTypeOf(MsgResource.create(definition, project)).toEqualTypeOf<MsgResource<'a.b' | 'c'>>();
  });

  test('inline messages without `as const` stay untyped, so existing code keeps compiling', () => {
    const resource = MsgResource.create({
      title: 'Inline',
      attributes: { lang: 'en' },
      messages: [{ key: 'greeting', value: 'Hello' }]
    }, project);
    expectTypeOf(resource).toEqualTypeOf<MsgResource<string>>();
    // The GETTING_STARTED pattern: add() more keys, then get() them.
    resource.add('files', '{count, plural, other {# files}}', { format: 'MF1' });
    expectTypeOf(resource.get('files')).toEqualTypeOf<MsgMessage | undefined>();
  });

  test('annotated MsgResourceData, message-less and empty data stay untyped', () => {
    const data: MsgResourceData = { title: 'Wide', attributes: {} };
    expectTypeOf(MsgResource.create(data, project)).toEqualTypeOf<MsgResource<string>>();
    expectTypeOf(MsgResource.create({ title: 'Empty', attributes: {} }, project)).toEqualTypeOf<MsgResource<string>>();
    expectTypeOf(MsgResource.create({ title: 'Empty', attributes: {}, messages: [] as const }, project)).toEqualTypeOf<MsgResource<string>>();
  });

  test('get() and has() accept known keys and reject unknown ones', () => {
    expectTypeOf(typed.get('home.title')).toEqualTypeOf<MsgMessage | undefined>();
    // @ts-expect-error unknown key
    typed.get('home.titel');
    // @ts-expect-error unknown key
    typed.has('nope');
  });

  test('add() still accepts any string and keeps the resource type', () => {
    expectTypeOf(typed.add('extra', 'Extra')).toEqualTypeOf<MsgResource<TypedKeys>>();
  });

  test('a typed resource is assignable to a plain MsgResource', () => {
    const plain: MsgResource = typed;
    const list: MsgResource[] = [typed];
    expectTypeOf(plain).toEqualTypeOf<MsgResource<string>>();
    expectTypeOf(list).toEqualTypeOf<MsgResource[]>();
  });

  test('translate() and getTranslation() preserve the key type', () => {
    expectTypeOf(typed.translate({ title: 'Typed', attributes: {} })).toEqualTypeOf<MsgResource<TypedKeys>>();
    expectTypeOf(typed.getTranslation('zh')).toEqualTypeOf<Promise<MsgResource<TypedKeys>>>();
    expectTypeOf(typed.getData().messages).toEqualTypeOf<{ key: TypedKeys; value: string; attributes?: MsgResourceData['attributes']; notes?: MsgResourceData['notes'] }[] | undefined>();
  });
});

describe('MsgTree', () => {
  test('maps flat, nested and mixed-depth keys to a nested type', () => {
    expectTypeOf<MsgTree<'footer'>>().toEqualTypeOf<{ readonly footer: MsgMessage }>();
    expectTypeOf<MsgTree<TypedKeys>['home']['cta']['label']>().toEqualTypeOf<MsgMessage>();
    expectTypeOf<MsgTree<TypedKeys>['footer']>().toEqualTypeOf<MsgMessage>();
    expectTypeOf<keyof MsgTree<TypedKeys>>().toEqualTypeOf<'home' | 'footer'>();
    expectTypeOf<keyof MsgTree<TypedKeys>['home']>().toEqualTypeOf<'title' | 'cta'>();
  });

  test('MsgTree<string> is MsgTreeNode', () => {
    expectTypeOf<MsgTree<string>>().toEqualTypeOf<MsgTreeNode>();
  });

  test('toTree() is typed from the resource keys', () => {
    const tree = typed.toTree();
    expectTypeOf(tree).toEqualTypeOf<MsgTree<TypedKeys>>();
    expectTypeOf(tree.home.cta.label).toEqualTypeOf<MsgMessage>();
    // @ts-expect-error unknown branch
    tree.home.titel;
  });

  test('toTree() on an untyped resource returns MsgTreeNode', () => {
    const plain: MsgResource = typed;
    expectTypeOf(plain.toTree()).toEqualTypeOf<MsgTreeNode>();
  });
});

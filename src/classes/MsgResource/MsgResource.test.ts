import { expect, test } from 'vitest';
import { MsgResource } from './MsgResource';
import loader from '../../../res/l10n/translations';
import * as translationData from '../../../res/l10n/translations/zh/TestResource.json'
import { testData } from "../../test/test-data";

test('MsgResource: "create" static method.', () => {
  const res = MsgResource.create(testData, loader);

  expect(res.title).toBe('TestResource');
  expect(res.attributes.lang).toBe('en');
  expect(res.attributes.dir).toBe('ltr');
  expect(res.attributes.dnt).toBe(false);

  expect(res.notes.length).toBe(testData.notes?.length);
  expect(res.notes[1].type).toBe('AUTHORSHIP');

  expect(res.size).toBe(testData.messages?.length);

  const test1 = res.get('test-1');

  expect(test1?.value).toBe('This is test 1');
  expect(test1?.lang).toBe('en');
  expect(test1?.dir).toBe('ltr');
  expect(test1?.dnt).toBe(false);
  expect(test1?.notes[0].type).toBe('DESCRIPTION');

});

test('MsgResource: "add" public method.', () => {
  const res = MsgResource.create(testData, loader);

  res.add(
    'test-4',
    '.input {$count :number}\n{{This is test {$count}}}',
    {dnt: true},
    [{type: 'PARAMETERS', content: 'the $count parameter is for the count'}]
  );
  
  const msg = res.get('test-4');
  
  expect(msg?.key).toBe('test-4');
  expect(msg?.value).toBe('.input {$count :number}\n{{This is test {$count}}}');
  expect(msg?.format({count: 4})).toBe('This is test 4');
  expect(msg?.dnt).toBe(true);
  expect(msg?.notes[0].type).toBe('PARAMETERS');

});

test('MsgResource: getters and setters', () => {
  const res = MsgResource.create(testData, loader);
  res.attributes = {
    dnt: true
  };
  expect(res.attributes.dnt).toBe(true);
  res.attributes = {};
  res.attributes = {
    lang: 'en'
  };
  expect(res.attributes.lang).toBe('en');
  res.attributes = {};
  res.attributes = {
    dir: 'ltr'
  };
  expect(res.attributes.dir).toBe('ltr');

  res.title = 'NewTitle';
  expect(res.title).toBe('NewTitle');
  res.notes = [];
  expect(res.notes).toStrictEqual([]);

})

test('MsgResource: "translate" public method.', () => {
  const res = MsgResource.create(testData,loader);
  const translated = res.translate(translationData);

  expect(translated.attributes.lang).toBe('zh');

  const msg = translated.get('test-1');
  expect(msg?.value).toBe('这是测试 1');
  expect(translated.get('test-3')?.value).not.toBeUndefined();
  expect(translated.get('test-3')?.value).toBe('This is test 3');

  const data = translated.getData(true);

  data.title = 'ModifiedResourceTitle';

  expect(() => res.translate(data)).toThrow();
});

test('MsgResoure: "getTranslation" public method.', async () => {
  const res = MsgResource.create(testData, loader);
  const translated = await res.getTranslation('zh');
  expect(translated.attributes.lang).toBe('zh');
})

test('MsgResource: "toJSON" public method', () => {
  const res = MsgResource.create(testData, loader);
  expect(res.toJSON()).toBe(JSON.stringify(res.getData(), null, 2));
});

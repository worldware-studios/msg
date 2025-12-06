import { expect, test } from 'vitest';
import { MsgResource, type MsgResourceData } from './MsgResource';

const testData: MsgResourceData = {
  title: 'TestResource',
  attributes: {
    lang: 'en',
    dir: 'ltr'
  },
  notes: [
    {type: 'DESCRIPTION', content: 'This is test data'},
    {type: 'AUTHORSHIP', content: 'Mr. Tester'}
  ],
  messages: [
    {
      key: 'test-1',
      value: 'This is test 1',
      notes: [
        {type: 'DESCRIPTION', content: 'This is the test-1 message.'}
      ]
    },
    {
      key: 'test-2',
      value: 'This is test 2',
      notes: [
        {type: 'DESCRIPTION', content: 'This is the test-2 message.'}
      ]
    },
    {
      key: 'test-3',
      value: 'This is test 3',
      notes: [
        {type: 'DESCRIPTION', content: 'This is the test-3 message.'}
      ]
    }
  ]
}

console.log(JSON);

const translationData: MsgResourceData = {
  title: 'TestResource',
  attributes: {
    lang: 'zh',
    dir: 'ltr',
  },
  messages: [
    {
      key: 'test-1',
      value: '这是测试 1'
    },
    {
      key: 'test-2',
      value: '这是测试 2'
    }
  ]
}


test('MsgResource: "create" static method.', () => {
  const res = MsgResource.create(testData);

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
  const res = MsgResource.create(testData);

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
  const res = MsgResource.create(testData);
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
  const res = MsgResource.create(testData);
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

test('MsgResource: "toJSON" public method', () => {
  const res = MsgResource.create(testData);
  expect(res.toJSON()).toBe(JSON.stringify(res.getData(), null, 2));
});





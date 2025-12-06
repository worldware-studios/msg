import { expect, test } from 'vitest';
import { MsgMessage } from './MsgMessage';
import { DEFAULT_ATTRIBUTES, MsgAttributes } from '../MsgInterface';

test('Create with just key and value', () => {
  const msg1 = MsgMessage.create({
    key: 'my-key',
    value: 'My Value'
  });

  expect(msg1.key).toBe('my-key');
  expect(msg1.value).toBe('My Value');
  expect(msg1.lang).toBe('');
  expect(msg1.dir).toBe('');
  expect(msg1.dnt).toBe(false);
  expect(msg1.notes).toStrictEqual([]);

  msg1.key = 'my-key-1';
  msg1.value = 'My Value 1';

  expect(msg1.key).toBe('my-key-1');
  expect(msg1.value).toBe('My Value 1');
});

test('Create with full attributes', () => {
  const msg2 = MsgMessage.create({
    key: 'my-key',
    value: 'My Value',
    attributes: {
      lang: 'ar',
      dir: 'rtl',
      dnt: false
    }
  });

  expect(msg2.key).toBe('my-key');
  expect(msg2.value).toBe('My Value');
  expect(msg2.lang).toBe('ar');
  expect(msg2.dir).toBe('rtl');
  expect(msg2.dnt).toBe(false);
  expect(msg2.notes).toStrictEqual([]);

  msg2.dir = 'ltr';
  expect(msg2.dir).toBe('ltr');

});

test('Create with partial attributes', () => {
  const msg3 = MsgMessage.create({
    key: 'my-key',
    value: 'My Value',
    attributes: {
      lang: 'fr'
    }
  });

  expect(msg3.key).toBe('my-key');
  expect(msg3.value).toBe('My Value');
  expect(msg3.lang).toBe('fr');
  expect(msg3.dir).toBe('');
  expect(msg3.dnt).toBe(false);
  expect(msg3.notes).toStrictEqual([]);

});

test('Create with notes', () => {
  const msg4 = MsgMessage.create({
    key: 'my-key',
    value: 'My Value',
    notes: [
      {type: 'DESCRIPTION', content: 'This is a test description'}
    ]
  });

  expect(msg4.key).toBe('my-key');
  expect(msg4.value).toBe('My Value');
  expect(msg4.lang).toBe('');
  expect(msg4.dir).toBe('');
  expect(msg4.dnt).toBe(false);
  expect(msg4.notes).toStrictEqual([{type: 'DESCRIPTION', content: 'This is a test description'}]);
  expect(msg4.notes.length).toBe(1);

});


test('Test format', () => {
  const msg4 = MsgMessage.create({
    key: 'parameterized-key',
    value: '.input {$count :number}\n .match $count\n one {{I have one file.}} *{{I have {$count} files.}}',
    attributes: {
      lang: 'en',
      dir: 'ltr',
      dnt: false
    },
    notes: [
      {type: 'DESCRIPTION', content: 'This is a test description'}
    ]
  });

  expect(msg4.key).toBe('parameterized-key');
  expect(msg4.value).toBe('.input {$count :number}\n .match $count\n one {{I have one file.}} *{{I have {$count} files.}}');

  expect(msg4.format({count: 1})).toBe('I have one file.')
  expect(msg4.format({count: 5})).toBe('I have 5 files.')


});

test('Test formatToParts', () => {
  const msg4 = MsgMessage.create({
    key: 'parameterized-key',
    value: '.input {$count :number}\n .match $count\n one {{I have one file.}} *{{I have {$count} files.}}',
    attributes: {
      lang: 'en',
      dir: 'ltr',
      dnt: false
    },
    notes: [
      {type: 'DESCRIPTION', content: 'This is a test description'}
    ]
  });

  expect(msg4.key).toBe('parameterized-key');
  expect(msg4.value).toBe('.input {$count :number}\n .match $count\n one {{I have one file.}} *{{I have {$count} files.}}');
  expect(msg4.formatToParts({count: 1})).toStrictEqual(
    [
      {
        "type": "text",
        "value": "I have one file.",
      }
    ]
  );
  expect(msg4.formatToParts({count: 5})).toStrictEqual(
    [
      {
        "type": "text",
        "value": "I have ",
      },
      {
        "dir": "ltr",
        "locale": "en",
        "parts": [
          {
            "type": "integer",
            "value": "5",
          },
        ],
        "source": "$count",
        "type": "number",
      },
      {
        "type": "text",
        "value": " files.",
      }
    ]
  );
});

test('Test attributes', () => {
  const msg5 = MsgMessage.create({
    key: 'my-key',
    value: 'My Value'
  });

  expect(msg5.attributes).toStrictEqual(DEFAULT_ATTRIBUTES);

  const altered: MsgAttributes = {
    lang: 'fr'
  }
  msg5.attributes = altered;

  expect(msg5.lang).toBe('fr');

  msg5.dnt = true;

  expect(msg5.dnt).toBe(true)

  msg5.lang = 'en';

  expect(msg5.lang).toBe('en');
});

test('Test generic functions', () => {
  const msg6 = MsgMessage.create({
    key: 'my-key',
    value: 'My Value'
  });

  expect(msg6.toString()).toBe('My Value')
  expect(msg6.toJSON()).toBe(
`{
  "key": "my-key",
  "value": "My Value",
  "attributes": {
    "lang": "",
    "dir": "",
    "dnt": false
  }
}`)

});

test('Test key and value', () => {
  const msg7 = MsgMessage.create({
    key: 'my-key',
    value: 'My Value'
  });

  msg7.key = 'my-altered-key';
  msg7.value = 'My Altered Value';

  expect(msg7.key).toBe('my-altered-key');
  expect(msg7.value).toBe('My Altered Value');
});




import { describe, expect, test } from 'vitest';
import { MsgMessage } from './MsgMessage';
import { DEFAULT_ATTRIBUTES, MsgAttributes } from '../MsgInterface';


describe('MsgMessage tests', () => {

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
  });

  const output = JSON.stringify({
    "key": "my-key",
    "value": "My Value",
    "attributes": {
      "lang": "",
      "dir": "",
      "dnt": false
    }
  }, null, 2);

  test('Test generic functions', () => {
    const msg6 = MsgMessage.create({
      key: 'my-key',
      value: 'My Value'
    });

    expect(msg6.toString()).toBe('My Value')
    expect(msg6.toJSON()).toBe(output)

  });

  test('MsgMessage: "addNote" public method', () => {
    const msg = MsgMessage.create({
      key: 'my-key',
      value: 'My Value'
    });
    
    expect(msg.notes.length).toBe(0);
    
    msg.addNote({type: 'DESCRIPTION', content: 'First note'});
    expect(msg.notes.length).toBe(1);
    expect(msg.notes[0].type).toBe('DESCRIPTION');
    expect(msg.notes[0].content).toBe('First note');
    
    msg.addNote({type: 'PARAMETERS', content: 'Second note'});
    expect(msg.notes.length).toBe(2);
    expect(msg.notes[1].type).toBe('PARAMETERS');
  });

  test('MsgMessage: "getData" public method', () => {
    const msg = MsgMessage.create({
      key: 'my-key',
      value: 'My Value',
      attributes: {
        lang: 'en',
        dir: 'ltr',
        dnt: false
      },
      notes: [
        {type: 'DESCRIPTION', content: 'Test note'}
      ]
    });
    
    const data = msg.getData();
    
    expect(data.key).toBe('my-key');
    expect(data.value).toBe('My Value');
    expect(data.attributes.lang).toBe('en');
    expect(data.attributes.dir).toBe('ltr');
    expect(data.attributes.dnt).toBe(false);
    expect(data.notes).toStrictEqual([{type: 'DESCRIPTION', content: 'Test note'}]);
  });

  test('MsgMessage: "getData" with stripNotes: true', () => {
    const msg = MsgMessage.create({
      key: 'my-key',
      value: 'My Value',
      notes: [
        {type: 'DESCRIPTION', content: 'Test note'}
      ]
    });
    
    const data = msg.getData(true);
    
    expect(data.key).toBe('my-key');
    expect(data.value).toBe('My Value');
    expect(data.notes).toBeUndefined();
  });

  test('MsgMessage: "getData" with empty notes', () => {
    const msg = MsgMessage.create({
      key: 'my-key',
      value: 'My Value'
    });
    
    const data = msg.getData();
    
    // When notes array is empty, notes should be undefined
    expect(data.notes).toBeUndefined();
  });

  test('MsgMessage: "toJSON" with stripNotes: true', () => {
    const msg = MsgMessage.create({
      key: 'my-key',
      value: 'My Value',
      notes: [
        {type: 'DESCRIPTION', content: 'Test note'}
      ]
    });
    
    const json = msg.toJSON(true);
    const parsed = JSON.parse(json);
    
    expect(parsed.key).toBe('my-key');
    expect(parsed.value).toBe('My Value');
    expect(parsed.notes).toBeUndefined();
  });

  test('MsgMessage: "format" with options parameter', () => {
    const msg = MsgMessage.create({
      key: 'test-key',
      value: 'Hello {$name}',
      attributes: {
        lang: 'en'
      }
    });
    
    // Test format with options - MessageFormat may add bidirectional isolation characters
    const result = msg.format({name: 'World'}, {});
    // The result should contain "Hello" and "World" (may have isolation characters)
    expect(result).toContain('Hello');
    expect(result).toContain('World');
    expect(typeof result).toBe('string');
  });

  test('MsgMessage: "formatToParts" with options parameter', () => {
    const msg = MsgMessage.create({
      key: 'test-key',
      value: 'Hello {$name}',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      }
    });
    
    // Test formatToParts with options
    const parts = msg.formatToParts({name: 'World'}, {});
    expect(parts.length).toBeGreaterThan(0);
    expect(parts.some(part => part.type === 'text' && part.value === 'Hello ')).toBe(true);
  });

  test('MsgMessage: empty value string', () => {
    const msg = MsgMessage.create({
      key: 'empty-key',
      value: ''
    });
    
    expect(msg.value).toBe('');
    expect(msg.toString()).toBe('');
    expect(msg.format({})).toBe('');
  });

  test('MsgMessage: "getData" returns correct structure', () => {
    const msg = MsgMessage.create({
      key: 'test-key',
      value: 'Test Value',
      attributes: {
        lang: 'fr',
        dir: 'ltr',
        dnt: true
      }
    });
    
    const data = msg.getData();
    
    expect(data).toHaveProperty('key');
    expect(data).toHaveProperty('value');
    expect(data).toHaveProperty('attributes');
    expect(data.attributes).toHaveProperty('lang');
    expect(data.attributes).toHaveProperty('dir');
    expect(data.attributes).toHaveProperty('dnt');
  })
});
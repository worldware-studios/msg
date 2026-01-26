import { expect, test , describe} from 'vitest';
import { MsgResource, MsgResourceData } from './MsgResource';
import project from '../../../res/l10n/projects/test';
import { testData } from "../../test/test-data";
import * as zh from '../../../res/l10n/translations/test/zh/TestResource.json';

const tData: MsgResourceData = zh;

describe('MsgResource tests', () => {

  test('MsgResource: "create" static method.', () => {
    const res = MsgResource.create(testData, project);

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
    const res = MsgResource.create(testData, project);

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
    const res = MsgResource.create(testData, project);
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

  });

  test('MsgResource: "translate" public method', async () => {
    const res = MsgResource.create(testData, project);
    const translated = res.translate(tData);
    expect(translated.get('test-1')?.value).toBe('这是测试 1');
  })

  test('MsgResource: "getTranslation" public method.', async () => {
    const res = MsgResource.create(testData, project);
    const translated = await res.getTranslation('zh');
    expect(translated.attributes.lang).toBe('zh');
    await expect(res.getTranslation('fr')).rejects.toThrow(Error);
  });

  test('MsgResource: "toJSON" public method', () => {
    const res = MsgResource.create(testData, project);
    expect(res.toJSON()).toBe(JSON.stringify(res.getData(), null, 2));
  });

  test('MsgResource: "create" static method without notes', () => {
    const dataWithoutNotes: MsgResourceData = {
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        }
      ]
    };
    const res = MsgResource.create(dataWithoutNotes, project);
    
    expect(res.title).toBe('TestResource');
    expect(res.notes.length).toBe(0);
    expect(res.size).toBe(1);
  });

  test('MsgResource: "translate" with new message key not in original', () => {
    const res = MsgResource.create(testData, project);
    
    const translationData: MsgResourceData = {
      title: 'TestResource',
      attributes: {
        lang: 'zh',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-new', // This key doesn't exist in the original resource
          value: '这是新测试'
        }
      ]
    };
    
    const translated = res.translate(translationData);
    
    // The new message should have empty notes array since it doesn't exist in original
    const newMsg = translated.get('test-new');
    expect(newMsg?.value).toBe('这是新测试');
    expect(newMsg?.notes).toStrictEqual([]);
    
    // Original messages should still be present
    expect(translated.get('test-1')?.value).toBe('This is test 1');
  });

  test('MsgResource: "getData" with stripNotes: true', () => {
    const res = MsgResource.create(testData, project);
    const data = res.getData(true);
    
    // Notes should be undefined when stripNotes is true
    expect(data.notes).toBeUndefined();
    
    // Messages should still be present but their notes should be stripped
    expect(data.messages).toBeDefined();
    expect(data.messages?.length).toBeGreaterThan(0);
    
    // Check that message notes are also stripped
    if (data.messages && data.messages.length > 0) {
      const firstMsg = data.messages[0];
      expect(firstMsg.notes).toBeUndefined();
    }
  });

  test('MsgResource: "getData" with empty notes', () => {
    const dataWithoutNotes: MsgResourceData = {
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        }
      ]
    };
    const res = MsgResource.create(dataWithoutNotes, project);
    
    // When notes array is empty, notes should be undefined
    const data = res.getData();
    expect(data.notes).toBeUndefined();
  });

  test('MsgResource: "toJSON" with stripNotes: true', () => {
    const res = MsgResource.create(testData, project);
    const json = res.toJSON(true);
    const parsed = JSON.parse(json);
    
    // Notes should not be present in the JSON
    expect(parsed.notes).toBeUndefined();
  });

  test('MsgResource: "addNote" public method', () => {
    const res = MsgResource.create(testData, project);
    const initialNotesCount = res.notes.length;
    
    res.addNote({type: 'DESCRIPTION', content: 'New note'});
    
    expect(res.notes.length).toBe(initialNotesCount + 1);
    expect(res.notes[res.notes.length - 1].type).toBe('DESCRIPTION');
    expect(res.notes[res.notes.length - 1].content).toBe('New note');
  });

  test('MsgResource: "translate" error case - title mismatch', () => {
    const res = MsgResource.create(testData, project);
    
    const translationData: MsgResourceData = {
      title: 'DifferentTitle', // Different from original
      attributes: {
        lang: 'zh',
        dir: 'ltr'
      },
      messages: []
    };
    
    expect(() => res.translate(translationData)).toThrow(TypeError);
    expect(() => res.translate(translationData)).toThrow('Title of resource and translations do not match.');
  });

  test('MsgResource: "create" with messages: undefined', () => {
    const dataWithoutMessages: MsgResourceData = {
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      }
    };
    const res = MsgResource.create(dataWithoutMessages, project);
    
    expect(res.title).toBe('TestResource');
    expect(res.size).toBe(0);
  });

  test('MsgResource: "create" with empty messages array', () => {
    const dataWithEmptyMessages: MsgResourceData = {
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: []
    };
    const res = MsgResource.create(dataWithEmptyMessages, project);
    
    expect(res.title).toBe('TestResource');
    expect(res.size).toBe(0);
  });

  test('MsgResource: "add" return value for chaining', () => {
    const res = MsgResource.create(testData, project);
    
    const result = res.add('test-4', 'Value 4').add('test-5', 'Value 5');
    
    expect(result).toBe(res);
    expect(res.get('test-4')?.value).toBe('Value 4');
    expect(res.get('test-5')?.value).toBe('Value 5');
  })
});

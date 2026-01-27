import { describe, expect, test } from 'vitest';
import { MsgResource, MsgResourceData } from '../classes/MsgResource/MsgResource.js';
import { MsgProject, MsgProjectData } from '../classes/MsgProject/MsgProject.js';
import { DEFAULT_ATTRIBUTES, MsgAttributes, MsgNote } from '../classes/MsgInterface/index.js';

const testProjectData: MsgProjectData = {
  project: {
    name: 'test',
    version: 1
  },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'zxx',
    targetLocales: {
      en: ['en'],
      zh: ['zh'],
      'zh-Hant': ['zh', 'zh-Hant'],
      'zh-HK': ['zh', 'zh-Hant', 'zh-HK']
    }
  },
  loader: async (project: string, title: string, lang: string) => {
    const path = `../../res/l10n/translations/${project}/${lang}/${title}.json`;
    const data: MsgResourceData = await import(path);
    return data;
  }
};

describe('MsgResource tests', () => {

  test('MsgResource: "create" static method with minimal data', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      }
    }, project);

    expect(resource.title).toBe('TestResource');
    expect(resource.attributes.lang).toBe('en');
    expect(resource.attributes.dir).toBe('ltr');
    expect(resource.attributes.dnt).toBe(false);
    expect(resource.notes).toStrictEqual([]);
    expect(resource.size).toBe(0);
  });

  test('MsgResource: "create" static method with messages', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        },
        {
          key: 'test-2',
          value: 'This is test 2'
        }
      ]
    }, project);

    expect(resource.title).toBe('TestResource');
    expect(resource.size).toBe(2);
    expect(resource.has('test-1')).toBe(true);
    expect(resource.has('test-2')).toBe(true);
    expect(resource.get('test-1')?.value).toBe('This is test 1');
    expect(resource.get('test-2')?.value).toBe('This is test 2');
  });

  test('MsgResource: "create" static method with notes', () => {
    const project = MsgProject.create(testProjectData);
    const notes: MsgNote[] = [
      { type: 'DESCRIPTION', content: 'Test resource description' },
      { type: 'AUTHORSHIP', content: 'Test author' }
    ];

    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      notes
    }, project);

    expect(resource.notes.length).toBe(2);
    expect(resource.notes[0]).toStrictEqual({ type: 'DESCRIPTION', content: 'Test resource description' });
    expect(resource.notes[1]).toStrictEqual({ type: 'AUTHORSHIP', content: 'Test author' });
  });

  test('MsgResource: "create" static method with messages and notes', () => {
    const project = MsgProject.create(testProjectData);
    const notes: MsgNote[] = [
      { type: 'DESCRIPTION', content: 'Test resource' }
    ];

    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      notes,
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1',
          notes: [
            { type: 'DESCRIPTION', content: 'Test message note' }
          ]
        }
      ]
    }, project);

    expect(resource.notes.length).toBe(1);
    expect(resource.size).toBe(1);
    expect(resource.get('test-1')?.notes.length).toBe(1);
  });

  test('MsgResource: "create" static method with empty messages array clears resource', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: []
    }, project);

    expect(resource.size).toBe(0);
  });

  test('MsgResource: "create" static method merges attributes with defaults', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'fr',
        dnt: true
      }
    }, project);

    expect(resource.attributes.lang).toBe('fr');
    expect(resource.attributes.dnt).toBe(true);
    expect(resource.attributes.dir).toBe(''); // default value
  });

  test('MsgResource: title getter and setter', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'OriginalTitle',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    expect(resource.title).toBe('OriginalTitle');
    
    resource.title = 'NewTitle';
    expect(resource.title).toBe('NewTitle');
  });

  test('MsgResource: attributes getter and setter', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      }
    }, project);

    expect(resource.attributes.lang).toBe('en');
    expect(resource.attributes.dir).toBe('ltr');

    const newAttributes: MsgAttributes = {
      lang: 'fr',
      dir: 'rtl',
      dnt: true
    };
    resource.attributes = newAttributes;
    expect(resource.attributes.lang).toBe('fr');
    expect(resource.attributes.dir).toBe('rtl');
    expect(resource.attributes.dnt).toBe(true);
  });

  test('MsgResource: notes getter and setter', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    expect(resource.notes).toStrictEqual([]);

    const newNotes: MsgNote[] = [
      { type: 'DESCRIPTION', content: 'Note 1' },
      { type: 'COMMENT', content: 'Note 2' }
    ];
    resource.notes = newNotes;
    expect(resource.notes.length).toBe(2);
    expect(resource.notes).toStrictEqual(newNotes);
  });

  test('MsgResource: "addNote" public method', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    expect(resource.notes.length).toBe(0);

    resource.addNote({ type: 'DESCRIPTION', content: 'First note' });
    expect(resource.notes.length).toBe(1);
    expect(resource.notes[0].type).toBe('DESCRIPTION');
    expect(resource.notes[0].content).toBe('First note');

    resource.addNote({ type: 'PARAMETERS', content: 'Second note' });
    expect(resource.notes.length).toBe(2);
    expect(resource.notes[1].type).toBe('PARAMETERS');
  });

  test('MsgResource: "add" method with key and value only', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      }
    }, project);

    resource.add('test-key', 'Test Value');
    
    expect(resource.size).toBe(1);
    expect(resource.has('test-key')).toBe(true);
    const message = resource.get('test-key');
    expect(message?.value).toBe('Test Value');
    expect(message?.attributes.lang).toBe('en'); // inherited from resource
    expect(message?.attributes.dir).toBe('ltr'); // inherited from resource
  });

  test('MsgResource: "add" method with attributes override', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr',
        dnt: false
      }
    }, project);

    resource.add('test-key', 'Test Value', {
      lang: 'fr',
      dnt: true
    });
    
    const message = resource.get('test-key');
    expect(message?.attributes.lang).toBe('fr'); // overridden
    expect(message?.attributes.dir).toBe('ltr'); // inherited from resource
    expect(message?.attributes.dnt).toBe(true); // overridden
  });

  test('MsgResource: "add" method with notes', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    const notes: MsgNote[] = [
      { type: 'DESCRIPTION', content: 'Test note' }
    ];

    resource.add('test-key', 'Test Value', undefined, notes);
    
    const message = resource.get('test-key');
    expect(message?.notes.length).toBe(1);
    expect(message?.notes[0]).toStrictEqual({ type: 'DESCRIPTION', content: 'Test note' });
  });

  test('MsgResource: "add" method returns resource for chaining', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    const result = resource.add('key1', 'value1').add('key2', 'value2');
    
    expect(result).toBe(resource);
    expect(resource.size).toBe(2);
  });

  test('MsgResource: "add" method overwrites existing key', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    resource.add('test-key', 'Original Value');
    expect(resource.get('test-key')?.value).toBe('Original Value');

    resource.add('test-key', 'Updated Value');
    expect(resource.size).toBe(1); // still only one entry
    expect(resource.get('test-key')?.value).toBe('Updated Value');
  });

  test('MsgResource: "translate" method with matching title', () => {
    const project = MsgProject.create(testProjectData);
    const original = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      notes: [
        { type: 'DESCRIPTION', content: 'Original note' }
      ],
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1',
          notes: [
            { type: 'DESCRIPTION', content: 'Message note' }
          ]
        },
        {
          key: 'test-2',
          value: 'This is test 2'
        }
      ]
    }, project);

    const translated = original.translate({
      title: 'TestResource',
      attributes: {
        lang: 'zh',
        dir: 'ltr'
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
    });

    expect(translated.title).toBe('TestResource');
    expect(translated.attributes.lang).toBe('zh');
    expect(translated.size).toBe(2);
    expect(translated.get('test-1')?.value).toBe('这是测试 1');
    expect(translated.get('test-2')?.value).toBe('这是测试 2');
    
    // Notes should be transferred from original
    expect(translated.notes.length).toBe(1);
    expect(translated.notes[0]).toStrictEqual({ type: 'DESCRIPTION', content: 'Original note' });
    
    // Message notes should be transferred
    expect(translated.get('test-1')?.notes.length).toBe(1);
    expect(translated.get('test-1')?.notes[0]).toStrictEqual({ type: 'DESCRIPTION', content: 'Message note' });
  });

  test('MsgResource: "translate" method throws error on title mismatch', () => {
    const project = MsgProject.create(testProjectData);
    const original = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    expect(() => {
      original.translate({
        title: 'DifferentResource',
        attributes: DEFAULT_ATTRIBUTES,
        messages: []
      });
    }).toThrow(TypeError);
    expect(() => {
      original.translate({
        title: 'DifferentResource',
        attributes: DEFAULT_ATTRIBUTES,
        messages: []
      });
    }).toThrow('Title of resource and translations do not match.');
  });

  test('MsgResource: "translate" method uses original messages as defaults', () => {
    const project = MsgProject.create(testProjectData);
    const original = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES,
      messages: [
        {
          key: 'test-1',
          value: 'Original value 1'
        },
        {
          key: 'test-2',
          value: 'Original value 2'
        },
        {
          key: 'test-3',
          value: 'Original value 3'
        }
      ]
    }, project);

    // Translate only provides test-1, test-2 should use original, test-3 should use original
    const translated = original.translate({
      title: 'TestResource',
      attributes: {
        lang: 'zh',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'Translated value 1'
        }
      ]
    });

    expect(translated.size).toBe(3);
    expect(translated.get('test-1')?.value).toBe('Translated value 1');
    expect(translated.get('test-2')?.value).toBe('Original value 2');
    expect(translated.get('test-3')?.value).toBe('Original value 3');
  });

  test('MsgResource: "translate" method transfers notes to new messages', () => {
    const project = MsgProject.create(testProjectData);
    const original = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES,
      messages: [
        {
          key: 'test-1',
          value: 'Original',
          notes: [
            { type: 'DESCRIPTION', content: 'Original note' }
          ]
        }
      ]
    }, project);

    const translated = original.translate({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES,
      messages: [
        {
          key: 'test-1',
          value: 'Translated'
        }
      ]
    });

    const translatedMessage = translated.get('test-1');
    expect(translatedMessage?.value).toBe('Translated');
    expect(translatedMessage?.notes.length).toBe(1);
    expect(translatedMessage?.notes[0]).toStrictEqual({ type: 'DESCRIPTION', content: 'Original note' });
  });

  test('MsgResource: "getTranslation" method with single locale', async () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        },
        {
          key: 'test-2',
          value: 'This is test 2'
        }
      ]
    }, project);

    const translated = await resource.getTranslation('zh');

    expect(translated.title).toBe('TestResource');
    expect(translated.attributes.lang).toBe('zh');
    expect(translated.size).toBe(2);
    expect(translated.get('test-1')?.value).toBe('这是测试 1');
    expect(translated.get('test-2')?.value).toBe('这是测试 2');
  });

  test('MsgResource: "getTranslation" method with language chain', async () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        },
        {
          key: 'test-2',
          value: 'This is test 2'
        }
      ]
    }, project);

    // zh-Hant chain: ['zh', 'zh-Hant']
    const translated = await resource.getTranslation('zh-Hant');

    expect(translated.title).toBe('TestResource');
    expect(translated.attributes.lang).toBe('zh');
    expect(translated.size).toBe(3); // zh-Hant has test-3 as well
    expect(translated.get('test-1')?.value).toBe('這是測試 1');
    expect(translated.get('test-2')?.value).toBe('這是測試 2');
    expect(translated.get('test-3')?.value).toBe('這是測試 3');
  });

  test('MsgResource: "getTranslation" method with longer language chain', async () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        },
        {
          key: 'test-2',
          value: 'This is test 2'
        }
      ]
    }, project);

    // zh-HK chain: ['zh', 'zh-Hant', 'zh-HK']
    const translated = await resource.getTranslation('zh-HK');

    expect(translated.title).toBe('TestResource');
    expect(translated.attributes.lang).toBe('zh');
    expect(translated.size).toBe(4); // zh-HK has test-4 as well
    expect(translated.get('test-1')?.value).toBe('這是測試 1');
    expect(translated.get('test-2')?.value).toBe('這是測試 2');
    expect(translated.get('test-3')?.value).toBe('這是測試 3');
    expect(translated.get('test-4')?.value).toBe('這是測試 4');
  });

  test('MsgResource: "getTranslation" method throws error for unsupported locale', async () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    await expect(resource.getTranslation('fr')).rejects.toThrow('Unsupported locale for resource.');
  });

  test('MsgResource: "getTranslation" method throws error for empty language chain', async () => {
    const projectDataWithEmptyChain: MsgProjectData = {
      project: {
        name: 'test',
        version: 1
      },
      locales: {
        sourceLocale: 'en',
        pseudoLocale: 'zxx',
        targetLocales: {
          en: [],
          zh: ['zh']
        }
      },
      loader: async (project: string, title: string, lang: string) => {
        const path = `../../../res/l10n/translations/${project}/${lang}/${title}.json`;
        const data: MsgResourceData = await import(path);
        return data;
      }
    };

    const project = MsgProject.create(projectDataWithEmptyChain);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES
    }, project);

    await expect(resource.getTranslation('en')).rejects.toThrow('Empty language chain for locale: en');
  });

  test('MsgResource: "getTranslation" method skips missing targetLocales entries in chain', async () => {
    const projectDataWithMissingEntry: MsgProjectData = {
      project: {
        name: 'test',
        version: 1
      },
      locales: {
        sourceLocale: 'en',
        pseudoLocale: 'zxx',
        targetLocales: {
          en: ['en'],
          zh: ['zh'],
          'zh-Hant': ['zh', 'zh-Hant'],
          'zh-HK': ['zh', 'missing-lang', 'zh-HK'] // 'missing-lang' doesn't exist in targetLocales
        }
      },
      loader: async (project: string, title: string, lang: string) => {
        const path = `../../res/l10n/translations/${project}/${lang}/${title}.json`;
        const data: MsgResourceData = await import(path);
        return data;
      }
    };

    const project = MsgProject.create(projectDataWithMissingEntry);
    const resource = MsgResource.create({
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
    }, project);

    // zh-HK chain: ['zh', 'missing-lang', 'zh-HK']
    // When processing 'missing-lang', line 143 condition evaluates to false
    // because project._locales.targetLocales['missing-lang'] is undefined
    // This skips the translation step for 'missing-lang' but continues with 'zh-HK'
    const translated = await resource.getTranslation('zh-HK');

    expect(translated.title).toBe('TestResource');
    expect(translated.attributes.lang).toBe('zh');
    expect(translated.size).toBe(4); // zh-HK has test-4 as well
    expect(translated.get('test-1')?.value).toBe('這是測試 1');
    expect(translated.get('test-4')?.value).toBe('這是測試 4');
  });

  test('MsgResource: "getData" method returns correct structure', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr',
        dnt: false
      },
      notes: [
        { type: 'DESCRIPTION', content: 'Test note' }
      ],
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        }
      ]
    }, project);

    const data = resource.getData();

    expect(data.title).toBe('TestResource');
    expect(data.attributes.lang).toBe('en');
    expect(data.attributes.dir).toBe('ltr');
    expect(data.attributes.dnt).toBe(false);
    expect(data.notes).toStrictEqual([{ type: 'DESCRIPTION', content: 'Test note' }]);
    expect(data.messages).toBeDefined();
    expect(data.messages!.length).toBe(1);
    expect(data.messages![0].key).toBe('test-1');
    expect(data.messages![0].value).toBe('This is test 1');
  });

  test('MsgResource: "getData" method with stripNotes: true', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES,
      notes: [
        { type: 'DESCRIPTION', content: 'Test note' }
      ],
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1',
          notes: [
            { type: 'DESCRIPTION', content: 'Message note' }
          ]
        }
      ]
    }, project);

    const data = resource.getData(true);

    expect(data.notes).toBeUndefined();
    expect(data.messages).toBeDefined();
    expect(data.messages![0].notes).toBeUndefined();
  });

  test('MsgResource: "getData" method with empty notes', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES,
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        }
      ]
    }, project);

    const data = resource.getData();

    expect(data.notes).toBeUndefined();
  });

  test('MsgResource: "toJSON" method', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
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
    }, project);

    const json = resource.toJSON();
    const parsed = JSON.parse(json);

    expect(parsed.title).toBe('TestResource');
    expect(parsed.attributes.lang).toBe('en');
    expect(parsed.messages.length).toBe(1);
  });

  test('MsgResource: "toJSON" method with stripNotes: true', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: DEFAULT_ATTRIBUTES,
      notes: [
        { type: 'DESCRIPTION', content: 'Test note' }
      ],
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1'
        }
      ]
    }, project);

    const json = resource.toJSON(true);
    const parsed = JSON.parse(json);

    expect(parsed.notes).toBeUndefined();
  });

  test('MsgResource: attributes merge correctly in add method', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr',
        dnt: false
      }
    }, project);

    // Add message with partial attributes
    resource.add('test-key', 'Test Value', {
      lang: 'fr',
      dnt: true
    });

    const message = resource.get('test-key');
    expect(message?.attributes.lang).toBe('fr'); // overridden
    expect(message?.attributes.dir).toBe('ltr'); // inherited
    expect(message?.attributes.dnt).toBe(true); // overridden
  });

  test('MsgResource: create with messages that have attributes', () => {
    const project = MsgProject.create(testProjectData);
    const resource = MsgResource.create({
      title: 'TestResource',
      attributes: {
        lang: 'en',
        dir: 'ltr'
      },
      messages: [
        {
          key: 'test-1',
          value: 'This is test 1',
          attributes: {
            lang: 'fr',
            dnt: true
          }
        }
      ]
    }, project);

    const message = resource.get('test-1');
    expect(message?.attributes.lang).toBe('fr'); // message-specific attribute
    expect(message?.attributes.dir).toBe('ltr'); // inherited from resource
    expect(message?.attributes.dnt).toBe(true); // message-specific attribute
  });

});

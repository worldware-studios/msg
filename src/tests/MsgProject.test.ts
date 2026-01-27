import { MsgProject, MsgProjectData } from '../classes/MsgProject/MsgProject.js';
import { MsgResourceData } from '../classes/MsgResource/MsgResource.js';
import { test, expect, describe } from 'vitest';

const testProjectData: MsgProjectData = {
  project: {
    name: 'test2',
    version: 1
  },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: {
      en: ['en'],
      zh: ['zh'],
      'zh-Hant': ['zh', 'zh-Hant'],
      'zh-HK': ['zh', 'zh-Hant', 'zh-HK']
    },
  },
  loader: async (project: string, title: string, lang: string) => {
    const path = `../../../res/l10n/translations/${project}/${lang}/${title}.json`;
    const data: MsgResourceData = await import(path);
    return data;
  }
}

describe('MsgProject tests', () => {

  test('MsgProject: "create" static method', () => {
    const project = MsgProject.create(testProjectData);

    expect(project.project.name).toBe('test2');
    expect(project.project.version).toBe(1);

    expect(project.locales.sourceLocale).toBe('en');
    expect(project.locales.targetLocales).toHaveProperty('en');
    expect(project.locales.targetLocales).toHaveProperty('zh');
    expect(project.locales.targetLocales.en).toStrictEqual(['en']);
    expect(project.locales.targetLocales.zh).toStrictEqual(['zh']);
    expect(project.locales.pseudoLocale).toBe('en-XA');

    expect(project.loader).toBeInstanceOf(Function);

    expect(project.loader('test', 'TestResource', 'zh')).toBeInstanceOf(Promise);
  });

  test('MsgProject. default loader', async () => {
    const project = MsgProject.create(testProjectData);
    expect((await project.loader('test', 'TestResource', 'zh')).title).toBe('TestResource')
  });

  test('MsgProject: default values when optional fields are missing', () => {
    const minimalData: MsgProjectData = {
      project: {
        name: 'minimal'
      },
      locales: {
        sourceLocale: 'en',
        pseudoLocale: 'en-XA',
        targetLocales: {
          en: ['en']
        }
      },
      loader: async () => ({ title: 'Test', attributes: { lang: 'en', dir: 'ltr' }, messages: [] })
    };
    
    const project = MsgProject.create(minimalData);
    
    // Project defaults
    expect(project.project.name).toBe('minimal');
    expect(project.project.version).toBe(1); // default
    
    // Locales defaults
    expect(project.locales.sourceLocale).toBe('en');
    expect(project.locales.pseudoLocale).toBe('en-XA');
    expect(project.locales.targetLocales).toHaveProperty('en');
    expect(project.locales.targetLocales.en).toStrictEqual(['en']);
    
  });

  test('MsgProject: getters return correct values', () => {
    const project = MsgProject.create(testProjectData);
    
    // Test project getter
    expect(project.project).toHaveProperty('name');
    expect(project.project).toHaveProperty('version');
    expect(project.project.name).toBe('test2');
    expect(project.project.version).toBe(1);
    
    // Test locales getter
    expect(project.locales).toHaveProperty('sourceLocale');
    expect(project.locales).toHaveProperty('targetLocales');
    expect(project.locales).toHaveProperty('pseudoLocale');
    expect(project.locales.sourceLocale).toBe('en');
    expect(project.locales.targetLocales).toHaveProperty('en');
    expect(project.locales.targetLocales).toHaveProperty('zh');
    expect(project.locales.pseudoLocale).toBe('en-XA');
        
    // Test loader getter
    expect(project.loader).toBeInstanceOf(Function);
    expect(typeof project.loader).toBe('function');
  });

  test('MsgProject: partial overrides with defaults', () => {
    const partialData: MsgProjectData = {
      project: {
        name: 'partial',
        version: 2
      },
      locales: {
        sourceLocale: 'fr',
        pseudoLocale: 'fr-XA',
        targetLocales: {
          fr: ['fr'],
          es: ['es']
        }
      },
      loader: async () => ({ title: 'Test', attributes: { lang: 'en', dir: 'ltr' }, messages: [] })
    };
    
    const project = MsgProject.create(partialData);
    
    // Custom values should be used
    expect(project.project.name).toBe('partial');
    expect(project.project.version).toBe(2);
    expect(project.locales.sourceLocale).toBe('fr');
    expect(project.locales.targetLocales).toHaveProperty('fr');
    expect(project.locales.targetLocales).toHaveProperty('es');
    expect(project.locales.targetLocales.fr).toStrictEqual(['fr']);
    expect(project.locales.targetLocales.es).toStrictEqual(['es']);

    // Defaults should still apply where not overridden
    expect(project.locales.pseudoLocale).toBe('fr-XA'); // custom value, not default
  });

  test('MsgProject: getTargetLocale method', () => {
    const project = MsgProject.create(testProjectData);
    
    // Test getting existing target locale
    expect(project.getTargetLocale('en')).toStrictEqual(['en']);
    expect(project.getTargetLocale('zh')).toStrictEqual(['zh']);
    
    // Test getting non-existent target locale
    expect(project.getTargetLocale('fr')).toBeUndefined();
    expect(project.getTargetLocale('nonexistent')).toBeUndefined();
  });

  test('MsgProject: targetLocales structure is an object', () => {
    const project = MsgProject.create(testProjectData);
    
    // Verify targetLocales is an object, not an array
    expect(project.locales.targetLocales).toBeInstanceOf(Object);
    expect(Array.isArray(project.locales.targetLocales)).toBe(false);
    expect(typeof project.locales.targetLocales).toBe('object');
  });
});

import { MsgProject } from './MsgProject';
import { testProjectData } from '../../test/test-project-data';
import { test, expect, describe } from 'vitest';

describe('MsgProject tests', () => {

  test('MsgProject: "create" static method', () => {
    const project = MsgProject.create(testProjectData);

    expect(project.project.name).toBe('test2');
    expect(project.project.version).toBe(1);

    expect(project.locales.sourceLocale).toBe('en');
    expect(project.locales.targetLocales).toStrictEqual(['en', 'zh']);
    expect(project.locales.pseudoLocale).toBe('en-XA');

    expect(project.loader).toBeInstanceOf(Function);

    expect(project.loader('test', 'TestResource', 'zh')).toBeInstanceOf(Promise);
  });

  test('MsgProject. default loader', async () => {
    const project = MsgProject.create(testProjectData);
    expect((await project.loader('test', 'TestResource', 'zh')).title).toBe('TestResource')
  });

  test('MsgProject: default values when optional fields are missing', () => {
    const minimalData = {
      project: {
        name: 'minimal'
      },
      locales: {
        sourceLocale: 'en'
      },
      paths: {
        srcPaths: ['./src']
      },
      loader: async () => ({ title: 'Test', attributes: { lang: 'en', dir: 'ltr' }, messages: [] })
    };
    
    const project = MsgProject.create(minimalData);
    
    // Project defaults
    expect(project.project.name).toBe('minimal');
    expect(project.project.version).toBe(1); // default
    
    // Locales defaults
    expect(project.locales.sourceLocale).toBe('en');
    expect(project.locales.pseudoLocale).toBe('en-XA'); // default
    expect(project.locales.targetLocales).toStrictEqual(['']); // default
    
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
    expect(project.locales.targetLocales).toStrictEqual(['en', 'zh']);
    expect(project.locales.pseudoLocale).toBe('en-XA');
        
    // Test loader getter
    expect(project.loader).toBeInstanceOf(Function);
    expect(typeof project.loader).toBe('function');
  });

  test('MsgProject: partial overrides with defaults', () => {
    const partialData = {
      project: {
        name: 'partial',
        version: 2
      },
      locales: {
        sourceLocale: 'fr',
        targetLocales: ['fr', 'es']
      },
      paths: {
        srcPaths: ['./custom'],
        exportsPath: './custom/exports'
      },
      loader: async () => ({ title: 'Test', attributes: { lang: 'en', dir: 'ltr' }, messages: [] })
    };
    
    const project = MsgProject.create(partialData);
    
    // Custom values should be used
    expect(project.project.name).toBe('partial');
    expect(project.project.version).toBe(2);
    expect(project.locales.sourceLocale).toBe('fr');
    expect(project.locales.targetLocales).toStrictEqual(['fr', 'es']);

    // Defaults should still apply where not overridden
    expect(project.locales.pseudoLocale).toBe('en-XA'); // default
  })
});
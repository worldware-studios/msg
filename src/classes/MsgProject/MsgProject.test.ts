import { MsgProject } from './MsgProject';
import { testProjectData } from '../../test/test-project';
import { test, expect } from 'vitest';

test('MsgProject: "create" static method', () => {
  const project = MsgProject.create(testProjectData);

  expect(project.project.name).toBe('test2');
  expect(project.project.version).toBe(1);

  expect(project.locales.sourceLocale).toBe('en');
  expect(project.locales.targetLocales).toStrictEqual(['en', 'zh']);
  expect(project.locales.pseudoLocale).toBe('zxx');

  expect(project.paths.srcPaths).toStrictEqual(['./src']);
  expect(project.paths.exportsPath).toStrictEqual('./res/l10n/xliff/exports');
  expect(project.paths.importPath).toStrictEqual('./res/l10n/xliff/imports');

  expect(project.loader).toBeInstanceOf(Function);

  expect(project.loader('test', 'TestResource', 'zh')).toBeInstanceOf(Promise);
});

test('MsgProject. default loader', async () => {
  const project = MsgProject.create(testProjectData);
  expect((await project.loader('test', 'TestResource', 'zh')).title).toBe('TestResource')
})
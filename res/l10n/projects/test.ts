import { MsgResourceData } from "../../../src/classes/MsgResource/MsgResource";
import { MsgProject } from "../../../src/classes/MsgProject";

export default MsgProject.create({
  project: {
    name: 'test',
    version: 1
  },
  locales: {
    sourceLocale: 'en',
    targetLocales: ['en', 'zh'],
    pseudoLocale: 'zxx'
  },
  paths: {
    srcPaths: ['../../../../src'],
    exportsPath: '../xliff/exports',
    importPath: '../xliff/imports'
  },
  loader: async (project, title, lang) => {
    const path = `../translations/${project}/${lang}/${title}.json`;
    const data: MsgResourceData = await import(path);
    return data;
  }
})
import { MsgResourceData, type MsgProjectData } from "../classes";

export const testProjectData: MsgProjectData = {
  project: {
    name: 'test2',
    version: 1
  },
  locales: {
    sourceLocale: 'en',
    targetLocales: {
      en: ['en'],
      zh: ['zh']
    },
  },
  loader: async (project, title, lang) => {
    const path = `../../res/l10n/translations/${project}/${lang}/${title}.json`;
    const data: MsgResourceData = await import(path);
    return data;
  }
  
}
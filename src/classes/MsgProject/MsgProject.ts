import { type MsgResourceData } from "../MsgResource/index.js";

type MsgProjectSettings = {
  name: string
  version?: number
};

type MsgLocalesSettings = {
  sourceLocale: string
  pseudoLocale?: string
  targetLocales?: string[]
};

export type MsgTranslationLoader = (project: string, title: string, lang: string) => Promise<MsgResourceData>;

export type MsgProjectData = {
  project: MsgProjectSettings
  locales: MsgLocalesSettings
  loader: MsgTranslationLoader
};

const defaultProjectSettings: MsgProjectSettings = {
  name: 'messages',
  version: 1
};

const defaultLocalesSettings: MsgLocalesSettings = {
  sourceLocale: '',
  pseudoLocale: 'en-XA',
  targetLocales: ['']
};

export class MsgProject {
  _project: MsgProjectSettings;
  _locales: MsgLocalesSettings;
  _loader: MsgTranslationLoader;

  static create(data: MsgProjectData) {
    const { project, locales, loader } = data;
    return new MsgProject(project, locales, loader);
  }

  private constructor(
    projectSettings: MsgProjectSettings,
    localesSettings: MsgLocalesSettings,
    loader: MsgTranslationLoader
  ) {
    this._project = {...defaultProjectSettings, ...projectSettings};
    this._locales = {...defaultLocalesSettings, ...localesSettings};
    this._loader = loader;
  }

  public get project() {
    return this._project;
  }

  public get locales() {
    return this._locales;
  }

  public get loader() {
    return this._loader;
  }
}

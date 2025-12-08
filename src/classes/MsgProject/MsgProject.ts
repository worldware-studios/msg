import { type MsgResourceData } from "../MsgResource";

type MsgProjectSettings = {
  name: string
  version: number
};

type MsgLocalesSettings = {
  sourceLocale: string
  pseudoLocale?: string
  targetLocales: string[]
};

type MsgPathsSettings = {
  srcPaths: string[]
  exportsPath: string
  importPath: string
};

export type MsgTranslationLoader = (project: string, title: string, lang: string) => Promise<MsgResourceData>;

export type MsgProjectData = {
  project: MsgProjectSettings
  locales: MsgLocalesSettings
  paths: MsgPathsSettings
  loader: MsgTranslationLoader
};

const defaultProjectSettings: MsgProjectSettings = {
  name: 'messages',
  version: 1
};

const defaultLocalesSettings: MsgLocalesSettings = {
  sourceLocale: '',
  pseudoLocale: 'zxx',
  targetLocales: ['']
};

const defaultPathsSettings: MsgPathsSettings = {
  srcPaths: ['../../../src'],
  exportsPath: '../xliff/exports',
  importPath: '../xliff/imports'
};

export class MsgProject {
  _project: MsgProjectSettings;
  _locales: MsgLocalesSettings;
  _paths: MsgPathsSettings;
  _loader: MsgTranslationLoader;

  static create(data: MsgProjectData) {
    const { project, locales, paths, loader } = data;
    return new MsgProject(project, locales, paths, loader);
  }

  private constructor(
    projectSettings: MsgProjectSettings,
    localesSettings: MsgLocalesSettings,
    pathsSettings: MsgPathsSettings,
    loader: MsgTranslationLoader
  ) {
    this._project = {...defaultProjectSettings, ...projectSettings};
    this._locales = {...defaultLocalesSettings, ...localesSettings};
    this._paths = {...defaultPathsSettings, ...pathsSettings};
    this._loader = loader;
  }

  public get project() {
    return this._project;
  }

  public get locales() {
    return this._locales;
  }

  public get paths() {
    return this._paths;
  }

  public get loader() {
    return this._loader;
  }
}

import { type MsgResourceData } from "../MsgResource/MsgResource.js";
import { type MsgFormat, MSG_DEFAULT_FORMAT } from "../MsgInterface/MsgInterface.js";

/**
 * Project-level settings such as name, version, and default message format.
 */
export type MsgProjectSettings = {
  /** Display name of the localization project. */
  name: string
  /** Optional project version number. */
  version?: number
  /** Default message format inherited by resources and messages. */
  format?: MsgFormat
};

/**
 * Map of a requested locale to the chain of locales used to load translations.
 */
export type MsgTargetLocalesSettings = {
  [key: string]: string[]
}

/**
 * Locale configuration for a project: source, pseudo, and target locales.
 */
export type MsgLocalesSettings = {
  /** Locale of the source (authoring) strings. */
  sourceLocale: string
  /** Locale used for pseudo-localization during development. */
  pseudoLocale: string
  /** Target locales and their fallback load chains. */
  targetLocales: MsgTargetLocalesSettings
};

/**
 * Async function that loads translated resource data for a project, title, and language.
 */
export type MsgTranslationLoader = (project: string, title: string, lang: string) => Promise<MsgResourceData>;

/**
 * Plain data used to create a {@link MsgProject}.
 */
export type MsgProjectData = {
  /** Project name, version, and default format. */
  project: MsgProjectSettings
  /** Source, pseudo, and target locale settings. */
  locales: MsgLocalesSettings
  /** Function used to load translations for a locale. */
  loader: MsgTranslationLoader
};

/**
 * Default project settings applied when none are provided.
 */
const defaultProjectSettings: MsgProjectSettings = {
  name: 'messages',
  version: 1,
  format: MSG_DEFAULT_FORMAT
};

/**
 * Default locale settings applied when none are provided.
 */
const defaultLocalesSettings: MsgLocalesSettings = {
  sourceLocale: 'en',
  pseudoLocale: 'en-XA',
  targetLocales: {
    en: ['en']
  }
};

/**
 * A localization project that holds settings, locales, and a translation loader.
 *
 * Resources are created against a project so they can inherit format defaults
 * and load translations through the project's loader.
 */
export class MsgProject {
  /** Project name, version, and default format. */
  _project: MsgProjectSettings;
  /** Source, pseudo, and target locale settings. */
  _locales: MsgLocalesSettings;
  /** Function used to load translations for a locale. */
  _loader: MsgTranslationLoader;

  /**
   * Builds a project from {@link MsgProjectData}.
   */
  static create(data: MsgProjectData) {
    const { project, locales, loader } = data;
    return new MsgProject(project, locales, loader);
  }

  /**
   * Creates a project from its settings and loader. Prefer {@link MsgProject.create}.
   */
  private constructor(
    projectSettings: MsgProjectSettings,
    localesSettings: MsgLocalesSettings,
    loader: MsgTranslationLoader
  ) {
    this._project = {...defaultProjectSettings, ...projectSettings};
    this._locales = {...defaultLocalesSettings, ...localesSettings};
    this._loader = loader;
  }

  /** Project name, version, and default format. */
  public get project() {
    return this._project;
  }

  /** Source, pseudo, and target locale settings. */
  public get locales() {
    return this._locales;
  }

  /** Function used to load translations for a locale. */
  public get loader() {
    return this._loader;
  }

  /**
   * The project-wide default message format. Resources (and, through them,
   * messages) inherit this value unless they specify their own.
   */
  public get format(): MsgFormat {
    return this._project.format ?? MSG_DEFAULT_FORMAT;
  }

  /**
   * Returns the translation load chain for a locale, or `undefined` if unsupported.
   */
  public getTargetLocale(locale: string): string[] | undefined {
    return this._locales.targetLocales[locale];
  }

}

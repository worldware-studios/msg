import { parseMessage, stringifyMessage, visit } from "messageformat";
import { localize } from "pseudo-localization";
import { type MsgMessageData, MsgMessage } from "../MsgMessage/MsgMessage.js";
import { DEFAULT_ATTRIBUTES, MSG_DEFAULT_FORMAT, MsgInterface, type MsgAttributes, type MsgNote } from "../MsgInterface/MsgInterface.js";
import { MsgProject } from "../MsgProject/MsgProject.js";

/**
 * Plain data used to create or describe a {@link MsgResource}.
 */
export type MsgResourceData = {
  /** Title that identifies this resource within a project. */
  title: string
  /** Locale and formatting metadata for the resource. */
  attributes: MsgAttributes
  /** Optional notes for translators and tooling. */
  notes?: MsgNote[]
  /** Optional list of messages in this resource. */
  messages?: MsgMessageData[]
}

/**
 * A named collection of messages belonging to a {@link MsgProject}.
 *
 * Resources inherit format defaults from their project, support translation
 * loading (including pseudo-localization), and can serialize to plain data.
 */
export class MsgResource extends Map<string, MsgMessage> implements MsgInterface {

  private _attributes: MsgAttributes = {};
  private _notes: MsgNote[] = [];
  private _title: string;

  private _project: MsgProject;

  /**
   * Builds a resource from {@link MsgResourceData} and an owning project.
   *
   * When `messages` is provided, each entry is added to the resource.
   * When omitted, the resource starts empty.
   */
  static create(data: MsgResourceData, project: MsgProject ) {
    const { title, attributes, notes, messages}  = data;
    const res = new MsgResource(title, attributes, project, notes);

    if (messages) {
      messages.forEach(messageData => {
        const {key, value, attributes, notes} = messageData;
        res.add(key, value, attributes, notes);
      })
    } else {
      res.clear();
    }

    return res;
  }

  /**
   * Creates a resource bound to a project. Prefer {@link MsgResource.create}.
   */
  private constructor (title: string, attributes: MsgAttributes, project: MsgProject, notes?: MsgNote[]) {
    super();
    this._title = title;

    // Inherit the project's format unless the resource specifies its own.
    this._attributes = {...DEFAULT_ATTRIBUTES, format: project.format, ...attributes};
    this._project = project;

    if (notes) {
      notes.forEach(note => this.addNote(note));
    }

  }

  /**
   * Returns true when the message's attributes match this resource's attributes.
   */
  private hasMatchingAttributes(message: MsgMessage): boolean {
    const res = this.attributes;
    const msg = message.attributes;
    return res.lang === msg.lang
      && res.dir === msg.dir
      && res.dnt === msg.dnt
      && this.resolveFormat(res) === this.resolveFormat(msg);
  }

  /**
   * Resolves a format from attributes, falling back to the library default.
   */
  private resolveFormat(attributes: MsgAttributes) {
    return attributes.format ?? MSG_DEFAULT_FORMAT;
  }

  /**
   * Pseudo-localizes an MF2 message by localizing only literal text parts.
   */
  private pseudoLocalizeMF2(
    source: string,
    options?: { strategy?: "accented" | "bidi" }
  ): string {
    const msg = parseMessage(source);

    visit(msg, {
      pattern: (pattern) => {
        for (let i = 0; i < pattern.length; i++) {
          const part = pattern[i];
          if (typeof part === "string") {
            pattern[i] = localize(part, options);
          }
        }
      },
    });

    return stringifyMessage(msg);
  }

  /** Locale and formatting metadata for this resource. */
  public get attributes() {
    return this._attributes;
  }

  /** Replaces the resource's locale and formatting metadata. */
  public set attributes(attributes: MsgAttributes) {
    this._attributes = attributes;
  }
  
  /** Notes attached to this resource for translators and tooling. */
  public get notes() {
    return this._notes;
  }

  /** Replaces the notes attached to this resource. */
  public set notes(notes: MsgNote[]) {
    this._notes = notes;
  }

  /**
   * Appends a note to this resource.
   */
  public addNote(note: MsgNote) {
    this.notes.push(note);
  }

  /** Title that identifies this resource within a project. */
  public get title() {
   return this._title;
  }
  
  /** Sets the title that identifies this resource within a project. */
  public set title(title: string) {
    this._title = title;
  }

  /**
   * Returns the project this resource belongs to.
   */
  public getProject(): MsgProject {
    return this._project;
  }

  /**
   * Adds a message to this resource, merging resource attributes with any overrides.
   *
   * @returns This resource, for chaining.
   */
  public add(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]) {

    const merged = {...this.attributes, ...attributes};

    const msg = MsgMessage.create({
      key,
      value,
      attributes: merged,
      notes
    });
    this.set(key, msg);
    return this;
  }

  /**
   * Builds a translated copy of this resource from translation data.
   *
   * Messages present in the translation replace the source; missing keys keep
   * the source message. Notes are carried over from the source.
   *
   * @throws {TypeError} When the translation title does not match this resource.
   */
  public translate(data: MsgResourceData) {
    const {title, attributes, messages} = data;

    if (title !== this.title) {
      throw new TypeError('Title of resource and translations do not match.');
    }

    const translated = MsgResource.create({
      title,
      // preserve the source resource's format unless the translation overrides it
      attributes: this.preserveFormat(attributes, this.attributes.format),
      notes: this.notes, // transfer the notes
    }, this._project);

    // use messages from the resource as defaults
    this.forEach(msg => {
      translated.set(msg.key, msg);
    })

    messages?.forEach(messageData => {
      const {key, value, attributes} = messageData;
      const msg = MsgMessage.create({
        key,
        value,
        // preserve the source message's format unless the translation overrides it
        attributes: this.preserveFormat(attributes, this.get(key)?.attributes.format),
      });
      const notes = this.get(key)?.notes || []; // transfer the notes
      notes.forEach(note => {
        msg.addNote(note);
      })
      translated.set(key, msg);
    })

    return translated;
  }

  /**
   * Merge a `format` into an attribute set unless one is already present,
   * so translations inherit the source's format without overriding an
   * explicitly translated one. Returns the input unchanged when there is
   * no format to preserve.
   */
  private preserveFormat(attributes: MsgAttributes, format: MsgAttributes['format']): MsgAttributes;
  private preserveFormat(attributes: MsgAttributes | undefined, format: MsgAttributes['format']): MsgAttributes | undefined;
  private preserveFormat(
    attributes: MsgAttributes | undefined,
    format: MsgAttributes['format']
  ): MsgAttributes | undefined {
    if (format === undefined || attributes?.format !== undefined) {
      return attributes;
    }
    return { ...attributes, format };
  }

  /**
   * Loads and applies translations for a locale via the project loader.
   *
   * When `lang` is the project's pseudo-locale, returns a pseudo-localized
   * copy without calling the loader.
   *
   * @throws {Error} When the locale is unsupported or its language chain is empty.
   */
  public async getTranslation(lang: string) {

    const project = this._project;
    const pseudoLocale = project.locales.pseudoLocale;
    if (lang === pseudoLocale) {
      const pseudolocalizedData: MsgResourceData = {
        title: this.title,
        attributes: { ...this.attributes, lang: pseudoLocale },
        notes: this.notes.length > 0 ? this.notes : undefined,
        messages: []
      };
      this.forEach(msg => {
        pseudolocalizedData.messages!.push({
          key: msg.key,
          value: this.pseudoLocalizeMF2(msg.value),
          attributes: { ...this.attributes, lang: pseudoLocale }
        });
      });
      return this.translate(pseudolocalizedData);
    }

    const languageChain = project.getTargetLocale(lang);

    if(!languageChain) {
      throw new Error("Unsupported locale for resource.");
    }

    if(languageChain.length == 0) {
      throw new Error(`Empty language chain for locale: ${lang}`)
    }

    let translated: MsgResource = this;

    for (let i = 0; i < languageChain.length; i++) {
      const lang = languageChain[i];
      if (lang && project._locales.targetLocales[lang]) {
        translated = await translated._project._loader(project.project.name, translated.title, lang) 
                              .then(data => translated.translate(data))       
      }
    }

    return translated;
  }

  /**
   * Returns a plain data object for this resource and its messages.
   *
   * Attributes that match the resource or project defaults are omitted where
   * possible to keep the output compact.
   *
   * @param stripNotes - When true, notes are omitted from the result.
   */
  public getData(stripNotes: boolean = false): MsgResourceData {

    const resourceFormat = this.resolveFormat(this.attributes);
    const projectFormat = this._project.format;

    const messages: MsgMessageData[] = [];
    this.forEach(msg => {
      if (this.hasMatchingAttributes(msg)) {
        // remove attributes from message data if they match the resource attributes
        const data: MsgMessageData = {
          key: msg.key,
          value: msg.value,
          notes: !stripNotes && msg.notes.length > 0 ? msg.notes : undefined
        };
        messages.push(data);
      } else {
        const data = msg.getData(stripNotes);
        // omit the message's format when it matches the resource's format
        if (data.attributes && this.resolveFormat(data.attributes) === resourceFormat) {
          const { format, ...rest } = data.attributes;
          data.attributes = rest;
        }
        messages.push(data);
      }
    });

    // omit the resource's format when it matches the project's format
    const attributes: MsgAttributes = { ...this.attributes };
    if (this.resolveFormat(attributes) === projectFormat) {
      delete attributes.format;
    }

    return {
      title: this.title,
      attributes,
      notes: !stripNotes && this.notes.length > 0 ? this.notes : undefined,
      messages
    }
  }

  /**
   * Serializes this resource to a formatted JSON string.
   *
   * @param stripNotes - When true, notes are omitted from the serialized data.
   */
  public toJSON(stripNotes: boolean = false) {
    return JSON.stringify(this.getData(stripNotes), null, 2);
  }
  
}

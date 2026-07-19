import { parseMessage, stringifyMessage, visit } from "messageformat";
import { localize } from "pseudo-localization";
import { type MsgMessageData, MsgMessage } from "../MsgMessage/MsgMessage.js";
import { DEFAULT_ATTRIBUTES, MSG_DEFAULT_FORMAT, MsgInterface, type MsgAttributes, type MsgNote } from "../MsgInterface/MsgInterface.js";
import { MsgProject } from "../MsgProject/MsgProject.js";

export type MsgResourceData = {
  title: string
  attributes: MsgAttributes
  notes?: MsgNote[]
  messages?: MsgMessageData[]
}

export class MsgResource extends Map<string, MsgMessage> implements MsgInterface {

  private _attributes: MsgAttributes = {};
  private _notes: MsgNote[] = [];
  private _title: string;

  private _project: MsgProject;

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

  private hasMatchingAttributes(message: MsgMessage): boolean {
    const res = this.attributes;
    const msg = message.attributes;
    return res.lang === msg.lang
      && res.dir === msg.dir
      && res.dnt === msg.dnt
      && this.resolveFormat(res) === this.resolveFormat(msg);
  }

  private resolveFormat(attributes: MsgAttributes) {
    return attributes.format ?? MSG_DEFAULT_FORMAT;
  }

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

  public get attributes() {
    return this._attributes;
  }

  public set attributes(attributes: MsgAttributes) {
    this._attributes = attributes;
  }
  
  public get notes() {
    return this._notes;
  }

  public set notes(notes: MsgNote[]) {
    this._notes = notes;
  }

  public addNote(note: MsgNote) {
    this.notes.push(note);
  }

  public get title() {
   return this._title;
  }
  
  public set title(title: string) {
    this._title = title;
  }

  public getProject(): MsgProject {
    return this._project;
  }

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

  public translate(data: MsgResourceData) {
    const {title, attributes, messages} = data;

    if (title !== this.title) {
      throw new TypeError('Title of resource and translations do not match.');
    }

    const translated = MsgResource.create({
      title,
      attributes,
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
        attributes,
      });
      const notes = this.get(key)?.notes || []; // transfer the notes
      notes.forEach(note => {
        msg.addNote(note);
      })
      translated.set(key, msg);
    })

    return translated;
  }

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

  public toJSON(stripNotes: boolean = false) {
    return JSON.stringify(this.getData(stripNotes), null, 2);
  }
  
}
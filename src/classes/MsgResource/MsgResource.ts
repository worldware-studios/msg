import {type MsgMessageData, MsgMessage } from "../MsgMessage";
import { DEFAULT_ATTRIBUTES, MsgAttributes, MsgInterface, MsgNote } from "../MsgInterface";
import { MsgProject } from "../MsgProject";

export type MsgResourceData = {
  title: string
  attributes: MsgAttributes
  notes?: MsgNote[]
  messages?: MsgMessageData[]
}

export class MsgResource extends Map<string, MsgMessage> implements MsgInterface {

  private _attributes: MsgAttributes = DEFAULT_ATTRIBUTES;
  private _notes: MsgNote[] = [];
  private _title: string;

  private _project: MsgProject;

  static create(data: MsgResourceData, loader: MsgProject ) {
    const { title, attributes, notes, messages}  = data;
    const res = new MsgResource(title, attributes, loader, notes);

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

    this._attributes = {...this._attributes, ...attributes};
    this._project = project;

    if (notes) {
      notes.forEach(note => this.addNote(note));
    }

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
    return await this._project.loader(this._project.project.name, this.title, lang).then((data) => this.translate(data));
  }

  public getData(stripNotes: boolean = false): MsgResourceData {

    const messages: MsgMessageData[] = [];
    this.forEach(msg => messages.push(msg.getData(stripNotes)))

    return {
      title: this.title,
      attributes: this.attributes,
      notes: !stripNotes && this.notes.length > 0 ? this.notes : undefined,
      messages
    }
  }

  public toJSON(stripNotes: boolean = false) {
    return JSON.stringify(this.getData(stripNotes), null, 2);
  }
  
}
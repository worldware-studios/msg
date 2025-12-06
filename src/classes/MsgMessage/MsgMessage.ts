import { MessageFormat, type MessageFormatOptions } from "messageformat";
import { MsgInterface, type MsgAttributes, type MsgNote, textDirection } from "../MsgInterface";

export type MsgMessageData = {
  key: string
  value: string
  attributes?: MsgAttributes;
  notes?: MsgNote[]
}

const DEFAULT_ATTRIBUTES: MsgAttributes = {
  lang: "",
  dir: "",
  dnt: false
}

export class MsgMessage implements MsgInterface {
  private _key: string;
  private _value: string;
  private _mf?: MessageFormat;
  private _attributes: MsgAttributes = DEFAULT_ATTRIBUTES;
  private _notes: MsgNote[] = [];

  private constructor(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]) {
    this._key = key;
    this._value = value;

    // merge in any attributes
    this._attributes = attributes ? {...this._attributes, ...attributes} : this._attributes;

    // add any notes
    if (notes) {
      notes.forEach(note => this.addNote(note));
    }

  }

  static create(data: MsgMessageData) {
    const { key, value, attributes, notes } = data;
    const message = new MsgMessage(key, value, attributes, notes);
    return message;
  }

  public get key() {
    return this._key;
  }

  public set key(key: string) {
    this._key = key;
  }

  public get value() {
    return this._value;
  }

  public set value(value: string) {
    this._value = value;
  }

  public get attributes() {
    return this._attributes;
  }

  public set attributes(attributes: MsgAttributes) {
    this._attributes = attributes;
  }

  public get lang() {
   return this._attributes['lang'];
  }

  public set lang(lang: string | undefined) {
    this._attributes.lang = lang;
  }

  public get dir() {
   return this._attributes['dir'];
  }

  public set dir(dir: textDirection | undefined) {
    this._attributes.dir = dir;
  }

  public get dnt() {
   return this._attributes['dnt'];
  }

  public set dnt(dnt: boolean | undefined) {
    this._attributes.dnt = dnt;
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

  public format(data: Record<string, any>, options?: MessageFormatOptions) {
    if (!this._mf) {
      this._mf = new MessageFormat(this.lang, this.value, options)
    }
    return this._mf.format(data);
  }

  public formatToParts(data: Record<string, any>, options?: MessageFormatOptions) {
    if (!this._mf) {
      this._mf = new MessageFormat(this.lang, this.value, options)
    }
    return this._mf?.formatToParts(data);
  }

  public getData(stripNotes: boolean = false) {
    return {
      key: this.key,
      value: this.value,
      attributes: this.attributes,
      notes: !stripNotes && this.notes.length > 0 ? this.notes : undefined
    }
  }

  public toString() {
    return this.value;
  }

  public toJSON(stripNotes: boolean = false) {
    return JSON.stringify(this.getData(stripNotes), null, 2);
  }

}

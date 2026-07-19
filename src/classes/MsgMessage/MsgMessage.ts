import { MessageFormat, type MessageFormatOptions } from "messageformat";
import { mf1ToMessage } from "@messageformat/icu-messageformat-1";
import { MsgInterface, DEFAULT_ATTRIBUTES, MSG_DEFAULT_FORMAT, type MsgAttributes, type MsgFormat, type MsgNote } from "../MsgInterface/MsgInterface.js";

export type MsgMessageData = {
  key: string
  value: string
  attributes?: MsgAttributes;
  notes?: MsgNote[]
}

export class MsgMessage implements MsgInterface {
  private _key: string;
  private _value: string;
  private _mf?: MessageFormat;
  private _attributes: MsgAttributes;
  private _notes: MsgNote[] = [];

  private constructor(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]) {
    this._key = key;
    this._value = value;

    // merge in any attributes
    this._attributes = attributes ? {...DEFAULT_ATTRIBUTES, ...attributes} : {};

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

  public get value() {
    return this._value;
  }

  public get attributes() {
    return this._attributes;
  }

  public get notes() {
    return this._notes;
  }

  public addNote(note: MsgNote) {
    this.notes.push(note);
  }

  /**
   * The message's resolved format, defaulting to MF2 when not set or inherited.
   */
  private resolveFormat(): MsgFormat {
    return this.attributes.format ?? MSG_DEFAULT_FORMAT;
  }

  private getFormatter(options?: MessageFormatOptions): MessageFormat {
    if (!this._mf) {
      this._mf = this.resolveFormat() === 'MF1'
        ? mf1ToMessage(this.attributes.lang, this.value, options)
        : new MessageFormat(this.attributes.lang, this.value, options);
    }
    return this._mf;
  }

  public format(data: Record<string, any>, options?: MessageFormatOptions) {
    // NONE messages are not formatted; the raw string is returned as-is.
    if (this.resolveFormat() === 'NONE') {
      return this.value;
    }
    return this.getFormatter(options).format(data);
  }

  public formatToParts(data: Record<string, any>, options?: MessageFormatOptions) {
    // NONE messages have no placeholders to resolve; return the raw text part.
    if (this.resolveFormat() === 'NONE') {
      return [{ type: 'text' as const, value: this.value }];
    }
    return this.getFormatter(options).formatToParts(data);
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

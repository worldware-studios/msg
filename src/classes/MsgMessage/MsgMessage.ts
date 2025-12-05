import { MessageFormat, type MessageFormatOptions } from "messageformat";
import { MsgAbstract, type MsgAttributes, type MsgNote } from "../MsgAbstract/MsgAbstract";

type MsgMessageData = {
  key: string
  value: string
  attributes?: MsgAttributes;
  notes?: MsgNote[]
}

const DEFAULT_ATTRIBUTES: MsgAttributes = {
  lang: '',
  dir: '',
  dnt: false
}

export class MsgMessage extends MsgAbstract {
  private _key: string
  private _value: string
  private _mf?: MessageFormat;

  private constructor(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]) {
    super();
    this._key = key;
    this._value = value;

    if (attributes) {
      const { lang, dir, dnt } = attributes;
      if (lang) {
        this.lang = lang;
      } else {
        this.lang = DEFAULT_ATTRIBUTES.lang;
      }

      if (dir) {
        this.dir = dir;
      } else {
        this.dir = DEFAULT_ATTRIBUTES.dir;
      }

      if (dnt) {
        this.dnt = dnt;
      } else {
        this.dnt = DEFAULT_ATTRIBUTES.dnt;
      }

    } else {
      this.lang = DEFAULT_ATTRIBUTES.lang;
      this.dir = DEFAULT_ATTRIBUTES.dir;
      this.dnt = DEFAULT_ATTRIBUTES.dnt;
    }

    if (notes) {
      notes.forEach(note => this.addNote(note))
    } else {
      this.notes = [];
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

  public toString() {
    return this.value;
  }

  public toJSON() {

    const output = {
      key: this.key,
      value: this.value,
      attributes: this._attributes,
      notes: this._notes
    }

    return JSON.stringify(output, null, 2);
  }

}

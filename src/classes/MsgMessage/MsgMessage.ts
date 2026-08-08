import { MessageFormat, type MessageFormatOptions } from "messageformat";
import { mf1ToMessage } from "@messageformat/icu-messageformat-1";
import { MsgInterface, DEFAULT_ATTRIBUTES, MSG_DEFAULT_FORMAT, type MsgAttributes, type MsgFormat, type MsgNote, type NoteTypes } from "../MsgInterface/MsgInterface.js";

/**
 * Plain data used to create a {@link MsgMessage}.
 */
export type MsgMessageData = {
  /** Unique key that identifies this message within a resource. */
  key: string
  /** The message string, possibly in MessageFormat syntax. */
  value: string
  /** Optional locale and formatting metadata. */
  attributes?: MsgAttributes;
  /** Optional notes for translators and tooling. */
  notes?: MsgNote[]
}

/**
 * A single localizable message with a key, value, attributes, and notes.
 *
 * Supports MessageFormat 1, MessageFormat 2, and unformatted (`NONE`) strings.
 */
export class MsgMessage implements MsgInterface {
  private _key: string;
  private _value: string;
  private _mf?: MessageFormat;
  private _attributes: MsgAttributes;
  private _notes: MsgNote[] = [];

  /**
   * Creates a message from its parts. Prefer {@link MsgMessage.create}.
   */
  private constructor(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]) {
    this._key = key;
    this._value = value;

    // merge in any attributes
    this._attributes = attributes ? {...DEFAULT_ATTRIBUTES, ...attributes} : {};

    // add any notes
    if (notes) {
      notes.forEach(note => this.setNote(note));
    }

  }

  /**
   * Builds a message from {@link MsgMessageData}.
   */
  static create(data: MsgMessageData) {
    const { key, value, attributes, notes } = data;
    const message = new MsgMessage(key, value, attributes, notes);
    return message;
  }

  /** Unique key that identifies this message within a resource. */
  public get key() {
    return this._key;
  }

  /** The message string, possibly in MessageFormat syntax. */
  public get value() {
    return this._value;
  }

  /** Locale and formatting metadata for this message. */
  public get attributes() {
    return this._attributes;
  }

  /** Notes attached to this message for translators and tooling. */
  public get notes() {
    return this._notes;
  }

  /**
   * Appends a note to this message.
   *
   * @returns This message, for chaining.
   */
  public addNote(type: NoteTypes, content: string) {
    return this.setNote({ type, content });
  }

  /**
   * Appends a full note object to this message.
   *
   * @returns This message, for chaining.
   */
  private setNote(note: MsgNote) {
    this.notes.push(note);
    return this;
  }

  /**
   * The message's resolved format, defaulting to MF2 when not set or inherited.
   */
  private resolveFormat(): MsgFormat {
    return this.attributes.format ?? MSG_DEFAULT_FORMAT;
  }

  /**
   * Returns a cached MessageFormat formatter for this message's value.
   */
  private getFormatter(options?: MessageFormatOptions): MessageFormat {
    if (!this._mf) {
      this._mf = this.resolveFormat() === 'MF1'
        ? mf1ToMessage(this.attributes.lang, this.value, options)
        : new MessageFormat(this.attributes.lang, this.value, options);
    }
    return this._mf;
  }

  /**
   * Formats the message with the given placeholder data.
   *
   * For `NONE` format messages, returns the raw value unchanged.
   */
  public format(data: Record<string, any>, options?: MessageFormatOptions) {
    // NONE messages are not formatted; the raw string is returned as-is.
    if (this.resolveFormat() === 'NONE') {
      return this.value;
    }
    return this.getFormatter(options).format(data);
  }

  /**
   * Formats the message into structured parts with the given placeholder data.
   *
   * For `NONE` format messages, returns a single text part with the raw value.
   */
  public formatToParts(data: Record<string, any>, options?: MessageFormatOptions) {
    // NONE messages have no placeholders to resolve; return the raw text part.
    if (this.resolveFormat() === 'NONE') {
      return [{ type: 'text' as const, value: this.value }];
    }
    return this.getFormatter(options).formatToParts(data);
  }

  /**
   * Returns a plain data object for this message.
   *
   * @param stripNotes - When true, notes are omitted from the result.
   */
  public getData(stripNotes: boolean = false) {
    return {
      key: this.key,
      value: this.value,
      attributes: this.attributes,
      notes: !stripNotes && this.notes.length > 0 ? this.notes : undefined
    }
  }

  /**
   * Returns the message value as a string.
   */
  public toString() {
    return this.value;
  }

  /**
   * Serializes this message to a formatted JSON string.
   *
   * @param stripNotes - When true, notes are omitted from the serialized data.
   */
  public toJSON(stripNotes: boolean = false) {
    return JSON.stringify(this.getData(stripNotes), null, 2);
  }

}

import { MessageFormat } from "messageformat";
import { MsgAbstract, type MsgAttributes, MsgNote } from "../MsgAbstract/MsgAbstract";

type MsgMessageData = {
  key: string
  value: string
  attributes?: MsgAttributes
  notes?: MsgNote[]
}

export class MsgMessage extends MsgAbstract {
  private _key: string
  private _value: string
  private _mf: MessageFormat | null = null;

  private constructor(key: string, value: string) {
    super();
    this._key = key;
    this._value = value;
  }

  static create(data: MsgMessageData) {
    const message = new MsgMessage(data.key, data.value);
    message.setAttribute('lang', data.attributes?.lang);
    message.setAttribute('dir', data.attributes?.dir);
    message.setAttribute('dnt', data.attributes?.dnt);
  }

  public getKey() {
    return this._key;
  }

  public setKey(key: string) {
    this._key = key;
  }

  public getValue() {
    return this._value;
  }

  public setValue(value: string) {
    this._value = value;
  }

  public format(data: Record<string, any>) {
    return this._mf?.format(data);
  }

  public formatToParts(data: Record<string, any>) {
    return this._mf?.formatToParts(data);
  }

}

const msg = MsgMessage.create({
  key: 'my-key',
  value: 'My Value',
  notes: [
    { type: 'DESCRIPTION', content: 'This is my message' }
  ]
})
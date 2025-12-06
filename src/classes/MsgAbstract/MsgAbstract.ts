type NoteTypes =  'DESCRIPTION' | 'AUTHORSHIP' | 'PARAMETERS' | 'CONTEXT' | 'COMMENT';

export type MsgNote = {
  type: NoteTypes
  content: string;
}

type textDirection = 'ltr' | 'rtl' | '';

export type MsgAttributes = {
  lang?: string
  dir?: textDirection
  dnt?: boolean
}

export const DEFAULT_ATTRIBUTES: MsgAttributes = {
  lang: '',
  dir: '',
  dnt: false
}

type attributes = keyof MsgAttributes

export abstract class MsgAbstract {
  protected _attributes: MsgAttributes;
  protected _notes: MsgNote[] = [];

  public constructor(attributes: MsgAttributes = DEFAULT_ATTRIBUTES, notes: MsgNote[] = []) {
    this._attributes = attributes;
    this._notes = notes;
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

}

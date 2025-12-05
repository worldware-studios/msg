type NoteTypes =  'DESCRIPTION' | 'AUTHORSHIP' | 'PARAMETERS' | 'CONTEXT' | 'COMMENT';

export type MsgNote = {
  type: NoteTypes
  content: string;
}

export type MsgAttributes = {
  lang?: string
  dir?: 'ltr' | 'rtl'
  dnt?: boolean
}

export abstract class MsgAbstract {
  private attributes: MsgAttributes;
  private notes: MsgNote[];

  public constructor() {
    this.notes = [];
    this.attributes = {}
  }

  public getAttributes() {
    return this.attributes;
  }

  public setAttribute(attribute: 'lang' | 'dir' | 'dnt', value: string | boolean | undefined) {
    this.attributes[attribute];
  }

  public getAttribute(attribute: 'lang' | 'dir' | 'dnt') {
    return this.attributes[attribute];
  }

  public getNotes() {
    return this.notes;
  }

  public addNote(note: MsgNote) {
    this.notes.push(note);
  }


}

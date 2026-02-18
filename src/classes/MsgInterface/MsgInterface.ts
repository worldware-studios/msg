type NoteTypes =  'DESCRIPTION' | 'AUTHORSHIP' | 'PARAMETERS' | 'CONTEXT' | 'COMMENT';

export type MsgNote = {
  type: NoteTypes
  content: string;
}

export type MsgAttributes = {
  lang?: string
  dir?: string
  dnt?: boolean
}

export const DEFAULT_ATTRIBUTES: MsgAttributes = {
  lang: 'und',
  dir: 'auto',
  dnt: false
}

export interface MsgInterface {
  attributes: MsgAttributes
  notes: MsgNote[]
}

type NoteTypes =  'DESCRIPTION' | 'AUTHORSHIP' | 'PARAMETERS' | 'CONTEXT' | 'COMMENT';

export type MsgNote = {
  type: NoteTypes
  content: string;
}

/**
 * The message formatting syntax a string is written in.
 *
 * - `MF1` — ICU MessageFormat 1 (formatted via `@messageformat/icu-messageformat-1`).
 * - `MF2` — Unicode MessageFormat 2 (the default, for backwards compatibility).
 * - `NONE` — not a formatted message; the raw string is returned as-is.
 */
export type MsgFormat = 'MF1' | 'MF2' | 'NONE';

/**
 * The format applied when a message does not specify (or inherit) one.
 * Kept at MF2 for backwards compatibility.
 */
export const MSG_DEFAULT_FORMAT: MsgFormat = 'MF2';

export type MsgAttributes = {
  lang?: string
  dir?: string
  dnt?: boolean
  format?: MsgFormat
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

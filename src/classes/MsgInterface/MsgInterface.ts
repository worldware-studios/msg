/**
 * Categories of notes that can be attached to a message or resource.
 */
export type NoteTypes = 'DESCRIPTION' | 'AUTHORSHIP' | 'PARAMETERS' | 'CONTEXT' | 'COMMENT';

/**
 * A free-form note attached to a message or resource for translators and tools.
 */
export type MsgNote = {
  /** What kind of note this is. */
  type: NoteTypes
  /** The note text. */
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

/**
 * Locale and formatting metadata shared by messages and resources.
 */
export type MsgAttributes = {
  /** BCP 47 language tag for the content (for example, `en` or `zh-Hans`). */
  lang?: string
  /** Text direction: typically `ltr`, `rtl`, or `auto`. */
  dir?: string
  /** When true, the content should not be translated (Do Not Translate). */
  dnt?: boolean
  /** MessageFormat syntax used by the string, if any. */
  format?: MsgFormat
}

/**
 * Default attribute values applied when none are provided.
 */
export const DEFAULT_ATTRIBUTES: MsgAttributes = {
  lang: 'und',
  dir: 'auto',
  dnt: false
}

/**
 * Shared shape for objects that carry attributes and translator notes.
 */
export interface MsgInterface {
  /** Locale and formatting metadata. */
  attributes: MsgAttributes
  /** Notes for translators and tooling. */
  notes: MsgNote[]
}

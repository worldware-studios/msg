import { DEFAULT_ATTRIBUTES, type MsgAttributes } from '../classes/MsgInterface/MsgInterface.js';

/**
 * Merges {@link DEFAULT_ATTRIBUTES} with optional extras and caller attributes.
 *
 * An empty-string `dir` is treated as unset and becomes `'auto'`. This helper
 * is module-internal (not re-exported from the public API).
 */
export function applyAttributes(
  attributes?: MsgAttributes,
  extras?: MsgAttributes
): MsgAttributes {
  const merged: MsgAttributes = { ...DEFAULT_ATTRIBUTES, ...extras, ...attributes };
  if (!merged.dir) {
    merged.dir = 'auto';
  }
  return merged;
}

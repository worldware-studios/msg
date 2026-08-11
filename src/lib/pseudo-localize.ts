import { parseMessage, stringifyMessage, visit } from "messageformat";
import { localize } from "pseudo-localization";
import type { MsgFormat } from "../classes/MsgInterface/MsgInterface.js";

/**
 * Options forwarded to `pseudo-localization`'s `localize`.
 */
export type PseudoLocalizeOptions = {
  strategy?: "accented" | "bidi";
};

/**
 * Pseudo-localizes an MF2 message by localizing only literal text parts.
 */
export function pseudoLocalizeMF2(
  source: string,
  options?: PseudoLocalizeOptions
): string {
  const msg = parseMessage(source);

  visit(msg, {
    pattern: (pattern) => {
      for (let i = 0; i < pattern.length; i++) {
        const part = pattern[i];
        if (typeof part === "string") {
          pattern[i] = localize(part, options);
        }
      }
    },
  });

  return stringifyMessage(msg);
}

/**
 * Pseudo-localizes an MF1 (ICU MessageFormat 1) message by localizing only
 * human-readable content tokens, preserving placeholders and syntax.
 *
 * @remarks
 * Scaffold stub — implementation lands in the implement phase (Refs #59).
 */
export function pseudoLocalizeMF1(
  source: string,
  options?: PseudoLocalizeOptions
): string {
  void options;
  return source;
}

/**
 * Pseudo-localizes an unformatted (`NONE`) string in full.
 */
export function pseudoLocalizeNone(
  source: string,
  options?: PseudoLocalizeOptions
): string {
  return localize(source, options);
}

/**
 * Pseudo-localizes a message value according to its resolved {@link MsgFormat}.
 */
export function pseudoLocalize(
  source: string,
  format: MsgFormat,
  options?: PseudoLocalizeOptions
): string {
  switch (format) {
    case "MF1":
      return pseudoLocalizeMF1(source, options);
    case "NONE":
      return pseudoLocalizeNone(source, options);
    case "MF2":
    default:
      return pseudoLocalizeMF2(source, options);
  }
}

import { parseMessage, stringifyMessage, visit } from "messageformat";
import { parse, type Token } from "@messageformat/parser";
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
 * Collects human-readable `content` tokens from an MF1 AST.
 *
 * Content inside function `param` (arg styles like `::currency/EUR`) is skipped
 * so formatter options stay intact.
 */
function collectMf1ContentTokens(
  tokens: Token[],
  into: Array<{ offset: number; length: number; value: string }> = [],
  inFunctionParam = false
): Array<{ offset: number; length: number; value: string }> {
  for (const token of tokens) {
    switch (token.type) {
      case "content":
        if (!inFunctionParam) {
          into.push({
            offset: token.ctx.offset,
            length: token.value.length,
            value: token.value,
          });
        }
        break;
      case "plural":
      case "select":
      case "selectordinal":
        for (const selectCase of token.cases) {
          collectMf1ContentTokens(selectCase.tokens, into, false);
        }
        break;
      case "function":
        if (token.param) {
          collectMf1ContentTokens(token.param, into, true);
        }
        break;
      default:
        break;
    }
  }
  return into;
}

/**
 * Pseudo-localizes an MF1 (ICU MessageFormat 1) message by localizing only
 * human-readable content tokens, preserving placeholders and syntax.
 *
 * Parses with `@messageformat/parser`, then replaces content spans in the
 * original source by offset so ICU structure round-trips unchanged.
 */
export function pseudoLocalizeMF1(
  source: string,
  options?: PseudoLocalizeOptions
): string {
  const tokens = parse(source);
  const contents = collectMf1ContentTokens(tokens);
  // Replace from the end so earlier offsets stay valid.
  contents.sort((a, b) => b.offset - a.offset);

  let result = source;
  for (const part of contents) {
    const localized = localize(part.value, options);
    result =
      result.slice(0, part.offset) +
      localized +
      result.slice(part.offset + part.length);
  }
  return result;
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

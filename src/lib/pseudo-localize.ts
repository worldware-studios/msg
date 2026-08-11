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

/** A literal span in an MF1 source string eligible for pseudo-localization. */
type Mf1ContentSpan = {
  offset: number;
  length: number;
  value: string;
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
 * so formatter options stay intact. The `inFunctionParam` flag is preserved when
 * descending into nested select/plural tokens under a param.
 */
function collectMf1ContentTokens(
  tokens: Token[],
  into: Mf1ContentSpan[] = [],
  inFunctionParam = false
): Mf1ContentSpan[] {
  for (const token of tokens) {
    switch (token.type) {
      case "content":
        if (!inFunctionParam && token.value.length > 0) {
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
          collectMf1ContentTokens(selectCase.tokens, into, inFunctionParam);
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
 * Parses with `@messageformat/parser`, then rebuilds the source with localized
 * content spans so ICU structure round-trips unchanged.
 */
export function pseudoLocalizeMF1(
  source: string,
  options?: PseudoLocalizeOptions
): string {
  const spans = collectMf1ContentTokens(parse(source));
  if (spans.length === 0) {
    return source;
  }

  spans.sort((a, b) => a.offset - b.offset);

  let result = "";
  let cursor = 0;
  for (const span of spans) {
    result += source.slice(cursor, span.offset);
    result += localize(span.value, options);
    cursor = span.offset + span.length;
  }
  result += source.slice(cursor);
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

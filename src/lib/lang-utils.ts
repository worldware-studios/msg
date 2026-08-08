/**
 * Module internal lang variable.
 */
let lang: string | undefined;

/**
 * Set value of lang
 * 
 * @param tag string
 */
export function setLang(tag: string): void {
  lang = tag;
}

/**
 * Returns value of lang;
 * 
 * @returns string | undefined
 */
export function getLang(): string | undefined {
  return lang;
}

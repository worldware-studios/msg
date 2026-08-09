# msg

A TypeScript library for managing internationalization (i18n) messages with support for message formatting, translation management, and localization workflows.

## Overview

`msg` provides a structured approach to managing translatable messages in your application. It integrates with [MessageFormat 2](https://messageformat.unicode.org/) (MF2) and [ICU MessageFormat 1](https://messageformat.github.io/) (MF1) for message formatting and supports:

- **Message Management**: Organize messages into resources with keys and values
- **Translation Loading**: Load translations from external sources via customizable loaders
- **Pseudo Localization**: Request a pseudolocalized resource for UI testing via `getTranslation(pseudoLocale)`
- **Message Formatting**: Format messages with parameters using MessageFormat 2 (MF2) or MessageFormat 1 (MF1) syntax, or pass strings through unformatted
- **Configurable Format**: Choose `MF1`, `MF2`, or `NONE` per project, resource, or message via an inheritable `format` attribute (defaults to `MF2`)
- **Attributes & Notes**: Attach metadata (language, direction, do-not-translate flags) and notes to messages
- **Project Configuration**: Configure projects with locale settings and translation loaders

## Installation

```bash
npm install @worldware/msg
```

## Core Concepts

### MsgProject

A project configuration that defines:
- Project name and version
- The default message `format` (`MF1` | `MF2` | `NONE`, defaults to `MF2`) inherited by resources and messages
- Source and target locales (with language fallback chains)
- Pseudo locale (for pseudolocalized output via `getTranslation`)
- A translation loader function

### MsgResource

A collection of messages (extends `Map<string, MsgMessage>`) representing a resource bundle. Each resource has:
- A title/name
- Attributes (language, text direction, do-not-translate flag)
- Notes (descriptions, context, etc.)
- Messages indexed by key

### MsgMessage

An individual message with:
- A key (identifier)
- A value (the message text, in MF2, MF1, or plain syntax depending on its `format`)
- Attributes (lang, dir, dnt, format)
- Notes
- Formatting methods that honor the resolved `format` (MF2, MF1, or NONE)

## Usage

### Basic Setup

The following example matches the ES module output of the **msg-cli** command `msg create project Main en zh fr --format MF1`—a typical project file that loads translations from JSON under a translations directory (`TRANSLATION_IMPORT_PATH` may differ based on your `directories.i18n` / `directories.l10n` layout):

```javascript
import { MsgProject } from '@worldware/msg';

const TRANSLATION_IMPORT_PATH = "../l10n/translations";
const loader = async (project, title, language) => {
  const path = `${TRANSLATION_IMPORT_PATH}/${project}/${language}/${title}.json`;
  try {
    const module = await import(path, { with: { type: 'json' } });
    return module.default;
  } catch (error) {
    console.warn(`Translations for locale ${language} could not be loaded.`, error);
    return {
      title,
      attributes: { lang: language, dir: '' },
      notes: [],
      messages: []
    };
  }
};

export default MsgProject.create({
  project: { name: "Main", version: 1, format: "MF1" },
  locales: {
    sourceLocale: "en",
    pseudoLocale: "en-XA",
    targetLocales: {"en":["en"],"zh":["zh"],"fr":["fr"]}
  },
  loader
});
```

When using this in your app, import the default export as your project (msg-cli scaffolds resources that import it via `#i18n/projects/Main.js`).

### Creating a Resource

The following example matches the ES module output of **msg-cli** `msg create resource Main Messages`:

```javascript
/** ESM module **/

import { MsgResource, getLang } from '@worldware/msg';
import project from '#i18n/projects/Main.js';

/** Create a MsgResource object */

export const resource = MsgResource.create({
    title: 'Messages',
    attributes: {
      lang: 'en',
      dir: 'ltr'
    },
    notes: [
      {type: 'DESCRIPTION', content: 'This is the Messages resource.'}
    ]
  }, project);

/** 
 * Add messages to the resource using add(key, value, attributes, notes)
 * The add method is chainable.
 */

resource
    .add('sampleKey', 'Sample value.', {}, [
      { type: 'DESCRIPTION', content: 'This is first message.' }
    ])
    .add('sampleKey2', 'Hi, {name}', { dnt: true }, [
      { type: 'DESCRIPTION', content: 'This is the second message.' },
      { type: 'PARAMETERS', content: 'The {name} parameter holds the user name.' }
    ]);

/** 
 * An async function to get a translated version of the resource 
 * If the runtime language has not been set using `setLang()`, 
 * it will return the original resource
 */
export async function getMessages() {
  return await resource.getTranslation(getLang());
}
```

### Formatting Messages

```javascript
// Format a message from the scaffolded Messages resource (inherits MF1)
const greetingMsg = resource.get('sampleKey2');
const formatted = greetingMsg?.format({ name: 'Alice' });
// Result: "Hi, Alice"

// Or load a pre-translated resource for the runtime locale
const messages = await getMessages();
```

### Message Formats (MF1, MF2, NONE)

Every message is formatted according to its resolved `format` attribute:

- `MF2` (default) — [Unicode MessageFormat 2](https://messageformat.unicode.org/) syntax, e.g. `Hello, {$name}!`.
- `MF1` — [ICU MessageFormat 1](https://messageformat.github.io/) syntax, e.g. `{count, plural, one {# file} other {# files}}`, formatted via [`@messageformat/icu-messageformat-1`](https://www.npmjs.com/package/@messageformat/icu-messageformat-1).
- `NONE` — the value is returned verbatim, with no parsing or interpolation.

The `format` is inheritable: a resource inherits its project's `format` unless it sets its own, and a message inherits its resource's `format` unless it sets its own. The default is `MF2`, so existing code keeps working unchanged. Use a TypeScript union (`'MF1' | 'MF2' | 'NONE'`) — there is no enum.

The following is a **separate illustration** of format inheritance and per-message overrides (not the CLI `Main` / `Messages` scaffold above):

```typescript
import { MsgProject, MsgResource } from '@worldware/msg';

// A project whose messages are MF1 by default
const project = MsgProject.create({
  project: { name: 'legacy-app', version: 1, format: 'MF1' },
  locales: { sourceLocale: 'en', pseudoLocale: 'en-XA', targetLocales: { en: ['en'] } },
  loader
});

const resource = MsgResource.create({
  title: 'Files',
  attributes: { lang: 'en', dir: 'ltr' } // inherits format: 'MF1' from the project
}, project);

resource.add('files', '{count, plural, one {# file} other {# files}}'); // MF1 (inherited)
resource.add('brand', 'msg {version}', { format: 'NONE' });             // passed through
resource.add('hi', 'Hello, {$name}!', { format: 'MF2' });              // MF2 (override)

resource.get('files')?.format({ count: 2 });   // "2 files"
resource.get('brand')?.format({ version: 1 }); // "msg {version}"
resource.get('hi')?.format({ name: 'Ada' });   // "Hello, Ada!"
```

When serializing, an inherited `format` is omitted to keep output compact: a resource omits `format` when it equals the project's, and a message omits `format` when it equals its resource's.

### Loading Translations

```javascript
// Load a translation for a configured target locale (zh or fr in the Main project)
const zhResource = await resource.getTranslation('zh');

// The translated resource will have Chinese messages where available,
// falling back to the source messages for missing translations

// Or use the scaffolded helper (honors setLang() / getLang())
const messages = await getMessages();
```

### Language fallbacks and translation layering

The project's `targetLocales` maps each requested locale to a **fallback chain**: an array of locale codes ordered from least specific to most specific (e.g. base language first, then region-specific). For example, `'zh-HK': ['zh', 'zh-Hant', 'zh-HK']` means that when you request `zh-HK`, the chain is first `zh`, then `zh-Hant`, then `zh-HK`. You can get the chain for any locale with `project.getTargetLocale(locale)`.

When you call `resource.getTranslation(locale)`:

1. The **source resource** (the resource you called it on) is the base.
2. For each locale in that locale's chain, the project **loader** is called to load that locale's translation data.
3. Each loaded dataset is **layered** onto the current result: messages in the new data add or override by key; keys missing in the new layer keep the value from the previous layer.
4. The final resource is the result after all layers have been applied.

So for `getTranslation('zh-HK')` with chain `['zh', 'zh-Hant', 'zh-HK']`, you get: source → then zh overlay → then zh-Hant overlay → then zh-HK overlay. Later entries in the chain override earlier ones for the same key; missing keys fall back to the previous layer (and ultimately to the source).

### Pseudo Localization

When `getTranslation` is called with the project's `pseudoLocale` (e.g. `en-XA`), it returns a new resource with pseudolocalized message values—useful for testing UI layout and finding hardcoded strings without loading translation files:

```javascript
// Request pseudolocalized messages (project locales.pseudoLocale is 'en-XA')
const pseudoResource = await resource.getTranslation('en-XA');

// Message values are transformed: "Hi, {name}" → "Ħī, {name}"
// Variables and message-format syntax are preserved; only literal text is pseudolocalized
const greeting = pseudoResource.get('sampleKey2')?.format({ name: 'Alice' });
// Result: "Ħī, Alice"
```

### Working with Attributes and Notes

```javascript
// Add notes to messages (MF1 syntax, matching the Main project's format)
resource.add('complex-message', 'You have {count} items', {
  lang: 'en',
  dir: 'ltr',
  dnt: false // do-not-translate flag
}, [
  {
    type: 'DESCRIPTION',
    content: 'This message appears on the welcome screen'
  },
  {
    type: 'CONTEXT',
    content: 'Used when user first logs in'
  }
]);

// Access attributes
const message = resource.get('complex-message');
console.log(message?.attributes.lang); // 'en'
console.log(message?.attributes.dir);  // 'ltr'
console.log(message?.attributes.dnt);  // false
```

### Serialization

```typescript
// Convert resource to JSON
const json = resource.toJSON();
// or without notes
const jsonWithoutNotes = resource.toJSON(true);

// Get data object
const data = resource.getData();

// Message objects in the output only include `attributes` when they differ from
// the resource's attributes, keeping the serialized data compact
```

## API Reference

### MsgProject

**Static Methods:**
- `create(data: MsgProjectData): MsgProject` - Create a new project instance

**Properties:**
- `project: MsgProjectSettings` - Project name, version, and default `format`
- `locales: MsgLocalesSettings` - Locale configuration
- `loader: MsgTranslationLoader` - Translation loader function
- `format: MsgFormat` - The project-wide default format (`'MF1' | 'MF2' | 'NONE'`), defaulting to `'MF2'`; resources (and, through them, messages) inherit this value unless they specify their own

**Methods:**
- `getTargetLocale(locale: string): string[] | undefined` - Returns the language fallback chain (array of locale codes) for the specified locale, or `undefined` if the locale is not configured in `targetLocales`

### MsgResource

**Static Methods:**
- `create(data: MsgResourceData, project: MsgProject): MsgResource` - Create a new resource

**Methods:**
- `add(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]): MsgResource` - Add a message
- `addNote(type: NoteTypes, content: string): MsgResource` - Add a note (returns `this` for chaining)
- `translate(data: MsgResourceData): MsgResource` - Create a translated version
- `getTranslation(lang: string): Promise<MsgResource>` - Load and apply translations. When `lang` matches the project's `pseudoLocale`, returns a resource with pseudolocalized message values instead of loading from the loader.
- `getProject(): MsgProject` - Returns the project instance associated with the resource
- `getData(stripNotes?: boolean): MsgResourceData` - Get resource data. Message objects in the output omit `attributes` when they match the resource's attributes (to avoid redundancy). The resource's `format` is omitted when it equals the project's, and a message's `format` is omitted when it equals the resource's
- `toJSON(stripNotes?: boolean): string` - Serialize to JSON

**Properties:**
- `title: string` - Resource title
- `attributes: MsgAttributes` - Resource attributes
- `notes: MsgNote[]` - Resource notes

### MsgMessage

**Static Methods:**
- `create(data: MsgMessageData): MsgMessage` - Create a new message

**Methods:**
- `format(data: Record<string, any>, options?: MessageFormatOptions): string` - Format the message according to its resolved `format`: `MF2` uses MessageFormat 2, `MF1` compiles via `@messageformat/icu-messageformat-1`, and `NONE` returns the raw value
- `formatToParts(data: Record<string, any>, options?: MessageFormatOptions): MessagePart[]` - Format to parts (for `NONE`, a single `{ type: 'text', value }` part)
- `addNote(type: NoteTypes, content: string): MsgMessage` - Add a note (returns `this` for chaining)
- `getData(stripNotes?: boolean): MsgMessageData` - Get message data
- `toJSON(stripNotes?: boolean): string` - Serialize to JSON

**Properties:**
- `key: string` - Message key
- `value: string` - Message value
- `attributes: MsgAttributes` - Message attributes (lang, dir, dnt, format)
- `notes: MsgNote[]` - Message notes

### Types

- `MsgFormat` - `'MF1' | 'MF2' | 'NONE'`; the formatting syntax for a message.
- `MsgAttributes` - `{ lang?: string; dir?: string; dnt?: boolean; format?: MsgFormat }`.

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run coverage

# Build the project
npm run build
```

## License

See LICENSE file for details.

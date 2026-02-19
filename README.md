# msg

A TypeScript library for managing internationalization (i18n) messages with support for message formatting, translation management, and localization workflows.

## Overview

`msg` provides a structured approach to managing translatable messages in your application. It integrates with [MessageFormat 2](https://messageformat.unicode.org/) (MF2) for advanced message formatting and supports:

- **Message Management**: Organize messages into resources with keys and values
- **Translation Loading**: Load translations from external sources via customizable loaders
- **Pseudo Localization**: Request a pseudolocalized resource for UI testing via `getTranslation(pseudoLocale)`
- **Message Formatting**: Format messages with parameters using MessageFormat 2 (MF2) syntax
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
- A value (the message text, supports MessageFormat 2 (MF2) syntax)
- Attributes (lang, dir, dnt)
- Notes
- Formatting methods using MessageFormat 2

## Usage

### Basic Setup

The following example matches the ES module output of the **msg-cli** `create project` command—a typical project file that loads translations from JSON under a translations directory:

```typescript
import { MsgProject } from '@worldware/msg';

const TRANSLATION_IMPORT_PATH = '../l10n/translations';
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
  project: { name: 'my-app', version: 1 },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: {
      'en': ['en'],
      'es': ['es'],
      'fr': ['fr'],
      'fr-CA': ['fr', 'fr-CA']
    }
  },
  loader
});
```

When using this in your app, import the default export as your project and pass it to `MsgResource.create` (see below).

### Creating a Resource

```typescript
// Create a resource with messages
const resource = MsgResource.create({
  title: 'CommonMessages',
  attributes: {
    lang: 'en',
    dir: 'ltr'
  },
  messages: [
    {
      key: 'greeting',
      value: 'Hello, {$name}!'
    },
    {
      key: 'welcome',
      value: 'Welcome to our application'
    }
  ]
}, project);

// Or add messages programmatically
resource.add('goodbye', 'Goodbye, {$name}!', {
  lang: 'en',
  dir: 'ltr'
});
```

### Formatting Messages

```typescript
// Get a message and format it
const greetingMsg = resource.get('greeting');
const formatted = greetingMsg?.format({ name: 'Alice' });
// Result: "Hello, Alice!"
```

### Loading Translations

```typescript
// Load a translation for a specific language
const spanishResource = await resource.getTranslation('es');

// The translated resource will have Spanish messages where available,
// falling back to the source messages for missing translations
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

```typescript
// Request pseudolocalized messages (project locales.pseudoLocale is 'en-XA')
const pseudoResource = await resource.getTranslation('en-XA');

// Message values are transformed: "Hello, {$name}!" → "Ħḗḗŀŀǿǿ, {$name}!"
// Variables and MF2 syntax are preserved; only literal text is pseudolocalized
const greeting = pseudoResource.get('greeting')?.format({ name: 'Alice' });
// Result: "Ħḗḗŀŀǿǿ, Alice!"
```

### Working with Attributes and Notes

```typescript
// Add notes to messages
resource.add('complex-message', 'You have {$count} items', {
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
- `project: MsgProjectSettings` - Project name and version
- `locales: MsgLocalesSettings` - Locale configuration
- `loader: MsgTranslationLoader` - Translation loader function

**Methods:**
- `getTargetLocale(locale: string): string[] | undefined` - Returns the language fallback chain (array of locale codes) for the specified locale, or `undefined` if the locale is not configured in `targetLocales`

### MsgResource

**Static Methods:**
- `create(data: MsgResourceData, project: MsgProject): MsgResource` - Create a new resource

**Methods:**
- `add(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]): MsgResource` - Add a message
- `translate(data: MsgResourceData): MsgResource` - Create a translated version
- `getTranslation(lang: string): Promise<MsgResource>` - Load and apply translations. When `lang` matches the project's `pseudoLocale`, returns a resource with pseudolocalized message values instead of loading from the loader.
- `getProject(): MsgProject` - Returns the project instance associated with the resource
- `getData(stripNotes?: boolean): MsgResourceData` - Get resource data. Message objects in the output omit `attributes` when they match the resource's attributes (to avoid redundancy)
- `toJSON(stripNotes?: boolean): string` - Serialize to JSON

**Properties:**
- `title: string` - Resource title
- `attributes: MsgAttributes` - Resource attributes
- `notes: MsgNote[]` - Resource notes

### MsgMessage

**Static Methods:**
- `create(data: MsgMessageData): MsgMessage` - Create a new message

**Methods:**
- `format(data: Record<string, any>, options?: MessageFormatOptions): string` - Format the message
- `formatToParts(data: Record<string, any>, options?: MessageFormatOptions): MessagePart[]` - Format to parts
- `addNote(note: MsgNote): void` - Add a note
- `getData(stripNotes?: boolean): MsgMessageData` - Get message data
- `toJSON(stripNotes?: boolean): string` - Serialize to JSON

**Properties:**
- `key: string` - Message key
- `value: string` - Message value
- `attributes: MsgAttributes` - Message attributes (lang, dir, dnt)
- `notes: MsgNote[]` - Message notes

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

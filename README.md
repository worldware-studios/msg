# msg

A TypeScript library for managing internationalization (i18n) messages with support for message formatting, translation management, and localization workflows.

## Overview

`msg` provides a structured approach to managing translatable messages in your application. It integrates with [MessageFormat 2](https://messageformat.unicode.org/) (MF2) for advanced message formatting and supports:

- **Message Management**: Organize messages into resources with keys and values
- **Translation Loading**: Load translations from external sources via customizable loaders
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

```typescript
import { MsgProject, MsgResource } from '@worldware/msg';

// Create a project configuration
const project = MsgProject.create({
  project: {
    name: 'my-app',
    version: 1
  },
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: {
      'en': ['en'],
      'es': ['es'],
      'fr': ['fr'],
      'fr-CA': ['fr', 'fr-CA']  // Falls back to 'fr' if 'fr-CA' not available
    }
  },
  loader: async (project, title, lang) => {
    // Custom loader to fetch translation data
    const path = `./translations/${project}/${lang}/${title}.json`;
    const data = await import(path);
    return data;
  }
});
```

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
      value: 'Hello, {name}!'
    },
    {
      key: 'welcome',
      value: 'Welcome to our application'
    }
  ]
}, project);

// Or add messages programmatically
resource.add('goodbye', 'Goodbye, {name}!', {
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

### Working with Attributes and Notes

```typescript
// Add notes to messages
resource.add('complex-message', 'This is a complex message', {
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
console.log(message?.lang); // 'en'
console.log(message?.dir);  // 'ltr'
console.log(message?.dnt);  // false
```

### Serialization

```typescript
// Convert resource to JSON
const json = resource.toJSON();
// or without notes
const jsonWithoutNotes = resource.toJSON(true);

// Get data object
const data = resource.getData();
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
- `getTranslation(lang: string): Promise<MsgResource>` - Load and apply translations
- `getData(stripNotes?: boolean): MsgResourceData` - Get resource data
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
- `attributes: MsgAttributes` - Message attributes
- `lang: string` - Language code
- `dir: string` - Text direction
- `dnt: boolean` - Do-not-translate flag
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

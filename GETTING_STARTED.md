# Getting Started with `@worldware/msg`

This guide walks you from installation to formatting your first messages,
including choosing between MessageFormat 2 (MF2), MessageFormat 1 (MF1), and
unformatted (`NONE`) strings. For the full API, see [`README.md`](./README.md).

## 1. Install

```bash
npm install @worldware/msg
```

The MF1 and MF2 formatters (`messageformat` and
`@messageformat/icu-messageformat-1`) are bundled as dependencies — you do not
need to install them separately.

## 2. Create a project

A project holds shared configuration: locales, a translation loader, and the
default message `format` that resources and messages inherit.

```typescript
import { MsgProject } from '@worldware/msg';

const loader = async (project, title, language) => {
  const path = `../l10n/translations/${project}/${language}/${title}.json`;
  const module = await import(path, { with: { type: 'json' } });
  return module.default;
};

const project = MsgProject.create({
  project: { name: 'my-app', version: 1 }, // format defaults to 'MF2'
  locales: {
    sourceLocale: 'en',
    pseudoLocale: 'en-XA',
    targetLocales: { en: ['en'], es: ['es'] }
  },
  loader
});
```

## 3. Create a resource and add messages

A resource is a keyed collection of messages. It inherits the project's
`format` unless you set your own on the resource or a message.

```typescript
import { MsgResource } from '@worldware/msg';

const resource = MsgResource.create({
  title: 'CommonMessages',
  attributes: { lang: 'en', dir: 'ltr' }, // inherits format: 'MF2'
  messages: [
    { key: 'greeting', value: 'Hello, {$name}!' }
  ]
}, project);

resource.add('itemCount', 'You have {$count} items');
```

## 4. Format messages

```typescript
resource.get('greeting')?.format({ name: 'Alice' }); // "Hello, Alice!"
```

## 5. Choose a format

Set `format` to `'MF1'`, `'MF2'`, or `'NONE'` on a project, resource, or
message. It is a TypeScript union type (there is no enum), and lower levels
inherit from higher levels unless they override it.

Message `lang`, `dir`, and `dnt` also inherit from the resource when omitted
(including in compact translation JSON). An explicit per-message value wins.

```typescript
// MF1 syntax (ICU MessageFormat 1)
resource.add('files', '{count, plural, one {# file} other {# files}}', { format: 'MF1' });
resource.get('files')?.format({ count: 3 }); // "3 files"

// NONE — returned verbatim, no interpolation
resource.add('token', 'build:{sha}', { format: 'NONE' });
resource.get('token')?.format({ sha: 'abc' }); // "build:{sha}"
```

Because the default is `MF2`, existing MF2 code keeps working with no changes.

## 6. Load translations

```typescript
const spanish = await resource.getTranslation('es');
```

Translations preserve each message's `format`, so an MF1 or `NONE` message stays
MF1 or `NONE` after translation unless the translation overrides it.

Call `getTranslation` with the project's `pseudoLocale` (for example `'en-XA'`) to
get a pseudo-localized resource for UI testing. Literal text is transformed while
MF1/MF2 placeholders and syntax are preserved according to each message's
`format`.

## Next steps

- Read [`README.md`](./README.md) for the complete API, serialization rules,
  language fallback chains, and pseudo-localization.
- Generate browsable API docs locally with `npm run docs` (output in `docs/`).

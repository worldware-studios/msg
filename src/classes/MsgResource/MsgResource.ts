import { type MsgMessageData, MsgMessage } from "../MsgMessage/MsgMessage.js";
import { MSG_DEFAULT_FORMAT, MsgInterface, type MsgAttributes, type MsgNote, type NoteTypes } from "../MsgInterface/MsgInterface.js";
import { applyAttributes } from "../../lib/apply-attributes.js";
import { MsgProject } from "../MsgProject/MsgProject.js";
import { pseudoLocalize } from "../../lib/pseudo-localize.js";

/**
 * Plain data used to create or describe a {@link MsgResource}.
 *
 * @typeParam K - Union of message keys. Defaults to `string`.
 */
export type MsgResourceData<K extends string = string> = {
  /** Title that identifies this resource within a project. */
  title: string
  /** Locale and formatting metadata for the resource. */
  attributes: MsgAttributes
  /** Optional notes for translators and tooling. */
  notes?: MsgNote[]
  /** Optional list of messages in this resource. */
  messages?: MsgMessageData<K>[]
}

/**
 * The tree shape of an untyped resource (`MsgResource<string>`): every node is
 * either a message or another branch.
 */
export type MsgTreeNode = { readonly [segment: string]: MsgMessage | MsgTreeNode };

/** First dot-separated segment of a key: `'home.cta.label'` → `'home'`. */
type MsgKeyHead<K extends string> = K extends `${infer H}.${string}` ? H : K;

/** Remainder of a key after the segment `H`: `('home.cta.label', 'home')` → `'cta.label'`. */
type MsgKeyRest<K extends string, H extends string> = K extends `${H}.${infer R}` ? R : never;

/**
 * Nested view of a resource's dot-separated message keys.
 *
 * For keys `'home.title' | 'home.cta.label' | 'footer'` this is
 * `{ home: { title: MsgMessage; cta: { label: MsgMessage } }; footer: MsgMessage }`.
 * When `K` is `string`, it is {@link MsgTreeNode}, so typed trees stay
 * assignable to untyped ones.
 *
 * @typeParam K - Union of message keys.
 */
export type MsgTree<K extends string> = string extends K
  ? MsgTreeNode
  : { readonly [H in MsgKeyHead<K>]: H extends K ? MsgMessage : MsgTree<MsgKeyRest<K, H>> };

/**
 * A message as {@link MsgResource.create} accepts it: {@link MsgMessageData}
 * with readonly properties, so `as const` data is accepted.
 */
type MsgMessageInput = {
  readonly key: string
  readonly value: string
  readonly attributes?: Readonly<MsgAttributes>
  readonly notes?: readonly Readonly<MsgNote>[]
};

/**
 * Key union of the messages passed to {@link MsgResource.create}. Keys are
 * literal types only for `as const` data; an empty list yields `string` so
 * the resource stays usable.
 */
type MsgMessageKeys<M extends readonly MsgMessageInput[]> = M extends readonly [] ? string : M[number]['key'];

/**
 * Every proper dot-separated prefix of a key, i.e. its branches in the tree:
 * `'a.b.c'` → `['a', 'a.b']`.
 */
function branchPrefixes(key: string): string[] {
  const prefixes: string[] = [];
  for (let i = key.indexOf('.'); i !== -1; i = key.indexOf('.', i + 1)) {
    prefixes.push(key.slice(0, i));
  }
  return prefixes;
}

/**
 * A named collection of messages belonging to a {@link MsgProject}.
 *
 * Resources inherit format defaults from their project, support translation
 * loading (including pseudo-localization), and can serialize to plain data.
 *
 * @typeParam K - Union of message keys. Inferred by {@link MsgResource.create}
 *   when its messages are `as const`; otherwise `string`.
 */
export class MsgResource<K extends string = string> extends Map<K, MsgMessage> implements MsgInterface {

  private _attributes: MsgAttributes = {};
  private _notes: MsgNote[] = [];
  private _title: string;

  private _project: MsgProject;

  /**
   * For every key prefix that is a branch in the tree (`a` and `a.b` for key
   * `a.b.c`), how many stored keys pass through it. Keeps collision checks
   * proportional to key depth instead of resource size.
   */
  private _branches = new Map<string, number>();

  /**
   * Builds a resource from {@link MsgResourceData} and an owning project.
   *
   * When `messages` is provided, each entry is added to the resource.
   * When omitted, the resource starts empty.
   *
   * **Typed keys are opt-in with `as const`.** When `messages` (or the whole
   * definition) is `as const`, the resource's key type is the union of its
   * message keys, so `get()`, `has()` and `toTree()` reject unknown keys.
   * Without `as const` the key type is `string`, exactly as before, so a
   * resource can keep growing through `add()`.
   *
   * ```ts
   * const typed = MsgResource.create({
   *   title: 'Home',
   *   attributes: { lang: 'en' },
   *   messages: [{ key: 'home.title', value: 'Welcome' }] as const
   * }, project);
   * typed.get('home.titel'); // compile error
   * ```
   *
   * `as const` data is a tuple, so inference also scales to large resources:
   * up to TypeScript's ~10,000-element tuple limit.
   *
   * @typeParam M - The message list; its `key` types become the resource's
   *   key type.
   * @throws {TypeError} When one key is a dot-separated prefix of another
   *   (for example `a` and `a.b`).
   */
  static create<M extends readonly MsgMessageInput[] = MsgMessageData[]>(
    data: {
      readonly title: string
      readonly attributes: Readonly<MsgAttributes>
      readonly notes?: readonly Readonly<MsgNote>[]
      readonly messages?: M
    },
    project: MsgProject
  ): MsgResource<MsgMessageKeys<M>> {
    const { title, attributes, notes, messages}  = data;
    const res = new MsgResource<MsgMessageKeys<M>>(title, attributes, project, notes);

    if (messages) {
      messages.forEach(messageData => {
        const {key, value, attributes, notes} = messageData;
        // Copy readonly (`as const`) notes so messages own a mutable list.
        res.add(key, value, attributes, notes && [...notes]);
      })
    } else {
      res.clear();
    }

    return res;
  }

  /**
   * Creates a resource bound to a project. Prefer {@link MsgResource.create}.
   */
  private constructor (title: string, attributes: Readonly<MsgAttributes>, project: MsgProject, notes?: readonly Readonly<MsgNote>[]) {
    super();
    this._title = title;

    // Inherit the project's format unless the resource specifies its own.
    this._attributes = applyAttributes(attributes, { format: project.format });
    this._project = project;

    if (notes) {
      notes.forEach(note => this.setNote(note));
    }

  }

  /**
   * Returns true when the message's attributes match this resource's attributes.
   */
  private hasMatchingAttributes(message: MsgMessage): boolean {
    const res = this.attributes;
    const msg = message.attributes;
    return res.lang === msg.lang
      && res.dir === msg.dir
      && res.dnt === msg.dnt
      && this.resolveFormat(res) === this.resolveFormat(msg);
  }

  /**
   * Resolves a format from attributes, falling back to the library default.
   */
  private resolveFormat(attributes: MsgAttributes) {
    return attributes.format ?? MSG_DEFAULT_FORMAT;
  }

  /** Locale and formatting metadata for this resource. */
  public get attributes() {
    return this._attributes;
  }

  /** Replaces the resource's locale and formatting metadata. */
  public set attributes(attributes: MsgAttributes) {
    this._attributes = applyAttributes(attributes);
  }
  
  /** Notes attached to this resource for translators and tooling. */
  public get notes() {
    return this._notes;
  }

  /** Replaces the notes attached to this resource. */
  public set notes(notes: MsgNote[]) {
    this._notes = notes;
  }

  /**
   * Appends a note to this resource.
   *
   * @returns This resource, for chaining.
   */
  public addNote(type: NoteTypes, content: string) {
    return this.setNote({ type, content });
  }

  /**
   * Appends a full note object to this resource.
   *
   * @returns This resource, for chaining.
   */
  private setNote(note: MsgNote) {
    this.notes.push(note);
    return this;
  }

  /** Title that identifies this resource within a project. */
  public get title() {
   return this._title;
  }
  
  /** Sets the title that identifies this resource within a project. */
  public set title(title: string) {
    this._title = title;
  }

  /**
   * Returns the project this resource belongs to.
   */
  public getProject(): MsgProject {
    return this._project;
  }

  /**
   * Adds a message to this resource, merging resource attributes with any overrides.
   *
   * Unspecified `lang`, `dir`, and `dnt` inherit from this resource; explicit
   * values on the message win.
   *
   * Accepts any string key and does not change the resource's key type.
   *
   * @returns This resource, for chaining.
   * @throws {TypeError} When `key` and an existing key are dot-separated
   *   prefixes of one another (for example `a` and `a.b`).
   */
  public add(key: string, value: string, attributes?: MsgAttributes, notes?: MsgNote[]) {

    const merged = {...this.attributes, ...attributes};

    const msg = MsgMessage.create({
      key,
      value,
      attributes: merged,
      notes
    });
    // `add()` deliberately accepts any string so untyped, chained `add()` calls
    // keep compiling; the key type only narrows through `create()`.
    this.set(key as K, msg);
    return this;
  }

  /**
   * Stores a message under `key`.
   *
   * @throws {TypeError} When `key` and an existing key are dot-separated
   *   prefixes of one another (for example `a` and `a.b`), since a tree node
   *   cannot be both a message and a branch.
   */
  public override set(key: K, value: MsgMessage): this {
    // Replacing an existing message cannot change the tree's shape.
    if (!this.has(key)) {
      this.assertNoCollision(key);
      this.updateBranches(key, 1);
    }
    return super.set(key, value);
  }

  /** Removes the message stored under `key`. */
  public override delete(key: K): boolean {
    const deleted = super.delete(key);
    if (deleted) {
      this.updateBranches(key, -1);
    }
    return deleted;
  }

  /** Removes every message from this resource. */
  public override clear(): void {
    super.clear();
    this._branches.clear();
  }

  /**
   * Throws when `key` would be both a message and a branch in the tree.
   */
  private assertNoCollision(key: string): void {
    if (this._branches.has(key)) {
      const descendant = [...this.keys()].find(existing => existing.startsWith(`${key}.`));
      throw new TypeError(`Message key "${key}" collides with "${descendant}": a key cannot also be a prefix of another key.`);
    }
    const leaf = branchPrefixes(key).find(prefix => this.has(prefix as K));
    if (leaf !== undefined) {
      throw new TypeError(`Message key "${key}" collides with "${leaf}": a key cannot also be a prefix of another key.`);
    }
  }

  /**
   * Adds `delta` to the count of every branch `key` passes through,
   * dropping branches that no key uses any more.
   */
  private updateBranches(key: string, delta: 1 | -1): void {
    for (const prefix of branchPrefixes(key)) {
      const count = (this._branches.get(prefix) ?? 0) + delta;
      if (count > 0) {
        this._branches.set(prefix, count);
      } else {
        this._branches.delete(prefix);
      }
    }
  }

  /**
   * Returns a nested, read-only view of this resource's messages, splitting
   * keys on `.`: `resource.toTree().home.cta.label` is the message stored
   * under `'home.cta.label'`.
   *
   * The key type comes from `this` rather than the class parameter so that a
   * typed resource stays assignable to a plain `MsgResource`.
   */
  public toTree<T extends string>(this: MsgResource<T>): MsgTree<T> {
    // Null-prototype nodes, so keys like `constructor` or `__proto__` become
    // ordinary own properties instead of resolving to Object.prototype members.
    const root: Record<string, unknown> = Object.create(null);
    for (const [key, msg] of this) {
      const segments = key.split('.');
      const leaf = segments.pop() as string; // split() always yields at least one segment
      let node = root;
      for (const segment of segments) {
        // Collision checks in set() guarantee an existing node here is a branch.
        node = (node[segment] ??= Object.create(null)) as Record<string, unknown>;
      }
      node[leaf] = msg;
    }
    return root as MsgTree<T>;
  }

  /**
   * Builds a translated copy of this resource from translation data.
   *
   * Messages present in the translation replace the source; missing keys keep
   * the source message. Keys that are not in this resource are ignored, so the
   * translated resource has the same keys (and key type) as the source. Notes
   * are carried over from the source. Unspecified message `lang`, `dir`, and
   * `dnt` inherit from the translated resource.
   *
   * @throws {TypeError} When the translation title does not match this resource.
   */
  public translate(data: MsgResourceData): MsgResource<K> {
    const {title, attributes, messages} = data;

    if (title !== this.title) {
      throw new TypeError('Title of resource and translations do not match.');
    }

    // Built directly (not via create()) so the translation keeps this
    // resource's key type; it starts empty and is filled below.
    const translated = new MsgResource<K>(
      title,
      // preserve the source resource's format unless the translation overrides it
      this.preserveFormat(attributes, this.attributes.format),
      this._project,
      this.notes // transfer the notes
    );

    // use messages from the resource as defaults
    this.forEach((msg, key) => {
      translated.set(key, msg);
    })

    messages?.forEach(messageData => {
      const {key, value, attributes} = messageData;
      const source = this.get(key as K);
      // A translation can only replace source messages, never add keys.
      if (!source) {
        return;
      }
      // Inherit lang/dir/dnt from the translated resource (same merge as add()),
      // while still preserving the source message's format when the translation
      // does not set one.
      translated.add(
        key,
        value,
        this.preserveFormat(attributes, source.attributes.format),
        source.notes
      );
    })

    return translated;
  }

  /**
   * Merge a `format` into an attribute set unless one is already present,
   * so translations inherit the source's format without overriding an
   * explicitly translated one. Returns the input unchanged when there is
   * no format to preserve.
   */
  private preserveFormat(attributes: MsgAttributes, format: MsgAttributes['format']): MsgAttributes;
  private preserveFormat(attributes: MsgAttributes | undefined, format: MsgAttributes['format']): MsgAttributes | undefined;
  private preserveFormat(
    attributes: MsgAttributes | undefined,
    format: MsgAttributes['format']
  ): MsgAttributes | undefined {
    if (format === undefined || attributes?.format !== undefined) {
      return attributes;
    }
    return { ...attributes, format };
  }

  /**
   * Loads and applies translations for a locale via the project loader.
   *
   * When `lang` is the project's pseudo-locale, returns a pseudo-localized
   * copy without calling the loader. Each message is transformed according to
   * its resolved `format` (`MF1`, `MF2`, or `NONE`): only literal text is
   * accented; placeholders and message-format syntax are preserved.
   *
   * When `lang` is omitted, returns a clone of the current resource.
   *
   * @throws {Error} When the locale is unsupported or its language chain is empty.
   */
  public async getTranslation(lang?: string): Promise<MsgResource<K>> {

    // if no lang is passed, clone current instance
    if (!lang) {
      return MsgResource.create(this.getData(), this.getProject());
    }

    const project = this._project;
    const pseudoLocale = project.locales.pseudoLocale;
    if (lang === pseudoLocale) {
      const messages = [...this.entries()].map(([key, msg]) => ({
        key,
        value: pseudoLocalize(msg.value, this.resolveFormat(msg.attributes)),
        attributes: { ...msg.attributes, lang: pseudoLocale }
      }));
      const pseudolocalizedData: MsgResourceData = {
        title: this.title,
        attributes: { ...this.attributes, lang: pseudoLocale },
        notes: this.notes.length > 0 ? this.notes : undefined,
        messages
      };
      return this.translate(pseudolocalizedData);
    }

    const languageChain = project.getTargetLocale(lang);

    if(!languageChain) {
      throw new Error("Unsupported locale for resource.");
    }

    if(languageChain.length == 0) {
      throw new Error(`Empty language chain for locale: ${lang}`)
    }

    let translated: MsgResource<K> = this;

    for (let i = 0; i < languageChain.length; i++) {
      const lang = languageChain[i];
      if (lang && project._locales.targetLocales[lang]) {
        translated = await translated._project._loader(project.project.name, translated.title, lang) 
                              .then(data => translated.translate(data))       
      }
    }

    return translated;
  }

  /**
   * Returns a plain data object for this resource and its messages.
   *
   * Attributes that match the resource or project defaults are omitted where
   * possible to keep the output compact.
   *
   * @param stripNotes - When true, notes are omitted from the result.
   */
  public getData(stripNotes: boolean = false): MsgResourceData<K> {

    const resourceFormat = this.resolveFormat(this.attributes);
    const projectFormat = this._project.format;

    const messages: MsgMessageData<K>[] = [];
    this.forEach((msg, key) => {
      if (this.hasMatchingAttributes(msg)) {
        // remove attributes from message data if they match the resource attributes
        const data: MsgMessageData<K> = {
          key,
          value: msg.value,
          notes: !stripNotes && msg.notes.length > 0 ? msg.notes : undefined
        };
        messages.push(data);
      } else {
        const data = { ...msg.getData(stripNotes), key };
        // omit the message's format when it matches the resource's format
        if (data.attributes && this.resolveFormat(data.attributes) === resourceFormat) {
          const { format, ...rest } = data.attributes;
          data.attributes = rest;
        }
        messages.push(data);
      }
    });

    // omit the resource's format when it matches the project's format
    const attributes: MsgAttributes = { ...this.attributes };
    if (this.resolveFormat(attributes) === projectFormat) {
      delete attributes.format;
    }

    return {
      title: this.title,
      attributes,
      notes: !stripNotes && this.notes.length > 0 ? this.notes : undefined,
      messages
    }
  }

  /**
   * Serializes this resource to a formatted JSON string.
   *
   * @param stripNotes - When true, notes are omitted from the serialized data.
   */
  public toJSON(stripNotes: boolean = false) {
    return JSON.stringify(this.getData(stripNotes), null, 2);
  }
  
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORD_CATALOG_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@rahulmrx/game-ready-dictionary' {
  export class TrieEngine {
    constructor(data?: unknown);
    validate(word: string): boolean;
    prefixSearch(prefix: string): string[];
  }
}

declare module '@rahulmrx/game-ready-dictionary/data' {
  const value: Record<string, unknown>;
  export default value;
}


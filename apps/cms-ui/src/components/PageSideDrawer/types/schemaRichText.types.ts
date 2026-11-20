import type { Editor } from '@tiptap/react';

export interface SlashState {
  query: string;
  /** Document position of the "/" that opened the menu. */
  from: number;
  top: number;
  left: number;
}

export type EditorChain = ReturnType<Editor['chain']>;

export interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  run: (chain: EditorChain) => EditorChain;
}

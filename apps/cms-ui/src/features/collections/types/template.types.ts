export interface DynamicComponentNode {
  tagName?: string;
  type?: string;
  content?: string;
  classes?: Array<string | { name: string; [key: string]: unknown }>;
  attributes?: Record<string, unknown>;
  style?: Record<string, string | number>;
  components?: DynamicComponentNode[] | string;
  traits?: unknown[];
  [key: string]: unknown;
}

export interface DynamicStyleRule {
  selectors?: unknown[];
  style?: Record<string, string | number>;
  mediaText?: string;
  [key: string]: unknown;
}

export interface DynamicGrapesPage {
  id?: string;
  name?: string;
  component?: DynamicComponentNode;
  styles?: DynamicStyleRule[];
  [key: string]: unknown;
}

export interface DynamicPageTemplate {
  name?: string;
  version?: string;
  pages?: DynamicGrapesPage[];
  components?: DynamicComponentNode[] | DynamicComponentNode | string;
  styles?: DynamicStyleRule[] | string;
  html?: string;
  css?: string;
  assets?: unknown[];
  [key: string]: unknown;
}

export interface TemplateValidationError {
  path: string;
  message: string;
}

export interface TemplateValidationResult {
  success: boolean;
  isGrapesJsProjectData?: boolean;
  projectData?: Record<string, unknown>;
  html?: string;
  css?: string;
  errors?: TemplateValidationError[];
}

export type ImportActionChoice = 'replace' | 'append';

export interface ContentVersionRecord {
  id: string;
  entryId: string;
  locale: string;
  data: {
    title: string;
    slug: string;
    body?: unknown;
    [key: string]: unknown;
  };
  versionNo: number;
  actorType: string;
  createdByUserId: string;
  comment: string | null;
  createdAt: string;
}

export interface TemplateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: TemplateValidationResult) => void;
}

export interface TemplateErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: TemplateValidationError[];
  fileName?: string;
}

export interface ExistingContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (choice: ImportActionChoice) => void;
}

export interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schemaSlug: string;
  pageId: string;
  currentVersionNo?: number;
  currentPageData?: {
    title: string;
    slug: string;
    body?: unknown;
  };
  onRevertSuccess: (revertedData: ContentVersionRecord['data']) => void;
}

export interface SnapshotDiffEntry {
  field: string;
  changeType: 'added' | 'modified' | 'removed' | 'unchanged';
  previousValue: unknown;
  currentValue: unknown;
}

export interface SnapshotDetailDeckProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: ContentVersionRecord | null;
  previousSnapshot?: ContentVersionRecord | null;
  currentPageData?: {
    title: string;
    slug: string;
    body?: unknown;
  };
  isCurrentVersion: boolean;
  onRevert: (versionNo: number) => void;
  isReverting: boolean;
}

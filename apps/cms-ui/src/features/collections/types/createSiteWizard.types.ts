export interface CreateSiteWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (slug: string) => void;
}

export type WizardStepId =
  | 'basics'
  | 'start'
  | 'articles'
  | 'blog'
  | 'pages'
  | 'review';

export type WizardStartMode = 'blank' | 'existing' | 'template';

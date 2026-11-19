export interface PageToDeleteItem {
  id: string;
  title: string;
}

export interface DeletePageModalProps {
  page: PageToDeleteItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  isError: boolean;
}

export interface SiteToDeleteItem {
  id: string;
  name: string;
  slug: string;
  entryCount?: number;
}

export interface DeleteSiteModalProps {
  site: SiteToDeleteItem | null;
  onClose: () => void;
  onConfirm: (force: boolean) => void;
  isPending: boolean;
  isError?: boolean;
  errorMessage?: string | null;
}

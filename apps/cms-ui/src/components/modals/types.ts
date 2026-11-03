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

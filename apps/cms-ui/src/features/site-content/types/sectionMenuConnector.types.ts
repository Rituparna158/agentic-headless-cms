export interface MenuOption {
  id: string;
  name: string;
  linkCount?: number;
}

export interface SectionMenuConnectorProps {
  secHtml: string;
  onHtmlChange: (html: string) => void;
  secRole: '' | 'header' | 'footer';
  siteId: string;
  availableMenus: MenuOption[];
}

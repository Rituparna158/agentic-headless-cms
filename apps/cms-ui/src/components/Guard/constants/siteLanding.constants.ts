/**
 * Where opening a website leads: the first section the role may use, so a
 * designer lands on Menus and a media manager on Media instead of being sent
 * to a page they cannot open.
 */
export const SITE_LANDING_SECTIONS: { path: string; caps: string[] }[] = [
  { path: 'posts', caps: ['manage_content', 'publish_content'] },
  { path: 'menus', caps: ['manage_appearance'] },
  { path: 'media', caps: ['manage_media'] },
  { path: 'settings', caps: ['manage_settings'] },
];

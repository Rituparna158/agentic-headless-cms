/**
 * Pure UI copy and accessibility label constants.
 * Strictly pure data - ZERO JSX.
 */

export const UI_TEXT = {
  APP_NAME: 'Agentic Headless CMS',
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  SAVE_CHANGES: 'Save Changes',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  CONFIRM: 'Confirm',
  SKIP_TO_CONTENT: 'Skip to main content',
  OFFLINE_WARNING:
    'You are currently offline. Changes will not be synchronized.',
  POLLING_ERROR: 'Live update connection lost. Retrying...',
  UNSAVED_CHANGES: 'You have unsaved changes that will be lost.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  ACCESS_DENIED: 'You do not have permission to view this resource.',
  NOT_FOUND: 'The page you requested was not found.',
} as const;

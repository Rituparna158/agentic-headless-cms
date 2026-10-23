import type { DynamicFormField } from '../types/page-builder.types';

export const DEFAULT_HERO_STATE = {
  title: '',
  subtitle: '',
  buttonText: '',
  buttonUrl: '',
  backgroundColor: '',
  textColor: '',
  titleColor: '',
  subtitleColor: '',
  buttonColor: '',
  buttonTextColor: '',
  showButton: true,
  alignment: 'center' as const,
};

export const DEFAULT_CONTACT_FORM_STATE = {
  title: 'Contact Us',
  subtitle: 'We would love to hear from you. Fill out the form below.',
  showName: true,
  showPhone: false,
  showCompany: false,
  buttonText: 'Send Message',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  inputBackgroundColor: '#f7fafc',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center' as const,
};

export const DEFAULT_SEARCH_BAR_STATE = {
  placeholder: 'Search for anything...',
  buttonText: 'Search',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  showButton: true,
  borderRadius: 8,
  iconColor: '#a0aec0',
  alignment: 'center' as const,
  maxWidth: '600px',
};

export const DEFAULT_NEWSLETTER_FORM_STATE = {
  title: 'Subscribe to our Newsletter',
  subtitle: 'Get the latest news and updates right to your inbox.',
  placeholder: 'Enter your email address',
  buttonText: 'Subscribe',
  backgroundColor: '#f7fafc',
  textColor: '#1a202c',
  inputBackgroundColor: '#ffffff',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center' as const,
  layout: 'inline' as const,
};

export const DEFAULT_DYNAMIC_FORM_STATE = {
  title: 'Custom Form',
  subtitle: 'Please fill out this form.',
  fields: [] as DynamicFormField[],
  buttonText: 'Submit',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  inputBackgroundColor: '#f7fafc',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center' as const,
};

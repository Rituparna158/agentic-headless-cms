export interface NormalizedCollaborator {
  key: string;
  displayName: string;
  email: string;
  initials: string;
}

export function normalizeCollaborator(
  actor: string | undefined | null,
  currentUser?: {
    id?: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null,
): NormalizedCollaborator {
  const trimmed = (actor || '').trim();
  const lower = trimmed.toLowerCase();

  const currentUserFullName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
    : '';

  if (!trimmed) {
    const defaultName = currentUserFullName || currentUser?.email || 'Admin';
    return {
      key: currentUser?.email?.toLowerCase() || 'admin',
      displayName: defaultName,
      email: currentUser?.email || '',
      initials: (defaultName.charAt(0) || 'A').toUpperCase(),
    };
  }

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed,
    );

  // Check if actor matches current user by id, email, first name, last name, full name, or generic admin aliases
  const matchesCurrentUser =
    (currentUser?.id &&
      trimmed.toLowerCase() === currentUser.id.toLowerCase()) ||
    (currentUser?.email && lower === currentUser.email.toLowerCase()) ||
    (currentUser?.firstName && lower === currentUser.firstName.toLowerCase()) ||
    (currentUser?.lastName && lower === currentUser.lastName.toLowerCase()) ||
    (currentUserFullName && lower === currentUserFullName.toLowerCase()) ||
    lower === 'admin' ||
    lower === 'cms admin' ||
    lower === 'system administrator';

  if (matchesCurrentUser && currentUser?.email) {
    const fullName = currentUserFullName || currentUser.email;
    return {
      key: currentUser.email.toLowerCase(),
      displayName: fullName,
      email: currentUser.email,
      initials: (fullName.charAt(0) || 'U').toUpperCase(),
    };
  }

  // If matches admin or generic but no currentUser email is available yet
  if (
    lower === 'admin' ||
    lower === 'cms admin' ||
    lower === 'system administrator'
  ) {
    const displayName = currentUserFullName || 'Admin';
    return {
      key: 'admin',
      displayName,
      email: '',
      initials: (displayName.charAt(0) || 'A').toUpperCase(),
    };
  }

  if (isUUID) {
    if (
      currentUser?.id &&
      trimmed.toLowerCase() === currentUser.id.toLowerCase()
    ) {
      const fullName = currentUserFullName || currentUser.email || 'User';
      return {
        key: currentUser.email?.toLowerCase() || trimmed.toLowerCase(),
        displayName: fullName,
        email: currentUser.email || '',
        initials: (fullName.charAt(0) || 'U').toUpperCase(),
      };
    }
    return {
      key: trimmed.toLowerCase(),
      displayName: 'User',
      email: '',
      initials: 'U',
    };
  }

  if (trimmed.includes('@')) {
    const namePart = trimmed.split('@')[0] || trimmed;
    return {
      key: lower,
      displayName: trimmed,
      email: trimmed,
      initials: (namePart.charAt(0) || 'U').toUpperCase(),
    };
  }

  return {
    key: lower,
    displayName: trimmed,
    email: '',
    initials: (trimmed.charAt(0) || 'U').toUpperCase(),
  };
}

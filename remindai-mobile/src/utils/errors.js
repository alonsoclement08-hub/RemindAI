// User-facing error messages in FR (primary) and EN (fallback)
const MESSAGES = {
  network: {
    fr: 'Connexion impossible. Vérifiez votre réseau.',
    en: 'Cannot connect. Check your network.',
  },
  offline: {
    fr: 'Vous êtes hors ligne. Les modifications seront synchronisées à la reconnexion.',
    en: "You're offline. Changes will sync when you reconnect.",
  },
  auth: {
    invalid_credentials: {
      fr: 'Email ou mot de passe incorrect.',
      en: 'Invalid email or password.',
    },
    email_taken: {
      fr: 'Cet email est déjà utilisé.',
      en: 'This email is already registered.',
    },
    session_expired: {
      fr: 'Session expirée. Veuillez vous reconnecter.',
      en: 'Session expired. Please log in again.',
    },
    weak_password: {
      fr: 'Le mot de passe doit contenir au moins 8 caractères.',
      en: 'Password must be at least 8 characters.',
    },
  },
  reminders: {
    create_failed: {
      fr: 'Impossible de créer le rappel. Réessayez.',
      en: 'Could not create reminder. Please try again.',
    },
    tier_limit: {
      fr: 'Limite de 20 rappels atteinte. Passez à Pro pour continuer.',
      en: '20 reminder limit reached. Upgrade to Pro to continue.',
    },
    sync_failed: {
      fr: 'Synchronisation échouée. Les données sont sauvegardées localement.',
      en: 'Sync failed. Your data is saved locally.',
    },
  },
  ai: {
    unavailable: {
      fr: "L'assistant IA est temporairement indisponible.",
      en: 'AI assistant is temporarily unavailable.',
    },
    rate_limit: {
      fr: 'Trop de requêtes IA. Réessayez dans une minute.',
      en: 'Too many AI requests. Try again in a minute.',
    },
  },
  generic: {
    fr: 'Une erreur est survenue. Réessayez.',
    en: 'Something went wrong. Please try again.',
  },
};

const DEFAULT_LANG = 'fr';

/**
 * Resolve a dot-path key to a localized error string.
 * getError('auth.invalid_credentials') → 'Email ou mot de passe incorrect.'
 * getError('auth.invalid_credentials', 'en') → 'Invalid email or password.'
 */
export function getError(key, lang = DEFAULT_LANG) {
  const parts = key.split('.');
  let node = MESSAGES;
  for (const part of parts) {
    node = node?.[part];
  }
  // node is either { fr, en } or undefined
  if (node?.fr || node?.en) {
    return node[lang] ?? node[DEFAULT_LANG];
  }
  return MESSAGES.generic[lang] ?? MESSAGES.generic[DEFAULT_LANG];
}

/**
 * Map an HTTP status code to a user-facing message.
 */
export function errorFromStatus(status, lang = DEFAULT_LANG) {
  if (!navigator?.onLine) return getError('offline', lang);
  if (status === 401) return getError('auth.session_expired', lang);
  if (status === 409) return getError('auth.email_taken', lang);
  if (status === 429) return getError('reminders.tier_limit', lang);
  if (status >= 500) return getError('generic', lang);
  return getError('network', lang);
}

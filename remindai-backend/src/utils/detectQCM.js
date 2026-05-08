function detectQCM(message, category, reminderType) {
  const lower = message.toLowerCase();

  // Pet food — most specific, check first
  const isPetFood =
    (lower.includes('croquette') || lower.includes('pâtée') || lower.includes('nourriture pour') ||
     lower.includes('alimentation') && (lower.includes('chien') || lower.includes('chat')));
  const isPet =
    lower.includes('chien') || lower.includes('chat') || lower.includes('chiot') ||
    lower.includes('chaton') || lower.includes('animal');
  if (isPetFood && isPet) return 'shopping_pet_food';

  if (reminderType === 'shopping' || category === 'errand') return 'shopping_general';
  if (reminderType === 'call') return 'call';
  if (reminderType === 'study') return 'study';
  if (reminderType === 'appointment') return 'appointment';
  if (reminderType === 'medication') return 'medication';

  return null;
}

module.exports = { detectQCM };

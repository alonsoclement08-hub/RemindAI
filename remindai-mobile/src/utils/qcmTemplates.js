// Mirror of backend/src/utils/qcmTemplates.js — kept in sync manually
const qcmTemplates = {
  shopping_pet_food: {
    message: "Pour te recommander les meilleures croquettes, dis-moi quelques infos sur ton animal",
    questions: [
      {
        id: "animal",
        type: "radio",
        label: "Type d'animal ?",
        options: ["Chien", "Chat", "Autre"],
        required: true,
      },
      {
        id: "race",
        type: "dropdown",
        label: "Race ?",
        options: ["Labrador", "Berger Allemand", "Golden Retriever", "Chihuahua", "Bulldog", "Yorkshire", "Beagle", "Autre"],
        required: false,
      },
      {
        id: "age",
        type: "radio",
        label: "Âge ?",
        options: ["0–2 ans", "2–5 ans", "5+ ans"],
        required: true,
      },
      {
        id: "budget",
        type: "radio",
        label: "Budget ?",
        options: ["< 20 €", "20–50 €", "> 50 €"],
        required: true,
      },
      {
        id: "allergies",
        type: "checkbox",
        label: "Allergies connues ?",
        options: ["Poulet", "Bœuf", "Gluten", "Poisson", "Aucune"],
        required: false,
      },
    ],
  },

  shopping_general: {
    message: "Quelques infos pour mieux organiser ton rappel",
    questions: [
      {
        id: "when",
        type: "radio",
        label: "Quand veux-tu ce rappel ?",
        options: ["Aujourd'hui", "Demain", "Cette semaine", "Flexible"],
        required: true,
      },
      {
        id: "budget",
        type: "radio",
        label: "Budget approximatif ?",
        options: ["< 20 €", "20–100 €", "> 100 €", "Pas de limite"],
        required: false,
      },
    ],
  },

  call: {
    message: "Pour préparer ton appel au mieux",
    questions: [
      {
        id: "time",
        type: "radio",
        label: "À quelle heure ?",
        options: ["Matin (7h–12h)", "Après-midi (12h–18h)", "Soir (18h+)"],
        required: true,
      },
      {
        id: "duration",
        type: "radio",
        label: "Durée prévue ?",
        options: ["Rapide (< 5 min)", "Normal (15–30 min)", "Long (1h+)"],
        required: false,
      },
      {
        id: "topic",
        type: "radio",
        label: "Objet de l'appel ?",
        options: ["Juste discuter", "Info importante", "Problème urgent", "Autre"],
        required: false,
      },
    ],
  },

  study: {
    message: "Construisons ton plan de révision ensemble 📚",
    questions: [
      {
        id: "subject",
        type: "radio",
        label: "Matière ?",
        options: ["Maths", "Français", "Histoire-Géo", "Sciences", "Anglais", "Autre"],
        required: true,
      },
      {
        id: "type",
        type: "radio",
        label: "Type de révision ?",
        options: ["Flashcards / Mémorisation", "Exercices pratiques", "Relecture du cours", "Résumé / Fiches"],
        required: true,
      },
      {
        id: "duration",
        type: "radio",
        label: "Temps disponible ?",
        options: ["30 min", "1 heure", "2 heures", "Toute la session"],
        required: true,
      },
      {
        id: "difficulty",
        type: "radio",
        label: "Niveau de difficulté ?",
        options: ["Facile", "Moyen", "Difficile"],
        required: true,
      },
    ],
  },

  appointment: {
    message: "Organisons les notifications pour ton rendez-vous",
    questions: [
      {
        id: "notify",
        type: "checkbox",
        label: "Rappels souhaités ?",
        options: ["1 jour avant", "2 heures avant", "1 heure avant", "15 min avant"],
        required: true,
      },
      {
        id: "travel",
        type: "radio",
        label: "Temps de trajet ?",
        options: ["< 5 min à pied", "10–30 min en voiture", "30 min+", "Pas de déplacement"],
        required: false,
      },
    ],
  },

  medication: {
    message: "Configurons ton rappel de médicament",
    questions: [
      {
        id: "frequency",
        type: "radio",
        label: "Fréquence ?",
        options: ["1×/jour", "2×/jour", "3×/jour", "Autre"],
        required: true,
      },
      {
        id: "time_pref",
        type: "radio",
        label: "À quelle heure ?",
        options: ["Matin (8h)", "Midi (12h)", "Soir (20h)", "Personnalisé"],
        required: true,
      },
      {
        id: "with_meal",
        type: "radio",
        label: "Avec repas ?",
        options: ["Oui, obligatoire", "Recommandé", "Non"],
        required: false,
      },
    ],
  },
};

// Keywords that trigger each QCM — used for offline detection
const QCM_KEYWORDS = [
  {
    key: 'shopping_pet_food',
    food: ['croquette', 'pâtée', 'nourriture pour', 'alimentation pour'],
    pet: ['chien', 'chat', 'chiot', 'chaton', 'animal'],
    match: (lower) =>
      QCM_KEYWORDS[0].food.some((w) => lower.includes(w)) &&
      QCM_KEYWORDS[0].pet.some((w) => lower.includes(w)),
  },
];

export function detectQCMLocal(message, category, reminderType) {
  const lower = message.toLowerCase();

  // Pet food — keyword match, independent of AI
  if (
    ['croquette', 'pâtée', 'nourriture pour', 'alimentation pour'].some((w) => lower.includes(w)) &&
    ['chien', 'chat', 'chiot', 'chaton', 'animal'].some((w) => lower.includes(w))
  ) return 'shopping_pet_food';

  // Keyword fallbacks when AI is offline
  if (['acheter', 'courses', 'shopping', 'achète', 'achetez', 'commander'].some((w) => lower.includes(w)))
    return 'shopping_general';
  if (['appeler', 'appelle', 'téléphoner', 'appel ', 'call'].some((w) => lower.includes(w)))
    return 'call';
  if (['réviser', 'révision', 'étudier', 'étude', 'examen', 'bac', 'devoir'].some((w) => lower.includes(w)))
    return 'study';
  if (['rendez-vous', 'rdv', 'médecin', 'dentiste', 'réunion', 'meeting'].some((w) => lower.includes(w)))
    return 'appointment';
  if (['médicament', 'pilule', 'comprimé', 'traitement', 'médicaments'].some((w) => lower.includes(w)))
    return 'medication';

  // AI-provided type as fallback
  if (reminderType === 'shopping' || category === 'errand') return 'shopping_general';
  if (reminderType === 'call') return 'call';
  if (reminderType === 'study') return 'study';
  if (reminderType === 'appointment') return 'appointment';
  if (reminderType === 'medication') return 'medication';

  return null;
}

export default qcmTemplates;

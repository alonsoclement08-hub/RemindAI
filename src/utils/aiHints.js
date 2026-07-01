export function getAiHint(reminder) {
  const t = (reminder.title || '').toLowerCase();
  const cat = reminder.category || '';

  if (/méditer|meditation|mindful/i.test(t))
    return 'Commence par 5 min de respiration profonde. Essaie l\'appli Petit Bambou ou simplement ferme les yeux et compte tes respirations.';
  if (/courir|running|jogging/i.test(t))
    return 'Commence à allure légère les 5 premières minutes. Pense à t\'étirer après et bois au moins 500ml d\'eau.';
  if (/gym|muscu|salle de sport/i.test(t))
    return 'Fais 10 min d\'échauffement avant. Focus sur ta technique plutôt que le poids. Protéines après l\'effort.';
  if (/yoga/i.test(t))
    return 'Commence par la salutation au soleil pour réveiller le corps. Respire profondément à chaque posture.';
  if (/sport|exercice/i.test(t))
    return '30 min d\'activité modérée par jour réduisent le risque de maladies de 35%. Ton énergie sera boostée toute la journée.';
  if (/médicament|pilule|traitement/i.test(t))
    return 'Prends-le au même moment chaque jour pour ne jamais oublier. Si tu l\'oublies, ne double pas la dose.';
  if (/médecin|docteur|dermato|ophtalmo|dentiste/i.test(t))
    return 'Prépare tes questions à l\'avance pour ne rien oublier. Note aussi tes symptômes depuis combien de temps.';
  if (/dormir|réveil|lever/i.test(t))
    return 'Évite les écrans 30 min avant de dormir. 7 à 9h de sommeil améliorent la mémoire et la concentration.';
  if (/eau|hydrat/i.test(t))
    return 'Bois un grand verre dès le réveil avant tout. Objectif : 1,5 à 2 litres par jour. La déshydratation fatigue.';
  if (/manger|repas|déjeuner|dîner|petit-déj/i.test(t))
    return 'Prends le temps de mâcher lentement. Un repas sans écran aide à mieux ressentir la satiété.';
  if (/pain/i.test(t))
    return 'Prends une baguette tradition plutôt que normale, elle reste fraîche plus longtemps. Évite le pain de mie industriel.';
  if (/lait/i.test(t))
    return 'Le lait demi-écrémé est le meilleur compromis. Pense à vérifier la DLC. Une brique longue conservation dure 3 mois.';
  if (/légume|fruits|salade/i.test(t))
    return 'Privilégie les légumes de saison, moins chers et plus nutritifs. Évite ceux qui paraissent abîmés ou trop mûrs.';
  if (/viande|poulet|boeuf|porc/i.test(t))
    return 'Vérifie toujours la DLC et la couleur. Le poulet Label Rouge est bien meilleur. Conserve au frigo max 2j.';
  if (/poisson/i.test(t))
    return 'Le poisson frais a les yeux brillants et ne sent pas fort. Le cabillaud et le lieu noir sont les moins chers et très nutritifs.';
  if (/courses|supermarché|carrefour|leclerc|intermarché/i.test(t))
    return 'Fais ta liste avant d\'y aller pour éviter les achats impulsifs. Privilégie les marques distributeur, souvent identiques aux grandes marques.';
  if (/acheter|commander/i.test(t))
    return 'Compare les prix sur Google Shopping avant d\'acheter. Les soldes se passent en janvier et juillet en France.';
  if (/pharmacie/i.test(t))
    return 'Les médicaments génériques sont identiques aux originaux et jusqu\'à 3x moins chers. Pense à ta carte vitale.';
  if (/réunion|meeting/i.test(t))
    return 'Prépare 3 points clés à l\'avance. Arrive 5 min avant pour être prêt. Note les décisions importantes pendant la réunion.';
  if (/mail|email|message|envoyer/i.test(t))
    return 'Un bon email : objet clair, message court, une seule demande. Relis avant d\'envoyer pour éviter les fautes.';
  if (/projet|rapport|présentation/i.test(t))
    return 'Commence par l\'introduction en dernier. Travaille par blocs de 25 min (technique Pomodoro) pour rester concentré.';
  if (/appeler|appel|téléphoner/i.test(t))
    return 'Note 2-3 points à aborder avant d\'appeler pour ne rien oublier. Les appels le matin ont plus de chances d\'aboutir.';
  if (/lire|lecture|livre/i.test(t))
    return '20 pages par jour = 12 livres par an. Lis le matin ou avant de dormir, loin des notifications.';
  if (/famille|maman|papa|enfant/i.test(t))
    return 'Un message ou un appel de 5 minutes renforce vraiment les liens. Ne reporte pas à demain ce qui compte aujourd\'hui.';

  if (cat === 'health') return 'Ta santé est ta priorité numéro 1. Hydrate-toi, bouge un peu et dors suffisamment chaque jour.';
  if (cat === 'habit') return 'La constance sur 21 jours crée une habitude. Chaque fois que tu le fais, tu renforces ton cerveau.';
  if (cat === 'errand') return 'Fais ta liste avant de partir. Vérifie les DLC et compare les prix entre les marques.';
  if (cat === 'work') return 'Focus sur une seule tâche à la fois. Coupe les notifications pendant 25 min pour être plus efficace.';
  return 'Chaque petit pas que tu fais aujourd\'hui construit ton avenir. Tu peux le faire !';
}

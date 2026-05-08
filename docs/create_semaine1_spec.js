const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel, PageBreak } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: { 
      document: { 
        run: { font: "Arial", size: 22 } 
      } 
    },
    paragraphStyles: [
      { 
        id: "Heading1", 
        name: "Heading 1", 
        basedOn: "Normal", 
        next: "Normal", 
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F4E78" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      { 
        id: "Heading2", 
        name: "Heading 2", 
        basedOn: "Normal", 
        next: "Normal", 
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 }
      },
      { 
        id: "Heading3", 
        name: "Heading 3", 
        basedOn: "Normal", 
        next: "Normal", 
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 150, after: 80 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      { 
        reference: "bullets",
        levels: [
          { 
            level: 0, 
            format: "bullet", 
            text: "•", 
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // TITLE
      new Paragraph({
        spacing: { before: 200, after: 50 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "SEMAINE 1 — SPEC PRODUIT COMPLÈTE", bold: true, size: 40, color: "1F4E78" })]
      }),
      new Paragraph({
        spacing: { after: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "RemindAI • App Rappels IA Proactive", size: 24, color: "2E75B6" })]
      }),

      // VISION
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("VISION & POSITIONING")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun({text: "Le problème:", bold: true})]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Les gens oublient des choses importantes. Todoist, Things, et Reminders natif te font créer et gérer manuellement les rappels — c'est du travail. RemindAI te décharge complètement: l'app détecte ce que tu dois rappeler, te l'interdit au bon moment et au bon endroit, et t'offre des suggestions intelligentes.")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun({text: "Notre positionnement:", bold: true})]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun("RemindAI = \"l'IA qui pense à ta place\". Pas un task manager — un assistant proactif qui apprend tes habitudes et te suggère ce que tu devrais faire, avant même que tu n'y penses.")]
      }),

      // PERSONAS
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("USER PERSONAS")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Persona 1: Thomas — Le Freelancer (MVP Priority)")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "Profil:", bold: true})]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Âge: 35 ans")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Métier: Freelancer (consultant, développeur, designer)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Revenu: 3-5k€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Problème clé: Gère 5-10 clients, perd des follow-ups, laisse des emails sans réponse 1-2 semaines")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tech-savvy: Oui (utilise Slack, Notion, Gmail)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Comportement: Matin: check emails rapidement | Midi: réunions/calls | Soir: peu actif")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Pain points: Manque de système; perd argent quand oublie de follow-up client")]
      }),
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({text: "Cas d'usage clé:", bold: true})]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("\"Je reçois un email de client le lundi 10h. Je réponds pas de suite. Mercredi, RemindAI me dit 'Email de Jean sans réponse depuis 48h — appelle-le maintenant'. Je vois le rappel, me dis ouais faut que j'appelle, et bam — deal sauvé, client heureux.\"")]
      }),
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({text: "Willingness to pay:", bold: true})]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun("Pro 4,99€/mois = easy pour lui (économise 100€+ en clients perdus). Business = pas applicable (solo)")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Persona 2: Julie — La Mère Professionnelle")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "Profil:", bold: true})]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Âge: 40 ans")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Métier: Manager en startup (Product Manager, Ops Lead)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Revenu: 50-70k€/year")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Problème clé: Jongle work + 2 enfants + perso. Oublie les rdv (médecin), les courses, les devoirs des kids")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tech-savvy: Modéré (Outlook, Teams, Google Calendar)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Comportement: Matin fou (enfants) | Midi réunions | Soir surcharge mentale")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Pain points: Stress constant; oublie des choses importantes; se sent débordée")]
      }),
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({text: "Cas d'usage clé:", bold: true})]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("\"Vendredi 17h, RemindAI me dit 'Ton retour passe au Carrefour Voltaire jusqu'à 21h — tu dois passer prendre le colis avant 18h. Tu seras à côté à 17h45.' Boom — j'oublie plus de colis, plus de stress. C'est comme une secrétaire perso.\"")]
      }),
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({text: "Willingness to pay:", bold: true})]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun("Pro 4,99€/mois = justifiable si ça décharge vraiment. Business = possible si team adopte.")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("STRATÉGIE FREEMIUM")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Gratuit (Free tier)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Jusqu'à 20 rappels actifs (simultanément)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Création manuelle illimitée")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Notifications basiques")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Résumé IA quotidien")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("3 commandes vocales/jour")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("PAS de détection proactive")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("PAS de géo-rappels")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("PAS d'intégrations")]
      }),
      new Paragraph({
        spacing: { before: 150, after: 150 },
        children: [new TextRun({text: "Pourquoi 20 rappels?", bold: true})]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Thomas: gère 5-10 clients = 5-10 rappels = franchit limit rapidement → converts | Julie: ~15 rappels (rdv, courses, devoirs, habits) = presque au limit → converts")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Pro (4,99€/mois)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Rappels illimités")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Voix illimitée (multi-langues)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Géo-rappels ultra-précis (lieu exact + temps de trajet)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Détection proactive (Gmail, Outlook, Slack)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Suggestions IA 24/7")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Intégrations (Notion, Calendar, Slack)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mode focus + statistiques")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Priorité support")]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("SPEC PRODUIT MVP")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Goals (Mois 1-7)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Lancer une app iOS/Android + web")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Acquérir 1000+ utilisateurs free et 50+ Pro en Month 7")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Prouver que la détection proactive fonctionne et plaît")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Avoir une NPS > 50 et retention > 40% au jour 30")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Non-Goals")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Team management (B2B) — v1.1 seulement")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Analytics avancées — basic seulement en Pro")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Custom automations — v1.1")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Core Features — MVP")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("1. Création de rappel (Natural Language)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Input: Texte ou voix (\"Rappelle-moi d'appeler maman demain à 18h\")")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("IA parse en temps réel: tâche, quand, où, avec qui")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("User peut éditer chaque champ")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Catégories auto-détectées (work, personal, health, errand, habit)")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("2. Home Screen avec Contexte IA")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Hero card: \"Tu as 3 choses urgentes. Le board à 9h30 est priorité.\"")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Reminder cards avec contexte intelligent (\"J'ai trouvé un brouillon Notion updaté...\")")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Swipe: left = snooze, right = complete")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Progress ring FAB")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Sections: Aujourd'hui | Terminé | Demain")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("3. Suggestions IA Inline")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("\"Tu pourrais ajouter: appeler Léa pour le brief produit\"")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Basé sur: agenda, messages non-lus, patterns")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("User peut add/dismiss")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("4. Notifications Intelligentes")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Push au moment idéal (pas trop tôt, pas trop tard)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Priorité urgence (rouge=urgent, orange=normal)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Groupage smart (pas 5 notifs d'affilée)")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("5. Auth & Sync")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Login: Email + password (v1) ou SSO (v1.1)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Stockage local SQLite")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Sync offline-first (user continued en airplane mode)")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Features Future (Post-Launch)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Détection proactive (email unanswered, Slack) — v1.1")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Géo-rappels avec lieu exact — v1.1")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Intégrations (Notion, Calendar, Slack) — v1.2")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Team management & Business plan — v1.3")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Voice reminders (lire le rappel) — v1.2")]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("SUCCESS METRICS")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Retention")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Day 1 retention: > 60% (c-à-d 60% reviennent après 24h)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Day 7 retention: > 35%")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Day 30 retention: > 15%")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Conversion")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Free → Pro: > 5% (goal 7%)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Trigger: Utilisateur atteint limit de 20 rappels")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Engagement")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Rappels créés / utilisateur / jour: > 1")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Rappels complétés: > 70% (non snoozés)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Suggestions acceptées: > 30%")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("NPS")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Target: > 50 (excellent pour une app de productivité)")]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("USER FLOWS")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Flow 1: Thomas crée un rappel pour follow-up client")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("1. Thomas reçoit email du client Jean lundi 10h")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("2. Mardi 14h, RemindAI sug. \"Tu n'as pas répondu à Jean depuis 28h. Appelle-le?\". Il dit oui.")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("3. Mercredi 10h (heure de la standup), RemindAI notif: \"Appeler Jean — tu disais mercredi. C'est maintenant.\" Swipe right → DONE.")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("4. Thomas voit \"Appeler Jean\" dans Terminé. Le rappel montre sa history (\"Suggéré mardi par IA\").")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Flow 2: Julie utilise un géo-rappel (future)")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("1. Lundi, Julie reçoit SMS: \"Colis en attente au Point Relais Voltaire jusqu'à vendredi 18h\". Elle dits-le à RemindAI.")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("2. Jeudi 17h45, RemindAI voit: \"T'approches du Point Relais (tu seras là dans 5 min). Tu dois chercher le colis!\". Notif push.")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("3. Julie voit la notif, pense \"oh c'est bon, merci IA\", passe au Point Relais en rentrant, cherche le colis, colis = safe. Julie: \"C'est dingue, j'oublie jamais. Combien ça coûte Pro? 5€? Done.\"")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("LIVRABLES SEMAINE 1")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("✅ Ce document (spec_produit_complet.docx)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("✅ user_flows.md (diagrammes ASCII si besoin)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("✅ feature_checklist.csv (MVP vs Future)")]
      }),

      new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({text: "FIN SEMAINE 1 ✅", bold: true, size: 28, color: "1D9E75"})]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("SEMAINE_1_Spec_Produit_Complet.docx", buffer);
  console.log("✅ Semaine 1 créée: SEMAINE_1_Spec_Produit_Complet.docx");
});

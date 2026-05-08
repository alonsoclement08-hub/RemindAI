const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel, PageBreak } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const createWeekSection = (week, month, tasks, deliverables, tools) => {
  const children = [];
  
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun(`Semaine ${week} (Mois ${month})`)]
  }));
  
  children.push(new Paragraph({
    spacing: { before: 100, after: 100 },
    children: [new TextRun({text: "Tâches:", bold: true})]
  }));
  
  tasks.forEach(task => {
    children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun(task)]
    }));
  });
  
  children.push(new Paragraph({
    spacing: { before: 120, after: 100 },
    children: [new TextRun({text: "Livrables:", bold: true})]
  }));
  
  deliverables.forEach(deliv => {
    children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun(deliv)]
    }));
  });
  
  children.push(new Paragraph({
    spacing: { before: 120, after: 100 },
    children: [new TextRun({text: "Outil Claude:", bold: true, color: "2E75B6"})]
  }));
  
  tools.forEach(tool => {
    children.push(new Paragraph({
      children: [new TextRun({text: "→ " + tool, color: "2E75B6"})]
    }));
  });
  
  children.push(new Paragraph({
    spacing: { before: 200, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } },
    children: [new TextRun("")]
  }));
  
  return children;
};

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
        run: { size: 28, bold: true, font: "Arial", color: "C00000" },
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
        children: [new TextRun({ text: "ROADMAP HEBDOMADAIRE DÉTAILLÉE", bold: true, size: 40, color: "1F4E78" })]
      }),
      new Paragraph({
        spacing: { after: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "App Rappels IA — 7+ mois | Semaine par semaine", size: 24, color: "2E75B6" })]
      }),
      
      // MOIS 1
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 1: DISCOVERY & DESIGN")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Focus: Définir le produit, l'architecture, et les écrans. Aucun code à ce stade.")]
      }),
      
      ...createWeekSection(1, 1,
        [
          "Brainstormer le concept final et les features clés",
          "Définir les user personas (power users vs casual users)",
          "Créer la spec produit (goals, non-goals, features MVP)"
        ],
        [
          "spec_produit.md (2000+ mots)",
          "user_flows.md",
          "feature_list.csv"
        ],
        [
          "Claude Pro: brainstorm + write-spec skill",
          "Cowork: tracker tâches"
        ]
      ),
      
      ...createWeekSection(2, 1,
        [
          "Valider la spec avec cas d'usage réels",
          "Définir les 3 plans de pricing (Free, Pro, Business)",
          "Étudier la concurrence (Todoist, Things, Reminders)"
        ],
        [
          "pricing_strategy.md",
          "competitive_analysis.md",
          "user_stories.txt"
        ],
        [
          "Claude Pro: competitive-brief skill",
          "Recherche manuelle (App Store, Product Hunt)"
        ]
      ),
      
      ...createWeekSection(3, 1,
        [
          "Concevoir l'architecture technique globale",
          "Décider: React Native vs Swift | Node vs Python",
          "Schématiser la flow: User → API → Ollama → DB"
        ],
        [
          "architecture.md (diagrammes ASCII)",
          "tech_stack.md",
          "api_endpoints.json"
        ],
        [
          "Claude Pro: valider l'architecture (appel expert)",
          "Claude Code: générer le diagramme ASCII"
        ]
      ),
      
      ...createWeekSection(4, 1,
        [
          "Créer les wireframes mobiles (10-15 écrans clés)",
          "Définir le design system (couleurs, typos, spacing)",
          "Valider l'UX avec user testing (amis/collègues)"
        ],
        [
          "wireframes.fig (Figma)",
          "design_system.md",
          "ux_feedback.txt"
        ],
        [
          "Figma (pas Claude pour ça)",
          "Claude Pro: review UX et proposer améliorations"
        ]
      ),
      
      // MOIS 2
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 2: BACKEND DESIGN & SETUP")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Focus: Architecture backend, DB schema, intégration Ollama. Commencer le setup initial.")]
      }),
      
      ...createWeekSection(5, 2,
        [
          "Concevoir la DB schema (users, reminders, sync_logs)",
          "Défir les endpoints API (GET/POST/PUT/DELETE)",
          "Documenter le flow d'auth (JWT tokens)"
        ],
        [
          "db_schema.sql",
          "api_spec.openapi.yaml",
          "auth_flow.md"
        ],
        [
          "Claude Pro: valider le schema (security review)",
          "Claude Code: générer le SQL initial"
        ]
      ),
      
      ...createWeekSection(6, 2,
        [
          "Setup repo Git (GitHub/GitLab)",
          "Setup Node.js + Express (ou FastAPI)",
          "Configurer PostgreSQL local et Docker"
        ],
        [
          "backend/.gitignore",
          "backend/package.json",
          "docker-compose.yml"
        ],
        [
          "Claude Code: générer boilerplate Express",
          "Manuel: CLI git, Docker setup"
        ]
      ),
      
      ...createWeekSection(7, 2,
        [
          "Intégrer Ollama au backend",
          "Installer Mistral 7B / Llama 2",
          "Créer des test endpoints (test inference)"
        ],
        [
          "backend/services/ollama_client.js",
          "backend/routes/test.js",
          "ollama_setup_guide.md"
        ],
        [
          "Claude Code: Ollama client code",
          "Manuel: installer modèles (scripts)"
        ]
      ),
      
      ...createWeekSection(8, 2,
        [
          "Implémenter les endpoints core (CRUD reminders)",
          "Ajouter l'authentification (JWT)",
          "Écrire les tests unitaires (jest)"
        ],
        [
          "backend/routes/reminders.js",
          "backend/middleware/auth.js",
          "backend/__tests__/reminders.test.js"
        ],
        [
          "Claude Code: générer endpoints + tests",
          "Claude Pro: code review"
        ]
      ),
      
      // MOIS 3
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 3: MVP FRONTEND")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Focus: App mobile de base. Écrans, navigation, appels API au backend.")]
      }),
      
      ...createWeekSection(9, 3,
        [
          "Setup React Native / Swift project",
          "Configurer navigation (React Navigation / UINavigationController)",
          "Ajouter dépendances (API client, storage, etc.)"
        ],
        [
          "mobile/package.json ou Podfile",
          "mobile/src/navigation/AppNavigator.js",
          "mobile/.env.example"
        ],
        [
          "Claude Code: générer project scaffold",
          "Manuel: Xcode/Android Studio setup"
        ]
      ),
      
      ...createWeekSection(10, 3,
        [
          "Créer les écrans principaux (Home, CreateReminder, Settings)",
          "Implémenter la navigation entre écrans",
          "Ajouter les icones et assets"
        ],
        [
          "mobile/src/screens/HomeScreen.js",
          "mobile/src/screens/CreateReminderScreen.js",
          "mobile/src/components/ReminderCard.js"
        ],
        [
          "Claude Code: générer les composants",
          "Figma: assets (icones, images)"
        ]
      ),
      
      ...createWeekSection(11, 3,
        [
          "Intégrer API client (appels au backend)",
          "Configurer SQLite local (stockage offline)",
          "Implémenter la sync basique (pull/push)"
        ],
        [
          "mobile/src/api/client.js",
          "mobile/src/db/sqlite.js",
          "mobile/src/services/syncService.js"
        ],
        [
          "Claude Code: API client + SQLite integration",
          "Claude Pro: valider la sync logic"
        ]
      ),
      
      ...createWeekSection(12, 3,
        [
          "Implémenter la création de rappels (form + validation)",
          "Ajouter la liste des rappels avec pull-to-refresh",
          "Tester les appels API end-to-end"
        ],
        [
          "mobile/src/screens/CreateReminderScreen.js (complete)",
          "mobile/src/screens/RemindersListScreen.js",
          "test_api_calls.md"
        ],
        [
          "Claude Code: completion du code",
          "Manual: testing sur simulateur"
        ]
      ),
      
      // MOIS 4
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 4: POLISH & OPTIMISATION")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Focus: UI/UX polishing, performance, notifications push.")]
      }),
      
      ...createWeekSection(13, 4,
        [
          "Améliorer le design (appliquer design system)",
          "Ajouter animations (transitions, loading states)",
          "Optimiser les performances (rendering, bundle size)"
        ],
        [
          "mobile/src/styles/theme.js (updated)",
          "mobile/src/components/LoadingSpinner.js",
          "performance_report.md"
        ],
        [
          "Manuel: optimisations React Native",
          "Claude Pro: performance review"
        ]
      ),
      
      ...createWeekSection(14, 4,
        [
          "Ajouter Firebase Cloud Messaging (notifications)",
          "Configurer le serveur pour envoyer les notifications",
          "Tester les notifications sur device"
        ],
        [
          "mobile/src/services/pushNotifications.js",
          "backend/services/notificationService.js",
          "FCM_setup.md"
        ],
        [
          "Claude Code: FCM intégration",
          "Manuel: Firebase console setup"
        ]
      ),
      
      ...createWeekSection(15, 4,
        [
          "Implémenter l'onboarding (welcome screens)",
          "Ajouter les settings (timezone, notification preferences)",
          "Écrire la documentation utilisateur"
        ],
        [
          "mobile/src/screens/OnboardingScreen.js",
          "mobile/src/screens/SettingsScreen.js",
          "USER_GUIDE.md"
        ],
        [
          "Claude Code: onboarding flow",
          "Claude Pro: user guide writing"
        ]
      ),
      
      ...createWeekSection(16, 4,
        [
          "Sécurité: ajouter le chiffrement (données sensibles)",
          "Tester la sécurité (injection, auth bypass)",
          "Corriger les bugs trouvés"
        ],
        [
          "backend/utils/encryption.js",
          "mobile/src/utils/secureStorage.js",
          "SECURITY_AUDIT.md"
        ],
        [
          "Claude Pro: security audit",
          "Claude Code: fix vulnerabilities"
        ]
      ),
      
      // MOIS 5
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 5: IA INTEGRATION")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Focus: Prompts optimisés, fine-tuning, détection proactive.")]
      }),
      
      ...createWeekSection(17, 5,
        [
          "Générer 2000+ exemples d'entraînement avec Claude",
          "Créer le dataset au format JSONL",
          "Documenter les cas d'usage pour chaque type de rappel"
        ],
        [
          "ai/training_data.jsonl",
          "ai/training_guidelines.md",
          "ai/examples_categorized.csv"
        ],
        [
          "Claude Pro: générer les exemples (massive output)",
          "Claude Code: structurer les données"
        ]
      ),
      
      ...createWeekSection(18, 5,
        [
          "Fine-tune Mistral/Llama avec les données",
          "Évaluer la qualité du modèle (accuracy, precision)",
          "Itérer sur les prompts si nécessaire"
        ],
        [
          "ai/models/custom_model.gguf",
          "ai/evaluation_results.txt",
          "ai/prompts_v2.md"
        ],
        [
          "Manual: fine-tuning process (Ollama)",
          "Claude Pro: evaluate results"
        ]
      ),
      
      ...createWeekSection(19, 5,
        [
          "Implémenter la détection proactive (analyser emails/messages)",
          "Créer les triggers automatiques (\"email sans réponse > 10j\")",
          "Ajouter les règles de business logic"
        ],
        [
          "backend/services/proactiveDetection.js",
          "backend/jobs/analysisJob.js",
          "detection_rules.json"
        ],
        [
          "Claude Code: detection engine",
          "Claude Pro: valider la logique"
        ]
      ),
      
      ...createWeekSection(20, 5,
        [
          "Intégrer la détection au frontend",
          "Afficher les rappels auto-détectés dans l'app",
          "Laisser l'utilisateur confirmer/rejeter"
        ],
        [
          "mobile/src/screens/DetectedRemindersScreen.js",
          "mobile/src/components/SuggestedReminderCard.js",
          "integration_test.md"
        ],
        [
          "Claude Code: UI pour les rappels suggérés",
          "Manual: end-to-end testing"
        ]
      ),
      
      // MOIS 6
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 6: EMAIL & ADVANCED FEATURES")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Focus: Intégration Gmail/Outlook, caching, optimisations critiques.")]
      }),
      
      ...createWeekSection(21, 6,
        [
          "Implémenter OAuth2 flow (Gmail + Outlook)",
          "Ajouter les scopes nécessaires (read:emails, etc.)",
          "Tester le flow sur device réel"
        ],
        [
          "backend/services/gmailOAuth.js",
          "backend/services/outlookOAuth.js",
          "oauth_flow_diagram.md"
        ],
        [
          "Claude Code: OAuth implementation",
          "Manual: OAuth testing"
        ]
      ),
      
      ...createWeekSection(22, 6,
        [
          "Synchroniser les emails (pull depuis Gmail/Outlook)",
          "Analyser les emails pour détecter les manques de réponse",
          "Créer les rappels auto-générés"
        ],
        [
          "backend/services/emailSync.js",
          "backend/services/emailAnalyzer.js",
          "email_schema.sql"
        ],
        [
          "Claude Code: email sync engine",
          "Claude Pro: architecture review"
        ]
      ),
      
      ...createWeekSection(23, 6,
        [
          "Ajouter le caching agressif (Redis)",
          "Optimiser les requêtes Ollama (batch processing)",
          "Implémenter rate limiting pour les appels LLM"
        ],
        [
          "backend/services/cacheService.js",
          "backend/utils/rateLimiter.js",
          "performance_metrics.txt"
        ],
        [
          "Claude Code: caching logic",
          "Claude Pro: optimization strategies"
        ]
      ),
      
      ...createWeekSection(24, 6,
        [
          "Features bonus (si timeline permet): voice reminders, recurring rules",
          "Tester tout le système sous charge (50+ utilisateurs)",
          "Préparer la beta release (liste de testeurs)"
        ],
        [
          "mobile/src/services/voiceService.js (optional)",
          "backend/tests/load_test.js",
          "BETA_TESTER_LIST.txt"
        ],
        [
          "Claude Code: bonus features",
          "Manual: load testing"
        ]
      ),
      
      // MOIS 7
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 7: BETA & LAUNCH PREP")]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Focus: Déploiement, bug fixes, acquisition premiers utilisateurs.")]
      }),
      
      ...createWeekSection(25, 7,
        [
          "Déployer le backend en production (DigitalOcean/Hetzner)",
          "Configurer CI/CD (GitHub Actions ou similar)",
          "Ajouter monitoring et logging (Sentry, DataDog)"
        ],
        [
          "backend/Dockerfile",
          "backend/.github/workflows/deploy.yml",
          "monitoring_setup.md"
        ],
        [
          "Manual: deployment process",
          "Claude Code: CI/CD setup"
        ]
      ),
      
      ...createWeekSection(26, 7,
        [
          "Soumettre l'app à TestFlight (iOS)",
          "Recruter 50+ beta testers (ProductHunt, Twitter, Slack communities)",
          "Recueillir le feedback initial"
        ],
        [
          "TestFlight_submission.txt",
          "BETA_TESTER_RECRUITMENT.md",
          "feedback_form.md"
        ],
        [
          "Manual: App Store submission",
          "Claude Pro: recruitment messaging"
        ]
      ),
      
      ...createWeekSection(27, 7,
        [
          "Itérer sur le feedback des beta testers",
          "Corriger les bugs critiques",
          "Améliorer l'onboarding basé sur les frustrations"
        ],
        [
          "bug_fixes_log.md",
          "updated_USER_GUIDE.md",
          "feedback_summary.txt"
        ],
        [
          "Manual: iterative fixes",
          "Claude Pro: product recommendations"
        ]
      ),
      
      ...createWeekSection(28, 7,
        [
          "Finaliser la landing page et le marketing",
          "Préparer le Product Hunt launch",
          "Mettre en place le customer support"
        ],
        [
          "landing_page/index.html",
          "Product Hunt submission",
          "support_system_setup.md"
        ],
        [
          "Manual: landing page + marketing copy",
          "Claude Pro: marketing messages"
        ]
      ),
      
      // MOIS 8+
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("📅 MOIS 8+: PUBLIC LAUNCH & B2B")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Focus: Acquisition utilisateurs Pro, acquisition B2B (PME).")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Semaines 29-32 (Mois 8)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Launch public sur App Store / Play Store")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("ProductHunt launch (premier jour critique)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outreach B2B (envoyer des emails aux PMEs cibles)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tracker les KPIs: téléchargements, conversions Pro, retention")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Semaines 33+ (Mois 9+)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Feature: Admin dashboard pour les plans Business")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Feature: Team management (inviter collègues)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Feature: Usage analytics (pour PMEs)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Scaling infrastructure si besoin (GPU server)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Objectif: 10+ clients B2B = 2400€/mois récurrents")]
      }),
      
      new Paragraph({ spacing: { before: 400 }, children: [new TextRun("")] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        border: { top: { style: BorderStyle.DOUBLE, size: 6, color: "1F4E78", space: 1 } },
        children: [new TextRun("")]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
        children: [new TextRun({text: "📊 RÉSUMÉ", bold: true, size: 28})]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun("28 semaines (7 mois) | 8 tâches/semaine | Zéro frais d'API | ROI break-even Mois 8-9")]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Roadmap_Hebdomadaire_Detaillee.docx", buffer);
  console.log("✅ Document créé: Roadmap_Hebdomadaire_Detaillee.docx");
});

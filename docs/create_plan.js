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
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
      },
      { 
        id: "Heading3", 
        name: "Heading 3", 
        basedOn: "Normal", 
        next: "Normal", 
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 }
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
      // TITLE PAGE
      new Paragraph({
        spacing: { before: 400, after: 100 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "APP RAPPELS IA PROACTIVE", bold: true, size: 40, color: "1F4E78" })]
      }),
      new Paragraph({
        spacing: { after: 600 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Plan d'Action Complet | Zéro Coûts API", size: 24, color: "2E75B6" })]
      }),
      new Paragraph({
        spacing: { after: 40 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Architecture: Serveur Centralisé + Modèles Ollama", size: 20, italic: true })]
      }),
      new Paragraph({
        spacing: { after: 600 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Roadmap 7+ mois | Flux Cowork → Claude Code", size: 20, italic: true })]
      }),
      new Paragraph({
        spacing: { before: 400, after: 20 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Créé avec: Claude Pro + Claude Code", size: 18, color: "666666" })]
      }),
      new Paragraph({
        spacing: { after: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Mai 2026", size: 18, color: "666666" })]
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // EXECUTIVE SUMMARY
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("1. EXECUTIVE SUMMARY")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Votre app de rappels change la donne en détectant automatiquement ce qui doit être rappelé, au lieu de faire mémoriser à l'utilisateur. Cela signifie:")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("USP: Détection proactive (email sans réponse depuis 10 jours → rappel auto-créé)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Modèle: Freemium (5 rappels gratuits) → Pro 4,99€ → B2B 12€/siège")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tech: Serveur centralisé (Ollama) + App mobile (stockage local)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Coûts: Zéro API payantes — tout en open-source")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Timeline: 7 mois MVP → Launch public | Mois 7+: B2B")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("ROI: À 100 utilisateurs Pro (5€ moy) = 500€/mois | 10 PME B2B = 2400€/mois")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      // ARCHITECTURE
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("2. ARCHITECTURE TECHNIQUE")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Vue d'ensemble")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Votre infrastructure fonctionne comme ceci:")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "┌─ VOTRE SERVEUR CENTRALISÉ ─┐", font: "Courier New", size: 18})]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "│ • Ollama (modèles LLM)    │", font: "Courier New", size: 18})]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "│ • Backend (Node/Python)    │", font: "Courier New", size: 18})]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "│ • Auth + Gestion users     │", font: "Courier New", size: 18})]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "└────────────────────────────┘", font: "Courier New", size: 18})]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({text: "         ↓ API sécurisée", font: "Courier New", size: 18})]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({text: "┌ APP MOBILE (Chaque user) ┐\n│ • Rappels stockés locale  │\n│ • Sync bidirectionnelle   │\n│ • Offline-first           │\n└──────────────────────────┘", font: "Courier New", size: 18})]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Stack Recommandé")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Backend")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Node.js + Express (ou Python + FastAPI)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("PostgreSQL (données partagées: users, configs)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Ollama (déploiement local des modèles LLM)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Docker Compose (pour simplifier deploy)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Redis (caching, rate limiting)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Frontend Mobile")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("React Native (iOS + Android) OU Swift (iOS native)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("SQLite (stockage local des rappels)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Realm (sync offline-first)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Firebase (notifications push — gratuit tier)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Intégration Ollama")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Ollama permet de faire tourner des modèles LLM localement sans API payante. Voici ce que vous allez faire:")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Installer Ollama sur votre serveur")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Télécharger Mistral 7B ou Llama 2 13B")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Backend appelle Ollama via API locale (zéro coût)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Fine-tune le modèle avec des données générées par Claude Pro")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      // ROADMAP
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("3. ROADMAP DÉTAILLÉE (7+ MOIS)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("PHASE 1: Design & Architecture (Mois 1-2)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 1-2: Spec produit & Architecture")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Rédiger la spec produit détaillée (goals, features, MVP vs future)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outil Claude: Claude Pro pour générer la spec (ou utiliser skill product-management:write-spec)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Livrables: spec.md, architecture.md, user flows")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 3-4: Design & Validation")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Créer les maquettes des écrans principaux (mobile)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outil: Figma (ou Sketch)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Livrables: Wireframes + High-fi mockups")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 5-8: Backend Design")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Concevoir l'API backend (endpoints pour rappels, sync, auth)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Architecture Ollama (quels modèles, caching, rate limiting)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Plan de sécurité (encryptage, auth tokens, data isolation)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outil Claude: Claude Pro pour valider l'architecture (appeler comme expert)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Livrables: API spec, DB schema, security doc")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("PHASE 2: MVP Development (Mois 3-4)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 9-12: Backend Core")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Auth (JWT), user management, basic API endpoints")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Database setup (PostgreSQL + migrations)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Ollama integration (test local inference)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outil Claude: Claude Code pour accélérer le dev (générer boilerplate)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 13-16: Frontend Mobile")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Project setup (React Native ou Swift)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Core screens (home, create reminder, settings)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Local storage (SQLite setup + sync logic skeleton)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: API client (communicate avec backend)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outil Claude: Claude Code pour générer les composants")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("PHASE 3: IA Integration & Optimization (Mois 5-6)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 17-20: Prompts & Fine-tuning")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Générer dataset d'entraînement avec Claude Pro")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Fine-tune Mistral/Llama pour détection de rappels")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Tâche: Tester la qualité des rappels détectés")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outil Claude: Claude Pro pour générer 1000+ exemples d'entraînement")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 21-24: Email Integration & Features")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: OAuth Gmail/Outlook (accès sécurisé aux emails)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Sync offline-first (SQLite + resolver de conflicts)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Push notifications (Firebase)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Dev: Performance optimizations (caching, indexing)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Outil Claude: Claude Code pour implémenter OAuth flow")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("PHASE 4: Beta & Launch (Mois 6-7)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 25-26: Testing & QA")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Test: Full end-to-end flow (créer compte → créer rappel → recevoir notification)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Test: Performance sous charge (100 utilisateurs simultanés)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Test: Sécurité (auth tokens, data isolation)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Test: Détection de rappels (validité du modèle IA)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 27-28: Beta Release")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Deploy: Serveur en production (DigitalOcean, Hetzner, ou on-premise)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Deploy: App sur TestFlight (iOS) / Play Store internal testing")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Recruit: 50-100 beta testers (amis, communautés)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Collect: Feedback et bug reports")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("PHASE 5: Public Launch & Growth (Mois 7+)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 29-30: App Store Launch")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Soumission: App Store et Play Store")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Marketing: Landing page, Product Hunt, Twitter")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Support: Mettre en place support utilisateurs")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Semaine 31+: B2B & Scaling")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Focus: Acquisition B2B (PME de 5-50 personnes)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Feature: Admin dashboard (gestion d'équipe, usage analytics)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Scaling: Infrastructure (auto-scaling, CDN)")]
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // COMMENT UTILISER CLAUDE
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("4. COMMENT UTILISER CLAUDE À CHAQUE ÉTAPE")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Claude Pro (Version payante)")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Utilisez votre Claude Pro pour:")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Brainstorming stratégique (product positioning, features)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Générer des datasets d'entraînement (1000+ exemples de rappels)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Fine-tune prompts pour Ollama (adapter le modèle à votre cas d'usage)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Code review (vérifier la sécurité, l'architecture)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Optimisation performance (analyser bottlenecks)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Claude Code (CLI pour dev)")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Utilisez Claude Code pour:")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Générer le boilerplate (Express backend, React Native screens)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Implémenter features complexes (OAuth flow, sync engine)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Debugger les bugs (analyser stacktraces, proposer fixes)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Écrire tests (unit tests, integration tests)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Refactoring (améliorer la qualité du code)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Cowork (Gestion de projet)")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Utilisez Cowork pour:")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Créer et tracker le plan d'action (cet document)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Lister les tâches par semaine")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Collaborer avec votre équipe (si vous en avez une)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Générer des rapports de progrès")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Créer des artifacts (spec, architecture diagrams)")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      // RISQUES & MITIGATION
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("5. RISQUES CRITIQUES & MITIGATION")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Risque 1: Scalabilité du serveur")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Problème: Ollama peut servir ~10-20 utilisateurs simultanés sur un serveur 4GB")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Impact: À 1000 utilisateurs, votre serveur crash")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mitigation: Passer à GPU server (RTX 4090) = 100+ utilisateurs simultanés")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Coût: 500-1000€/mois pour un bon GPU server")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Risque 2: Qualité de détection IA")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Problème: Llama 7B ne détecte pas tous les rappels manqués")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Impact: False positives = utilisateurs frustrated")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mitigation: Fine-tune agressif avec Claude Pro — générer 5000+ exemples")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Fallback: Offrir paramètres de sensibilité (l'utilisateur choisit le seuil)")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Risque 3: Intégration email complexe")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Problème: OAuth Gmail/Outlook = code complexe, maintenance")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Impact: Vous êtes bloqué ~2 semaines en Phase 3")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mitigation: Commencer MVP SANS email (juste saisie manuelle) → ajouter email en Phase 5")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Risque 4: User onboarding")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Problème: Utilisateurs ne comprennent pas comment ça marche")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Impact: Churn élevé dans les premières semaines")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mitigation: Créer un onboarding guidé (5 min max) + tutoriel vidéo")]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun("")] }),
      
      // BUDGET
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("6. BUDGET & COÛTS RÉELS")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Infrastructure")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Serveur (Phase 1-2): DigitalOcean/Hetzner 4GB = 20€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Serveur (Phase 3-4): Upgrade à 8GB = 40€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Serveur (Phase 5+): GPU server si 1000+ users = 500€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Database backups: Backup provider = 5€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("DNS/Domain: 1€/mois")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({text: "Coût infrastructure (Mois 1-7): ~60€/mois", bold: true})]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Outils & Services")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Claude Pro: 20€/mois (vous l'avez probablement)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Figma: Gratuit (tier perso) ou 12€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("GitHub: Gratuit")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Firebase: Gratuit (tier spark)")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({text: "Coût outils (Mois 1-7): ~40€/mois", bold: true})]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Coût total par mois")]
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({text: "Mois 1-7: ~100€/mois", bold: true, size: 24})]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({text: "Mois 7+: ~500-600€/mois (scaling)", bold: true, size: 24})]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Zéro coûts API LLM ✓")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Contrairement à une app basée sur Claude API qui coûterait 1000+€/mois, vous n'avez que les coûts de serveur.")]
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // REVENUE & ROI
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("7. REVENUE PROJECTIONS & ROI")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Scénario freemium → Pro")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mois 7-8 (Launch): 1000 downloads, 50 convertis à Pro = 250€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mois 9-10: 5000 downloads, 200 Pro = 1000€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mois 11-12: 15000 downloads, 500 Pro = 2500€/mois")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({text: "Year 1 revenue (freemium): ~8000€ (après déduction coûts infra)", bold: true})]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Scénario B2B (Mois 7+)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mois 7-8: 1-2 clients PME (20 seats) = 240-480€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Mois 9-12: 5-10 clients = 1200-2400€/mois")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Year 2: 50+ clients = 12000€/mois = 144000€/year")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({text: "B2B est votre levier de croissance principal", bold: true, color: "C00000"})]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("ROI Break-even")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Investissement total (7 mois): ~700€ (infra + outils)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Payback: Atteint en Mois 8-9 avec le B2B")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Profit (Year 1): ~8000€ | (Year 2): ~140000€")]
      }),
      
      new Paragraph({ spacing: { before: 400, after: 200 }, children: [new TextRun("")] }),
      
      // NEXT STEPS
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("8. PROCHAINES ÉTAPES")]
      }),
      
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Maintenant que vous avez ce plan, voici ce que vous faites:")]
      }),
      
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("1. Importer ce document dans Cowork et créer des tâches pour chaque semaine")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("2. Commencer Phase 1 IMMÉDIATEMENT (Semaine 1: Spec produit)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("3. Utiliser Claude Pro pour générer la spec (skill: product-management:write-spec)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("4. Partager la spec + ce plan avec Claude Code pour le dev")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("5. Tracker votre progrès dans Cowork semaine par semaine")]
      }),
      
      new Paragraph({ spacing: { before: 400 }, children: [new TextRun("")] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({text: "🚀 Bonne chance! Vous avez cette app en vous.", bold: true, size: 28, color: "1F4E78"})]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Plan_Rappels_App_IA.docx", buffer);
  console.log("✅ Document créé: Plan_Rappels_App_IA.docx");
});

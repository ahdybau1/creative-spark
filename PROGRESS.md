# 📊 EduMaster Pro — Suivi de Développement

> Dernière mise à jour : Correctif onboarding école **TERMINÉ** ✅

---

## 🎯 Vision globale

Plateforme SaaS de gestion scolaire **multi-établissements**, **multi-rôles** (18), **multi-types** (8 types d'écoles) et **internationale** (multi-langues, multi-devises, multi-calendriers).

- **Marché cible** : International multi-régions
- **Backend** : Lovable Cloud (DB + Auth + Storage)
- **Stack** : React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase
- **Auth** : Pas d'inscription publique — l'admin crée tous les comptes
- **Thèmes** : clair/sombre + palette dynamique par établissement (depuis logo) + override utilisateur

---

## ✅ Phase 1 — Fondations (TERMINÉE)

| Bloc | Statut | Détails |
|------|--------|---------|
| Backend Lovable Cloud | ✅ | Activé en région EMEA |
| Tables `profiles`, `schools`, `user_roles`, `user_preferences` | ✅ | Avec RLS et fonctions `has_role`, `get_user_school`, `handle_new_user` |
| Auth multi-rôles (18) | ✅ | `AuthProvider` + `RoleSwitcher` |
| Design system | ✅ | HSL tokens, light/dark, palette dynamique via `ThemeProvider` |
| Landing page internationale | ✅ | `/` |
| Authentification | ✅ | `/auth` + `/reset-password` |
| Layout app + sidebar adaptative | ✅ | `AppLayout` + `NAV_BY_ROLE` |
| 18 dashboards squelettes | ✅ | `Dashboard` + `DASHBOARD_CONFIGS` |
| Routing complet | ✅ | `App.tsx` câblé avec providers |

---

## 🚧 Phase 2 — Module Élèves (EN COURS)

> Approche : **phase par phase, qualité maximale**, **multi-types dès le départ**.

| # | Étape | Statut | Notes |
|---|-------|--------|-------|
| 1 | Schéma DB Élèves & Académique | ✅ Fait | 8 tables + 9 enums + matricule auto + RLS complète |
| 2 | Buckets Storage (photos, docs, logos) | ✅ Fait | RLS + sécurisation listing |
| 3 | Setup établissement (8 types + classes/niveaux) | ✅ Fait | Wizard 5 étapes, settings, années scolaires, niveaux & classes |
| 4 | Inscription élève — wizard 5 étapes | ✅ Fait | Identité / Médical / Famille / Scolarité / Confirmation + matricule auto + photo |
| 5 | Liste élèves : table + trombinoscope + filtres + exports | 🔄 En cours | Vue table + trombinoscope ✅ · Filtres avancés + exports ⏳ |
| 6 | Dossier élève 360° (fiche complète) | ⏳ Prochaine | Onglets : Identité, Famille, Médical, Documents, Scolarité, Finances, Comportement |
| 7 | Réinscription / Transfert / Radiation | ⏳ À faire | Procédures officielles + génération PDF |
| 8 | Génération PDF (carte scolaire, certificats) | ⏳ À faire | jsPDF + QR de vérification |

### 🗄️ Schéma DB créé en Phase 2

**Énumérations**
- `school_type` : preschool, primary, middle_school, high_school, university, vocational, driving_school, arts_sports_school
- `gender`, `blood_type`, `guardian_type`, `student_status`, `enrollment_status`, `document_type`, `transfer_type`
- `calendar_system` : trimester, semester, sequence_6, quarter
- `grading_system` : out_of_20, out_of_100, out_of_10, letter, gpa_4, competency

**Tables**
- `academic_years` : années scolaires de l'école (active/archivée)
- `levels` : niveaux scolaires (CP, 6ème, L1…) propres à chaque école
- `classes` : classes concrètes (6ème A 2025) avec capacité, prof principal, salle
- `students` : dossier complet (identité + médical + adresse + antécédents + statut)
- `student_guardians` : parents/tuteurs liés aux élèves (un compte parent peut avoir N enfants)
- `enrollments` : inscription élève → classe → année
- `student_documents` : pièces justificatives uploadées
- `student_transfers` : historique transferts/radiations

**Champs étendus sur `schools`**
- `calendar_system`, `grading_system`, `matricule_format` (configurable), `matricule_sequence` (auto), `motto`, `founded_year`

**Fonctions**
- `generate_matricule(school_id, level_code)` : génère le matricule selon le format de l'école (ex: `2026-6E-0001`)
- `is_guardian_of_school(user_id, school_id)` : vérifie si un parent a un enfant dans cette école

**Storage**
- `student-photos` (public lecture URL, listing restreint au staff)
- `student-documents` (privé, accès staff + parent/élève concerné)
- `school-logos` (public lecture URL)

---

## ⏭️ Prochaine action immédiate

**Étape 6 — Dossier élève 360°** (`/app/students/:id`)

1. Page profil avec onglets : Identité, Famille, Médical, Scolarité, Documents, Finances, Comportement
2. Édition inline des champs (avec sauvegarde optimiste)
3. Téléversement de documents (acte naissance, carnet santé, photos d'identité…)
4. Historique scolaire complet (toutes inscriptions)
5. Bouton actions : Réinscrire / Transférer / Radier / Générer carte scolaire PDF

### 📁 Fichiers créés à l'étape 4
- `src/hooks/useStudents.ts` : `useStudents`, `useStudent`, `useCreateStudent` (avec génération matricule via RPC + insertion guardians + enrollment), `uploadStudentPhoto`
- `src/components/PhotoUpload.tsx` : composant réutilisable upload photo (drag, preview, suppression, 5 Mo max)
- `src/pages/app/StudentRegistration.tsx` : wizard 5 étapes (Identité, Médical, Famille, Scolarité, Confirmation) avec stepper, validation par étape, photo, multi-tuteurs, affectation classe
- `src/pages/app/StudentsList.tsx` : liste élèves avec recherche, vue **Table** + vue **Trombinoscope**, badges de statut, actions vers nouvelle inscription
- `src/App.tsx` : routes `/app/students` et `/app/students/new`

### 🎨 Règles UX validées
- **Pas de footer** dans l'application (préparation app mobile)
- Stepper cliquable en arrière uniquement (pas de saut en avant)
- Actions disabled tant que les champs requis ne sont pas remplis

### 🛠️ Correctif appliqué — Onboarding école
- Le blocage `new row violates row-level security policy for table "schools"` a été corrigé.
- La création d'établissement passe maintenant par une opération sécurisée et atomique côté Lovable Cloud : école + rattachement profil + rôle directeur + niveaux + année scolaire active.
- Le wizard `/app/onboarding` utilise cette opération au lieu d'enchaîner plusieurs insertions sensibles depuis l'interface.
- **Prochaine action** : tester la création d'école depuis `/app/onboarding`, puis reprendre l'étape 6 — dossier élève 360°.

---

## 🗺️ Roadmap après Phase 2

| Phase | Module | Description |
|-------|--------|-------------|
| Phase 3 | Personnel & Comptes | Création comptes par admin (enseignants, parents, personnel), invitations email |
| Phase 4 | Académique | Matières, emploi du temps, cahier de textes |
| Phase 5 | Présences | Pointage manuel, QR Code, justificatifs |
| Phase 6 | Évaluations | Notes, bulletins PDF, conseil de classe |
| Phase 7 | Finances | Frais, paiements (Mobile Money, carte), reçus, salaires |
| Phase 8 | Communication | Messagerie, annonces, notifications |
| Phase 9 | Modules avancés | Transport GPS, cantine, bibliothèque, infirmerie |
| Phase 10 | Innovations | IA pédagogique, gamification, panic button, blockchain diplômes |

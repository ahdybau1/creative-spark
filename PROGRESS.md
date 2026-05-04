# PROGRESS

## Fait
- Sidebar mode dev (tous modules visibles)
- PDF documents : style moderne épuré + carte CR80 recto/verso + pack complet 1-clic
- CRUD complet sur l'existant : Classes, Niveaux, Années, Élèves, Personnel
- Migration DB nouveaux modules : subjects, class_subjects, timetable_slots, attendance_sessions, attendances, assessments, grades, fee_items, fee_payments (avec RLS)
- Phase 2 écrans CRUD :
  - `/app/subjects` (catalogue + affectation classe→matière→enseignant)
  - `/app/timetable` (créneaux EDT par classe, vue par jour)
  - `/app/attendance` (sessions + pointage P/A/R/E par classe et date)
  - `/app/grades` (évaluations + saisie notes par élève)
  - `/app/finance` (frais + encaissement paiements)

## Prochaine action
- Phase 3 : modules complémentaires (bulletins auto, communication, bibliothèque, transport)
- Améliorer les vues parent/élève côté lecture

## Livraison du 4 mai 2026 — Cœur scolaire renforcé

✅ Validations notes (0 ≤ note ≤ max), barème affiché, stats live (moy/min/max)
✅ Sauvegarde atomique notes & présences (upsert sur contraintes uniques)
✅ Présences : actions bulk "Tout marquer P/A/R/E"
✅ Finance : onglet "Soldes élèves" (dû / payé / solde + historique)
✅ EDT : grille calendrier hebdo (jours × heures) avec slots positionnés
✅ DB : notifications + messagerie (conversations, membres, messages, RLS)
✅ Pages /app/notifications et /app/messages (réaltime via Supabase channels)

⏭️ Prochaine livraison : page Établissement (super_admin), Stats globales, Utilisateurs & Rôles, Sécurité & Audit, Intégrations, Paramètres app, scaffolding email pour notifications par email.

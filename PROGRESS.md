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

## Livraison du 5 mai 2026 — Admin & Communication
✅ Pages : Stats, Users, Audit, Integrations, Settings (thème + langue + palette école)
✅ NotificationBell temps réel dans le header (badge unread + toasts)
✅ Messages : groupes, gestion membres (director/créateur), realtime
✅ Realtime activé (REPLICA IDENTITY FULL) sur messages, notifications, conversations

## Livraison du 6 mai 2026 — Email pour notifications
✅ Edge function `send-notification` : crée notif in-app + email Resend (optionnel)
✅ Helper `src/lib/notify.ts` : `sendNotification({ user_ids, title, body, link, send_email })`
ℹ️ Pour activer l'email : ajouter le secret `RESEND_API_KEY` (et `RESEND_FROM` optionnel)

## Prochaine action
- Brancher `sendNotification` sur les événements clés (nouveau message, note publiée, paiement reçu, absence)
- Bulletins automatiques (PDF par trimestre) à partir des notes saisies
- Vue parent/élève dédiée (lecture seule simplifiée)

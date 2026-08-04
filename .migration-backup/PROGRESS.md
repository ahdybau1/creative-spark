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

## Livraison du 6 mai 2026 (suite 2) — Espaces enseignant / élève / parent
✅ Hook `src/hooks/useMyStudent.ts` (élève lié au compte, enfants du parent, inscription active)
✅ `/app/my-classes` (enseignant) : classes + matières affectées, effectifs, accès rapide pointage/notes
✅ `/app/my-timetable` (élève) : EDT hebdo de sa classe
✅ `/app/my-grades` (élève) : notes + moyenne pondérée (composant réutilisable)
✅ `/app/children` (parent) : fiches des enfants + classe
✅ `/app/children-grades` (parent) : notes par enfant (onglets)
✅ `/app/children-absences` (parent) : absences/retards par enfant
✅ `/app/payments` (parent) : dû / payé / solde + historique des règlements
✅ Routes ajoutées dans `src/App.tsx` (plus de Placeholder pour ces modules)

## Prochaine action
- Brancher `sendNotification` sur les événements clés (message, note, paiement, absence)
- Bulletins automatiques (PDF par trimestre)
- Modules enseignant restants : cahier de textes, devoirs
- Modules parent/élève restants : e-learning, ressources, suivi bus

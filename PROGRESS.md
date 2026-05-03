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

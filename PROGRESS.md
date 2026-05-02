# PROGRESS

## Fait
- Sidebar mode dev (tous modules visibles)
- PDF documents : style moderne épuré + carte CR80 recto/verso + pack complet 1-clic
- CRUD complet sur l'existant : Classes (Edit + Delete), Niveaux (Edit + Delete), Années (Edit + Delete + Archive), Élèves (menu Modifier/Supprimer), Personnel (Retirer du personnel)
- Migration DB nouveaux modules : subjects, class_subjects, timetable_slots, attendance_sessions, attendances, assessments, grades, fee_items, fee_payments (avec RLS)

## Prochaine action
- Phase 2 : écrans CRUD pour les nouveaux modules
  1. Matières (`/app/subjects`)
  2. Affectation matière→classe + enseignant
  3. Emploi du temps (`/app/timetable`)
  4. Présences (`/app/attendance`)
  5. Notes & évaluations (`/app/grades`)
  6. Frais & paiements (`/app/finance`)

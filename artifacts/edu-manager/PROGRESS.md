# PROGRESS

## Fait
- Établissement, années scolaires, niveaux, classes, groupes de classes (CRUD)
- Élèves : inscription (wizard), liste, dossier 360°, documents PDF (carte CR80 recto/verso, certificats)
- Personnel & rôles, invitations, RBAC (navigation + RoleGuard)
- Matières, emploi du temps (grille hebdo + anti-conflit enseignant/salle), pointage, notes & barèmes, bulletins
- Finance : frais, encaissements, soldes élèves
- Communication : messagerie temps réel, notifications (cloche + emails)
- Espaces dédiés : enseignant (mes classes), élève (EDT, notes), parent (enfants, notes, absences, paiements)
- **Cahier de textes & devoirs** (nouveau) :
  - DB : `lesson_entries`, `homeworks`, `homework_submissions` + RLS (staff / élève / parent) et helper `is_linked_to_class`
  - `/app/homework` (enseignant/direction) : séances du cahier de textes + création/publication/suppression de devoirs, compteur de remises
  - `/app/my-homework` (élève) : devoirs à faire, remise en ligne (modifiable), note & appréciation, consultation du cahier de textes
  - Navigation enseignant / professeur principal mise à jour
- Correction infra : script `dev` racine (le serveur de preview démarre l'app edu-manager sur $PORT)

## Prochaine action
- Notation des remises de devoirs côté enseignant (saisie note + appréciation par élève)
- Modules élève/parent restants : e-learning, ressources, badges
- Modules vie scolaire : bibliothèque, transport, cantine, santé

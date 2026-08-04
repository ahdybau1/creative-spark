import { useMyChildren, useCurrentEnrollment } from "@/hooks/useMyStudent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function ChildCard({ child }: { child: any }) {
  const { data: enrollment } = useCurrentEnrollment(child.id);
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={child.photo_url ?? undefined} alt={`${child.first_name} ${child.last_name}`} />
          <AvatarFallback>
            {child.first_name?.[0]}
            {child.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-display font-semibold truncate">
            {child.first_name} {child.last_name}
          </p>
          <p className="text-sm text-muted-foreground">Matricule {child.matricule}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{(enrollment as any)?.classes?.name ?? "Non affecté"}</Badge>
            <Badge variant="outline">{child.status}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Children() {
  const { data: children, isLoading } = useMyChildren();

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Mes enfants</h1>
        <p className="text-muted-foreground">Les élèves rattachés à votre compte.</p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : !children?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun enfant rattaché à votre compte. Contactez le secrétariat de l'établissement.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c: any) => (
            <ChildCard key={c.id} child={c} />
          ))}
        </div>
      )}
    </div>
  );
}

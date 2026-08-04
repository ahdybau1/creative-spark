import { useState } from "react";
import { useMyChildren } from "@/hooks/useMyStudent";
import { StudentGradesView } from "./MyGrades";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ChildrenGrades() {
  const { data: children, isLoading } = useMyChildren();
  const [tab, setTab] = useState<string | undefined>();

  const active = tab ?? children?.[0]?.id;

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Notes & Bulletins</h1>
        <p className="text-muted-foreground">Résultats scolaires de vos enfants.</p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : !children?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun enfant rattaché à votre compte.
          </CardContent>
        </Card>
      ) : (
        <Tabs value={active} onValueChange={setTab}>
          <TabsList className="mb-4 flex-wrap h-auto">
            {children.map((c: any) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {children.map((c: any) => (
            <TabsContent key={c.id} value={c.id}>
              <StudentGradesView studentId={c.id} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

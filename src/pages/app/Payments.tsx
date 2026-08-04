import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyChildren } from "@/hooks/useMyStudent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const METHOD_LABEL: Record<string, string> = {
  cash: "Espèces",
  bank_transfer: "Virement",
  mobile_money: "Mobile money",
  check: "Chèque",
  card: "Carte",
  other: "Autre",
};

function ChildPayments({ child }: { child: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["child-payments", child.id],
    queryFn: async () => {
      const [payments, fees] = await Promise.all([
        supabase
          .from("fee_payments")
          .select("id, amount, method, paid_at, receipt_number, fee_items(name)")
          .eq("student_id", child.id)
          .order("paid_at", { ascending: false }),
        supabase.from("fee_items").select("id, name, amount, is_mandatory").eq("school_id", child.school_id),
      ]);
      if (payments.error) throw payments.error;
      if (fees.error) throw fees.error;
      return { payments: payments.data ?? [], fees: fees.data ?? [] };
    },
  });

  const due = (data?.fees ?? []).reduce((s: number, f: any) => s + Number(f.amount || 0), 0);
  const paid = (data?.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const balance = due - paid;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="font-display font-semibold">
            {child.first_name} {child.last_name}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Dû {due.toLocaleString()}</Badge>
            <Badge variant="secondary">Payé {paid.toLocaleString()}</Badge>
            <Badge variant={balance > 0 ? "destructive" : "default"}>Solde {balance.toLocaleString()}</Badge>
          </div>
        </div>
        {isLoading ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">Chargement…</p>
        ) : !data?.payments.length ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun paiement enregistré.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Reçu</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.paid_at}</TableCell>
                  <TableCell>{p.fee_items?.name ?? "—"}</TableCell>
                  <TableCell>{METHOD_LABEL[p.method] ?? p.method}</TableCell>
                  <TableCell className="text-muted-foreground">{p.receipt_number ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{Number(p.amount).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function Payments() {
  const { data: children, isLoading } = useMyChildren();

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Paiements</h1>
        <p className="text-muted-foreground">Soldes et historique des règlements.</p>
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
        <div className="space-y-4">
          {children.map((c: any) => (
            <ChildPayments key={c.id} child={c} />
          ))}
        </div>
      )}
    </div>
  );
}

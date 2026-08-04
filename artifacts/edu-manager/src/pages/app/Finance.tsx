import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Wallet, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PERIODS = ["yearly", "termly", "monthly", "one_time"] as const;
const METHODS = ["cash", "bank_transfer", "mobile_money", "check", "card", "other"] as const;

export default function FinancePage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const qc = useQueryClient();

  const itemsQ = useQuery({
    queryKey: ["fee-items", school?.id],
    enabled: !!school?.id,
    queryFn: async () => (await supabase.from("fee_items").select("*").eq("school_id", school!.id).order("name")).data ?? [],
  });

  const paymentsQ = useQuery({
    queryKey: ["fee-payments", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data } = await supabase.from("fee_payments")
        .select("*, student:students(first_name, last_name, matricule), item:fee_items(name)")
        .eq("school_id", school!.id).order("paid_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  const studentsQ = useQuery({
    queryKey: ["fin-students", school?.id],
    enabled: !!school?.id,
    queryFn: async () => (await supabase.from("students").select("id, first_name, last_name, matricule").eq("school_id", school!.id).order("last_name")).data ?? [],
  });

  const [openItem, setOpenItem] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  const removeItem = async (id: string) => {
    if (!confirm("Supprimer ce frais ?")) return;
    const { error } = await supabase.from("fee_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["fee-items"] }); }
  };
  const removePayment = async (id: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    const { error } = await supabase.from("fee_payments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["fee-payments"] }); }
  };

  if (!school) return <div className="container py-10">Aucune école.</div>;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Frais & paiements</h1>
        <p className="text-muted-foreground mt-1">Configurer les frais et enregistrer les paiements.</p>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items"><Wallet className="h-4 w-4 mr-2" />Frais ({itemsQ.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-2" />Paiements ({paymentsQ.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="balance"><Wallet className="h-4 w-4 mr-2" />Soldes élèves</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={openItem} onOpenChange={setOpenItem}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Nouveau frais</Button></DialogTrigger>
              <ItemDialog
                schoolId={school.id} yearId={year?.id ?? null} currency={school.currency}
                onSaved={() => { setOpenItem(false); qc.invalidateQueries({ queryKey: ["fee-items"] }); }}
              />
            </Dialog>
          </div>
          {itemsQ.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> : !itemsQ.data?.length ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center text-muted-foreground">Aucun frais.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {itemsQ.data.map((it: any) => (
                <div key={it.id} className="rounded-2xl border bg-card p-5 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display font-bold">{it.name}</div>
                      {it.description && <p className="text-xs text-muted-foreground mt-1">{it.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl font-bold">{Number(it.amount).toLocaleString()} {school.currency}</span>
                    <Badge variant="secondary">{it.periodicity}</Badge>
                  </div>
                  {it.due_date && <div className="text-xs text-muted-foreground mt-2">Échéance : {it.due_date}</div>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={openPay} onOpenChange={setOpenPay}>
              <DialogTrigger asChild><Button className="gap-2" disabled={!studentsQ.data?.length}><Plus className="h-4 w-4" />Encaisser</Button></DialogTrigger>
              <PaymentDialog
                schoolId={school.id} students={studentsQ.data ?? []} items={itemsQ.data ?? []} currency={school.currency}
                onSaved={() => { setOpenPay(false); qc.invalidateQueries({ queryKey: ["fee-payments"] }); }}
              />
            </Dialog>
          </div>
          {paymentsQ.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> : !paymentsQ.data?.length ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center text-muted-foreground">Aucun paiement.</div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Élève</th><th className="text-left px-4 py-3">Frais</th><th className="text-left px-4 py-3">Méthode</th><th className="text-right px-4 py-3">Montant</th><th className="px-4 py-3 w-12"></th></tr>
                </thead>
                <tbody>
                  {paymentsQ.data.map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">{p.paid_at}</td>
                      <td className="px-4 py-3">{p.student?.last_name} {p.student?.first_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.item?.name ?? "—"}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{p.method}</Badge></td>
                      <td className="px-4 py-3 text-right font-semibold">{Number(p.amount).toLocaleString()} {school.currency}</td>
                      <td className="px-4 py-3"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removePayment(p.id)}><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="balance" className="mt-6">
          <BalancePanel
            students={studentsQ.data ?? []}
            items={itemsQ.data ?? []}
            payments={paymentsQ.data ?? []}
            currency={school.currency}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BalancePanel({ students, items, payments, currency }: any) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const totalDue = items.filter((i: any) => i.is_mandatory).reduce((a: number, b: any) => a + Number(b.amount), 0);
  const studentPays = payments.filter((p: any) => p.student_id === studentId);
  const totalPaid = studentPays.reduce((a: number, b: any) => a + Number(b.amount), 0);
  const balance = totalDue - totalPaid;

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-w-md">
        <Label>Élève</Label>
        <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name} ({s.matricule})</option>)}
        </select>
      </div>
      {studentId && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border bg-card p-5">
              <div className="text-xs text-muted-foreground">Dû (frais obligatoires)</div>
              <div className="text-2xl font-bold mt-1">{totalDue.toLocaleString()} {currency}</div>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <div className="text-xs text-muted-foreground">Payé</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">{totalPaid.toLocaleString()} {currency}</div>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <div className="text-xs text-muted-foreground">Solde</div>
              <div className={`text-2xl font-bold mt-1 ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {balance.toLocaleString()} {currency}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-sm">Historique de paiements</div>
            {studentPays.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Aucun paiement.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr><th className="text-left px-4 py-2">Date</th><th className="text-left px-4 py-2">Frais</th><th className="text-left px-4 py-2">Méthode</th><th className="text-right px-4 py-2">Montant</th></tr>
                </thead>
                <tbody>
                  {studentPays.map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-2">{p.paid_at}</td>
                      <td className="px-4 py-2 text-muted-foreground">{p.item?.name ?? "—"}</td>
                      <td className="px-4 py-2"><Badge variant="outline">{p.method}</Badge></td>
                      <td className="px-4 py-2 text-right font-semibold">{Number(p.amount).toLocaleString()} {currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ItemDialog({ schoolId, yearId, currency, onSaved }: any) {
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0); const [period, setPeriod] = useState<any>("yearly");
  const [due, setDue] = useState(""); const [mandatory, setMandatory] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.from("fee_items").insert({
      school_id: schoolId, academic_year_id: yearId, name, description: desc || null,
      amount, periodicity: period, due_date: due || null, is_mandatory: mandatory,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Créé"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouveau frais</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-2"><Label>Nom *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Frais de scolarité" /></div>
        <div className="space-y-2"><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Montant ({currency}) *</Label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Périodicité</Label>
            <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2"><Label>Échéance (optionnelle)</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />Obligatoire</label>
      </div>
      <DialogFooter><Button onClick={submit} disabled={!name || loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Créer</Button></DialogFooter>
    </DialogContent>
  );
}

function PaymentDialog({ schoolId, students, items, currency, onSaved }: any) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<any>("cash");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.from("fee_payments").insert({
      school_id: schoolId, student_id: studentId, fee_item_id: itemId || null,
      amount, method, paid_at: paidAt, receipt_number: receipt || null,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Encaissé"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouveau paiement</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-2"><Label>Élève *</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students.map((s: any) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name} ({s.matricule})</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Frais</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={itemId} onChange={(e) => {
            setItemId(e.target.value);
            const it = items.find((i: any) => i.id === e.target.value);
            if (it) setAmount(Number(it.amount));
          }}>
            <option value="">— Libre —</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.amount} {currency})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Montant *</Label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Méthode</Label>
            <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></div>
          <div className="space-y-2"><Label>Reçu n°</Label><Input value={receipt} onChange={(e) => setReceipt(e.target.value)} /></div>
        </div>
      </div>
      <DialogFooter><Button onClick={submit} disabled={!studentId || !amount || loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Enregistrer</Button></DialogFooter>
    </DialogContent>
  );
}

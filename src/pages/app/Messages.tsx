import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Send, MessageSquare, Users, UserPlus, UserMinus, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function MessagesPage() {
  const { user, activeRole } = useAuth();
  const { data: school } = useCurrentSchool();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [openMembers, setOpenMembers] = useState(false);

  const isDirector = activeRole === "director" || activeRole === "super_admin";

  const convsQ = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: members } = await supabase.from("conversation_members")
        .select("conversation_id, conversations(id, title, is_group, updated_at, created_by)")
        .eq("user_id", user!.id);
      const list = (members ?? []).map((m: any) => m.conversations).filter(Boolean);
      list.sort((a: any, b: any) => (b.updated_at > a.updated_at ? 1 : -1));
      return list;
    },
  });

  // Realtime: nouvelle conv ou nouveau msg → refresh liste
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`user-convs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["conversations", user.id] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["conversations", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  useEffect(() => {
    if (convsQ.data?.length && !activeId) setActiveId(convsQ.data[0].id);
  }, [convsQ.data]);

  const activeConv: any = convsQ.data?.find((c: any) => c.id === activeId);

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Messagerie</h1>
          <p className="text-muted-foreground mt-1">Conversations et groupes en temps réel.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Nouvelle conversation</Button></DialogTrigger>
          {school && user && <NewConversationDialog
            schoolId={school.id} userId={user.id}
            onSaved={(id) => { setOpenNew(false); setActiveId(id); qc.invalidateQueries({ queryKey: ["conversations"] }); }}
          />}
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[65vh]">
        <div className="rounded-2xl border bg-card overflow-y-auto">
          {convsQ.isLoading ? <div className="p-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> :
            !convsQ.data?.length ? <div className="p-6 text-center text-sm text-muted-foreground"><MessageSquare className="h-8 w-8 mx-auto mb-2" />Aucune conversation</div> :
            convsQ.data.map((c: any) => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-muted/40 flex items-center gap-2 ${activeId === c.id ? "bg-muted/60" : ""}`}>
                {c.is_group ? <Users className="h-4 w-4 text-primary" /> : <MessageSquare className="h-4 w-4 text-primary" />}
                <span className="font-medium text-sm truncate">{c.title ?? "Conversation"}</span>
              </button>
            ))
          }
        </div>
        <div className="rounded-2xl border bg-card flex flex-col">
          {activeConv && user ? (
            <>
              <div className="border-b px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {activeConv.is_group ? <Users className="h-4 w-4 text-primary" /> : <MessageSquare className="h-4 w-4 text-primary" />}
                  <span className="font-semibold text-sm truncate">{activeConv.title ?? "Conversation"}</span>
                </div>
                {activeConv.is_group && (isDirector || activeConv.created_by === user.id) && (
                  <Dialog open={openMembers} onOpenChange={setOpenMembers}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1.5"><Settings2 className="h-4 w-4" />Membres</Button>
                    </DialogTrigger>
                    {school && <ManageMembersDialog conversationId={activeConv.id} schoolId={school.id} userId={user.id} />}
                  </Dialog>
                )}
              </div>
              <ChatPanel conversationId={activeConv.id} userId={user.id} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Sélectionnez une conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ conversationId, userId }: { conversationId: string; userId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const msgsQ = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => (await supabase.from("messages").select("*, sender:profiles(full_name)").eq("conversation_id", conversationId).order("created_at")).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel(`conv-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }))
      .subscribe();
    // mark as read
    supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId).eq("user_id", userId);
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, userId, qc]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgsQ.data]);

  const send = async () => {
    if (!body.trim()) return;
    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: userId, body: body.trim() });
    if (error) toast.error(error.message);
    else {
      setBody("");
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgsQ.data?.map((m: any) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!mine && <div className="text-xs font-semibold opacity-70 mb-0.5">{m.sender?.full_name}</div>}
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className={`text-[10px] mt-1 ${mine ? "opacity-70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString().slice(0, 5)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <Input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Votre message…" />
        <Button onClick={send} className="gap-2"><Send className="h-4 w-4" />Envoyer</Button>
      </div>
    </>
  );
}

function NewConversationDialog({ schoolId, userId, onSaved }: { schoolId: string; userId: string; onSaved: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const peopleQ = useQuery({
    queryKey: ["school-people", schoolId],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").eq("school_id", schoolId).neq("id", userId).order("full_name")).data ?? [],
  });

  const submit = async () => {
    if (!selected.length) return toast.error("Choisissez au moins un participant");
    setLoading(true);
    const { data: conv, error } = await supabase.from("conversations")
      .insert({ school_id: schoolId, created_by: userId, is_group: isGroup || selected.length > 1, title: title || null })
      .select().single();
    if (error || !conv) { setLoading(false); return toast.error(error?.message ?? "Erreur"); }
    const members = [userId, ...selected].map((uid) => ({ conversation_id: conv.id, user_id: uid }));
    const { error: e2 } = await supabase.from("conversation_members").insert(members);
    setLoading(false);
    if (e2) return toast.error(e2.message);
    onSaved(conv.id);
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouvelle conversation</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-2"><Label>Titre (optionnel)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Profs de 6e A" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} />Forcer en groupe</label>
        <div className="space-y-2">
          <Label>Participants</Label>
          <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
            {peopleQ.data?.map((p: any) => (
              <label key={p.id} className="flex items-center gap-2 p-2 text-sm hover:bg-muted/40 cursor-pointer">
                <input type="checkbox" checked={selected.includes(p.id)}
                  onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))} />
                <span>{p.full_name ?? p.email}</span>
              </label>
            ))}
            {!peopleQ.data?.length && <div className="p-3 text-xs text-muted-foreground">Aucun autre membre.</div>}
          </div>
        </div>
      </div>
      <DialogFooter><Button onClick={submit} disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Créer</Button></DialogFooter>
    </DialogContent>
  );
}

function ManageMembersDialog({ conversationId, schoolId, userId }: { conversationId: string; schoolId: string; userId: string }) {
  const qc = useQueryClient();

  const membersQ = useQuery({
    queryKey: ["conv-members", conversationId],
    queryFn: async () => (await supabase.from("conversation_members")
      .select("user_id, profiles(id, full_name, email)").eq("conversation_id", conversationId)).data ?? [],
  });

  const peopleQ = useQuery({
    queryKey: ["school-people", schoolId],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").eq("school_id", schoolId).order("full_name")).data ?? [],
  });

  const memberIds = new Set((membersQ.data ?? []).map((m: any) => m.user_id));
  const candidates = (peopleQ.data ?? []).filter((p: any) => !memberIds.has(p.id));

  const add = async (uid: string) => {
    const { error } = await supabase.from("conversation_members").insert({ conversation_id: conversationId, user_id: uid });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["conv-members", conversationId] });
    toast.success("Membre ajouté");
  };
  const remove = async (uid: string) => {
    if (uid === userId) return toast.error("Vous ne pouvez pas vous retirer vous-même");
    const { error } = await supabase.from("conversation_members").delete()
      .eq("conversation_id", conversationId).eq("user_id", uid);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["conv-members", conversationId] });
    toast.success("Membre retiré");
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Gestion des membres</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label className="mb-2 block">Membres actuels ({membersQ.data?.length ?? 0})</Label>
          <div className="rounded-md border divide-y max-h-40 overflow-y-auto">
            {membersQ.data?.map((m: any) => (
              <div key={m.user_id} className="flex items-center justify-between p-2 text-sm">
                <span>{m.profiles?.full_name ?? m.profiles?.email}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(m.user_id)}>
                  <UserMinus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Ajouter un membre</Label>
          <div className="rounded-md border divide-y max-h-40 overflow-y-auto">
            {candidates.length === 0 && <div className="p-3 text-xs text-muted-foreground">Tous les membres de l'école sont déjà dans la conversation.</div>}
            {candidates.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-2 text-sm">
                <span>{p.full_name ?? p.email}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => add(p.id)}>
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

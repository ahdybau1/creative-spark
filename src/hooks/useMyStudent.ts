import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

/** L'élève lié au compte connecté (rôle student). */
export function useMyStudent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-student", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Les enfants rattachés au compte connecté (rôle parent). */
export function useMyChildren() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-children", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_guardians")
        .select("id, guardian_type, is_primary, students(*)")
        .eq("guardian_user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.students).filter(Boolean);
    },
  });
}

/** Inscription active (classe) d'un élève. */
export function useCurrentEnrollment(studentId?: string | null) {
  return useQuery({
    queryKey: ["current-enrollment", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, class_id, status, classes(id, name, section, room)")
        .eq("student_id", studentId!)
        .in("status", ["enrolled", "reenrolled", "repeating"])
        .order("enrolled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import type { Database } from "@/integrations/supabase/types";

export type School = Database["public"]["Tables"]["schools"]["Row"];
export type AcademicYear = Database["public"]["Tables"]["academic_years"]["Row"];
export type Level = Database["public"]["Tables"]["levels"]["Row"];
export type Class = Database["public"]["Tables"]["classes"]["Row"];

/** Fetch the current user's school via their profile.school_id */
export function useCurrentSchool() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-school", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user!.id)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile?.school_id) return null;

      const { data: school, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", profile.school_id)
        .maybeSingle();

      if (error) throw error;
      return school;
    },
  });
}

export function useAcademicYears(schoolId?: string | null) {
  return useQuery({
    queryKey: ["academic-years", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("school_id", schoolId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useActiveAcademicYear(schoolId?: string | null) {
  return useQuery({
    queryKey: ["active-year", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLevels(schoolId?: string | null) {
  return useQuery({
    queryKey: ["levels", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("levels")
        .select("*")
        .eq("school_id", schoolId!)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });
}

export function useClasses(schoolId?: string | null, academicYearId?: string | null) {
  return useQuery({
    queryKey: ["classes", schoolId, academicYearId],
    enabled: !!schoolId && !!academicYearId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*, level:levels(*), main_teacher:profiles!classes_main_teacher_id_fkey(*)")
        .eq("school_id", schoolId!)
        .eq("academic_year_id", academicYearId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<School> & { id: string }) => {
      const { id, ...rest } = payload;
      const { data, error } = await supabase
        .from("schools")
        .update(rest)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["current-school"] });
    },
  });
}

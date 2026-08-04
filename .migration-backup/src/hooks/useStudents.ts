import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type GuardianInsert = Database["public"]["Tables"]["student_guardians"]["Insert"];

export function useStudents(schoolId?: string | null) {
  return useQuery({
    queryKey: ["students", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, enrollments(id, status, class:classes(id, name, level:levels(name, short_code)))")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStudent(id?: string) {
  return useQuery({
    queryKey: ["student", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "*, guardians:student_guardians(*), enrollments(*, class:classes(*, level:levels(*))), documents:student_documents(*)"
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface CreateStudentPayload {
  student: Omit<StudentInsert, "matricule">;
  level_short_code?: string | null;
  guardians: Omit<GuardianInsert, "student_id">[];
  class_id?: string | null;
  academic_year_id?: string | null;
}

export function useCreateStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStudentPayload) => {
      // 1) Generate matricule via RPC
      const { data: matricule, error: rpcErr } = await supabase.rpc("generate_matricule", {
        _school_id: payload.student.school_id,
        _level_code: payload.level_short_code ?? null,
      });
      if (rpcErr) throw rpcErr;

      // 2) Insert student
      const { data: student, error: studentErr } = await supabase
        .from("students")
        .insert({ ...payload.student, matricule: matricule as string })
        .select()
        .single();
      if (studentErr) throw studentErr;

      // 3) Insert guardians
      if (payload.guardians.length > 0) {
        const { error: gErr } = await supabase
          .from("student_guardians")
          .insert(payload.guardians.map((g) => ({ ...g, student_id: student.id })));
        if (gErr) throw gErr;
      }

      // 4) Enroll in class if provided
      if (payload.class_id && payload.academic_year_id) {
        const { error: eErr } = await supabase.from("enrollments").insert({
          student_id: student.id,
          class_id: payload.class_id,
          academic_year_id: payload.academic_year_id,
          status: "enrolled",
        });
        if (eErr) throw eErr;
      }

      return student;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export async function uploadStudentPhoto(file: File, schoolId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${schoolId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("student-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("student-photos").getPublicUrl(path);
  return data.publicUrl;
}

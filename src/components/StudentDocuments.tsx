import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, IdCard, Loader2, ScrollText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useCurrentSchool } from "@/hooks/useSchool";
import { supabase } from "@/integrations/supabase/client";
import {
  generateEnrollmentCertificate,
  generateStudentIDCard,
  generateTransferCertificate,
} from "@/lib/pdf/student-pdf";

export function StudentDocuments({ student }: { student: any }) {
  const { data: school } = useCurrentSchool();
  const [busy, setBusy] = useState<string | null>(null);

  if (!school) return null;

  const activeEnrollment =
    student?.enrollments?.find((e: any) => e.status === "enrolled") ??
    student?.enrollments?.[0];

  const klass = {
    name: activeEnrollment?.class?.name ?? null,
    level_name: activeEnrollment?.class?.level?.name ?? null,
    academic_year:
      activeEnrollment?.class?.academic_year_id
        ? undefined
        : null,
  };

  const studentInfo = {
    id: student.id,
    matricule: student.matricule,
    first_name: student.first_name,
    last_name: student.last_name,
    middle_name: student.middle_name,
    date_of_birth: student.date_of_birth,
    place_of_birth: student.place_of_birth,
    gender: student.gender,
    nationality: student.nationality,
    photo_url: student.photo_url,
    blood_type: student.blood_type,
  };

  const handleIDCard = async () => {
    setBusy("id");
    try {
      // Récupérer l'année scolaire active pour la carte
      let academic_year: string | null = null;
      if (activeEnrollment?.academic_year_id) {
        const { data } = await supabase
          .from("academic_years")
          .select("name")
          .eq("id", activeEnrollment.academic_year_id)
          .maybeSingle();
        academic_year = data?.name ?? null;
      }
      await generateStudentIDCard(studentInfo, school as any, {
        ...klass,
        academic_year,
      });
      toast.success("Carte d'élève générée");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally {
      setBusy(null);
    }
  };

  const handleEnrollmentCert = async () => {
    if (!activeEnrollment) {
      toast.error("Aucune inscription active pour cet élève");
      return;
    }
    setBusy("cert");
    try {
      const { data: ay } = await supabase
        .from("academic_years")
        .select("name")
        .eq("id", activeEnrollment.academic_year_id)
        .maybeSingle();
      await generateEnrollmentCertificate(studentInfo, school as any, {
        ...klass,
        academic_year: ay?.name ?? null,
      });
      toast.success("Certificat de scolarité généré");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally {
      setBusy(null);
    }
  };

  const handleLastTransferCert = async () => {
    setBusy("trf");
    try {
      const { data: trf, error } = await supabase
        .from("student_transfers")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!trf) {
        toast.error("Aucun transfert ou radiation enregistré");
        return;
      }
      await generateTransferCertificate({
        student: studentInfo,
        school: school as any,
        type: trf.transfer_type as any,
        reason: trf.reason,
        effective_date: trf.effective_date,
        destination_school: trf.destination_school,
        certificate_number: trf.certificate_number,
        last_class: klass.name,
        academic_year: null,
      });
      toast.success("Certificat généré");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally {
      setBusy(null);
    }
  };

  const isBusy = busy !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isBusy}>
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Documents
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Documents officiels</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleIDCard} className="gap-2">
          <IdCard className="h-4 w-4" />
          Carte d'élève (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEnrollmentCert} className="gap-2">
          <ScrollText className="h-4 w-4" />
          Certificat de scolarité
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLastTransferCert} className="gap-2">
          <FileText className="h-4 w-4" />
          Dernier certificat (transfert/radiation)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

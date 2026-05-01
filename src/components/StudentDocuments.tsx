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
import {
  FileText, IdCard, Loader2, ScrollText, ChevronDown, Printer, Download, Files,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentSchool } from "@/hooks/useSchool";
import { supabase } from "@/integrations/supabase/client";
import {
  generateAllStudentDocuments,
  generateEnrollmentCertificate,
  generateStudentIDCard,
  generateTransferCertificate,
  type PdfOutput,
} from "@/lib/pdf/student-pdf";

export function StudentDocuments({ student }: { student: any }) {
  const { data: school } = useCurrentSchool();
  const [busy, setBusy] = useState<string | null>(null);

  if (!school) return null;

  const activeEnrollment =
    student?.enrollments?.find((e: any) => e.status === "enrolled") ??
    student?.enrollments?.[0];

  const klassBase = {
    name: activeEnrollment?.class?.name ?? null,
    level_name: activeEnrollment?.class?.level?.name ?? null,
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

  async function fetchYearName(): Promise<string | null> {
    if (!activeEnrollment?.academic_year_id) return null;
    const { data } = await supabase
      .from("academic_years").select("name")
      .eq("id", activeEnrollment.academic_year_id).maybeSingle();
    return data?.name ?? null;
  }

  async function fetchLastTransfer() {
    const { data } = await supabase
      .from("student_transfers").select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
    return data;
  }

  const handleIDCard = async (output: PdfOutput) => {
    setBusy("id");
    try {
      const academic_year = await fetchYearName();
      await generateStudentIDCard(studentInfo, school as any, { ...klassBase, academic_year }, output);
      toast.success(output === "print" ? "Ouverture pour impression…" : "Carte téléchargée");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally { setBusy(null); }
  };

  const handleEnrollmentCert = async (output: PdfOutput) => {
    if (!activeEnrollment) { toast.error("Aucune inscription active"); return; }
    setBusy("cert");
    try {
      const academic_year = await fetchYearName();
      await generateEnrollmentCertificate(studentInfo, school as any, { ...klassBase, academic_year }, output);
      toast.success(output === "print" ? "Ouverture pour impression…" : "Certificat téléchargé");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally { setBusy(null); }
  };

  const handleLastTransferCert = async (output: PdfOutput) => {
    setBusy("trf");
    try {
      const trf = await fetchLastTransfer();
      if (!trf) { toast.error("Aucun transfert ou radiation"); return; }
      await generateTransferCertificate({
        student: studentInfo, school: school as any,
        type: trf.transfer_type as any,
        reason: trf.reason, effective_date: trf.effective_date,
        destination_school: trf.destination_school,
        certificate_number: trf.certificate_number,
        last_class: klassBase.name, academic_year: null,
        output,
      });
      toast.success(output === "print" ? "Ouverture pour impression…" : "Certificat téléchargé");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally { setBusy(null); }
  };

  const handleAll = async (output: PdfOutput) => {
    setBusy("all");
    try {
      const academic_year = await fetchYearName();
      const trf = await fetchLastTransfer();
      await generateAllStudentDocuments({
        student: studentInfo,
        school: school as any,
        klass: { ...klassBase, academic_year },
        lastTransfer: trf ? {
          type: trf.transfer_type as any,
          reason: trf.reason,
          effective_date: trf.effective_date,
          destination_school: trf.destination_school,
          certificate_number: trf.certificate_number,
        } : null,
        output,
      });
      toast.success(output === "print" ? "Dossier prêt à imprimer" : "Dossier complet téléchargé");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally { setBusy(null); }
  };

  const isBusy = busy !== null;

  return (
    <div className="flex items-center gap-2">
      {/* Bouton principal "Tout imprimer en 1 clic" */}
      <Button
        size="sm"
        className="gap-2"
        onClick={() => handleAll("print")}
        disabled={isBusy}
        title="Carte + Certificat de scolarité + dernier transfert dans un seul PDF prêt à imprimer"
      >
        {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        Tout imprimer
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isBusy}>
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Documents
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Dossier complet</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleAll("print")} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimer le dossier complet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAll("download")} className="gap-2">
            <Files className="h-4 w-4" /> Télécharger le dossier (PDF)
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Carte d'élève</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleIDCard("print")} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleIDCard("download")} className="gap-2">
            <Download className="h-4 w-4" /> Télécharger
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Certificat de scolarité</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleEnrollmentCert("print")} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEnrollmentCert("download")} className="gap-2">
            <ScrollText className="h-4 w-4" /> Télécharger
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Dernier transfert / radiation</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleLastTransferCert("print")} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleLastTransferCert("download")} className="gap-2">
            <IdCard className="h-4 w-4" /> Télécharger
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import jsPDF from "jspdf";
import QRCode from "qrcode";

/** Output mode for generated PDFs */
export type PdfOutput = "download" | "print";

/** Save or open+print depending on mode */
function emit(doc: jsPDF, filename: string, mode: PdfOutput) {
  if (mode === "print") {
    const blobUrl = doc.output("bloburl") as unknown as string;
    const win = window.open(blobUrl, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        try { win.focus(); win.print(); } catch { /* ignore */ }
      });
    }
  } else {
    doc.save(filename);
  }
}

export interface SchoolPdfInfo {
  name: string;
  motto?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  country?: string | null;
  primary_color?: string | null; // HSL "215 80% 45%"
}

export interface StudentPdfInfo {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  date_of_birth: string;
  place_of_birth?: string | null;
  gender: string;
  nationality?: string | null;
  photo_url?: string | null;
  blood_type?: string | null;
}

export interface ClassPdfInfo {
  name?: string | null;
  level_name?: string | null;
  academic_year?: string | null;
}

/* ---------- Utils ---------- */

function hslToRgb(hsl?: string | null): [number, number, number] {
  if (!hsl) return [37, 99, 235]; // default blue
  const m = hsl.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!m) return [37, 99, 235];
  let h = parseFloat(m[1]) / 360;
  let s = parseFloat(m[2]) / 100;
  let l = parseFloat(m[3]) / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve((r.result as string) ?? null);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function fullName(s: StudentPdfInfo) {
  return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ");
}

/* ---------- Header partagé ---------- */

async function drawHeader(
  doc: jsPDF,
  school: SchoolPdfInfo,
  title: string
): Promise<number> {
  const [r, g, b] = hslToRgb(school.primary_color);
  const pageW = doc.internal.pageSize.getWidth();

  // Bandeau couleur
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 32, "F");

  // Logo
  if (school.logo_url) {
    const logo = await loadImageDataUrl(school.logo_url);
    if (logo) {
      try {
        doc.addImage(logo, "PNG", 12, 6, 20, 20);
      } catch {
        /* ignore */
      }
    }
  }

  // Nom école
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(school.name.toUpperCase(), 38, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (school.motto) doc.text(school.motto, 38, 20);
  const meta = [school.address, school.phone, school.email].filter(Boolean).join(" · ");
  if (meta) doc.text(meta, 38, 25);

  // Titre du document
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), pageW / 2, 44, { align: "center" });

  // Trait
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.5);
  doc.line(20, 48, pageW - 20, 48);

  return 56; // y de départ du contenu
}

function drawFooter(doc: jsPDF, school: SchoolPdfInfo) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(8);
  doc.setTextColor(120);
  const date = new Date().toLocaleString("fr-FR");
  doc.text(`Édité le ${date}`, 20, pageH - 10);
  doc.text(school.website || "", pageW - 20, pageH - 10, { align: "right" });
}

/* ---------- 1. Carte scolaire ---------- */

export async function generateStudentIDCard(
  student: StudentPdfInfo,
  school: SchoolPdfInfo,
  klass?: ClassPdfInfo
) {
  // Carte format paysage CR80 agrandie (85.6 x 54 mm) sur A6
  const doc = new jsPDF({ unit: "mm", format: [90, 56], orientation: "landscape" });
  const [r, g, b] = hslToRgb(school.primary_color);

  // Fond
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, 90, 56, "F");

  // Bandeau
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 90, 12, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(school.name.toUpperCase().slice(0, 40), 4, 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("CARTE D'ÉLÈVE", 4, 9);

  // Photo
  if (student.photo_url) {
    const photo = await loadImageDataUrl(student.photo_url);
    if (photo) {
      try {
        doc.addImage(photo, "JPEG", 4, 16, 22, 28);
      } catch {
        /* ignore */
      }
    }
  } else {
    doc.setDrawColor(200);
    doc.rect(4, 16, 22, 28);
  }

  // Infos
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(fullName(student), 30, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Matricule : ${student.matricule}`, 30, 26);
  doc.text(`Né(e) le : ${fmtDate(student.date_of_birth)}`, 30, 30);
  if (klass?.name) doc.text(`Classe : ${klass.name}`, 30, 34);
  if (klass?.academic_year) doc.text(`Année : ${klass.academic_year}`, 30, 38);
  if (student.blood_type && student.blood_type !== "unknown") {
    const bt = student.blood_type
      .replace("_pos", "+")
      .replace("_neg", "-")
      .toUpperCase();
    doc.text(`Sang : ${bt}`, 30, 42);
  }

  // QR code
  try {
    const qr = await QRCode.toDataURL(`student:${student.id}|mat:${student.matricule}`, {
      margin: 0,
      width: 200,
    });
    doc.addImage(qr, "PNG", 70, 32, 16, 16);
  } catch {
    /* ignore */
  }

  // Bandeau bas
  doc.setFillColor(r, g, b);
  doc.rect(0, 52, 90, 4, "F");

  doc.save(`carte-${student.matricule}.pdf`);
}

/* ---------- 2. Certificat de scolarité ---------- */

export async function generateEnrollmentCertificate(
  student: StudentPdfInfo,
  school: SchoolPdfInfo,
  klass: ClassPdfInfo
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = await drawHeader(doc, school, "Certificat de scolarité");

  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20);

  const ref = `CS-${new Date().getFullYear()}-${student.matricule}`;
  doc.text(`Référence : ${ref}`, pageW - 20, y, { align: "right" });
  y += 14;

  doc.text("Le Directeur de l'établissement soussigné certifie que :", 20, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(fullName(student).toUpperCase(), pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = [
    `Matricule : ${student.matricule}`,
    `Né(e) le : ${fmtDate(student.date_of_birth)}${student.place_of_birth ? " à " + student.place_of_birth : ""}`,
    `Sexe : ${student.gender === "male" ? "Masculin" : student.gender === "female" ? "Féminin" : "Autre"}`,
    student.nationality ? `Nationalité : ${student.nationality}` : "",
  ].filter(Boolean);
  lines.forEach((l) => {
    doc.text(l, pageW / 2, y, { align: "center" });
    y += 6;
  });

  y += 10;
  const klassLabel =
    [klass.level_name, klass.name].filter(Boolean).join(" / ") || "—";
  const txt = `est régulièrement inscrit(e) en classe de ${klassLabel} au titre de l'année scolaire ${klass.academic_year ?? "—"} dans notre établissement.`;
  const wrapped = doc.splitTextToSize(txt, pageW - 40);
  doc.text(wrapped, 20, y);
  y += wrapped.length * 6 + 10;

  doc.text(
    "En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.",
    20,
    y,
    { maxWidth: pageW - 40 }
  );
  y += 24;

  // Lieu / date / signature
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Fait à ${school.address?.split(",").pop()?.trim() ?? "—"}, le ${today}`, pageW - 20, y, { align: "right" });
  y += 30;
  doc.setFont("helvetica", "italic");
  doc.text("Signature et cachet", pageW - 20, y, { align: "right" });

  drawFooter(doc, school);
  doc.save(`certificat-scolarite-${student.matricule}.pdf`);
}

/* ---------- 3. Certificat de transfert / radiation ---------- */

export async function generateTransferCertificate(opts: {
  student: StudentPdfInfo;
  school: SchoolPdfInfo;
  type: "outgoing" | "expulsion";
  reason: string;
  effective_date: string;
  destination_school?: string | null;
  certificate_number?: string | null;
  last_class?: string | null;
  academic_year?: string | null;
}) {
  const { student, school, type, reason, effective_date, destination_school, certificate_number, last_class, academic_year } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const title = type === "outgoing" ? "Certificat de transfert" : "Certificat de radiation";
  let y = await drawHeader(doc, school, title);
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20);

  if (certificate_number) {
    doc.text(`N° ${certificate_number}`, pageW - 20, y, { align: "right" });
    y += 12;
  }

  doc.text("Le Directeur de l'établissement soussigné atteste que :", 20, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(fullName(student).toUpperCase(), pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Matricule : ${student.matricule}`, pageW / 2, y, { align: "center" });
  y += 6;
  doc.text(`Né(e) le : ${fmtDate(student.date_of_birth)}`, pageW / 2, y, { align: "center" });
  y += 12;

  let body = "";
  if (type === "outgoing") {
    body = `a été ${last_class ? `inscrit(e) en classe de ${last_class} ` : ""}dans notre établissement${
      academic_year ? ` au titre de l'année scolaire ${academic_year}` : ""
    }, et est autorisé(e) à être transféré(e)${
      destination_school ? ` vers : ${destination_school}` : ""
    }, à compter du ${fmtDate(effective_date)}.`;
  } else {
    body = `a été radié(e) de notre établissement à compter du ${fmtDate(effective_date)}${
      last_class ? `, alors qu'il/elle était inscrit(e) en classe de ${last_class}` : ""
    }${academic_year ? ` (année scolaire ${academic_year})` : ""}.`;
  }

  const wrapped = doc.splitTextToSize(body, pageW - 40);
  doc.text(wrapped, 20, y);
  y += wrapped.length * 6 + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Motif :", 20, y);
  doc.setFont("helvetica", "normal");
  const rWrap = doc.splitTextToSize(reason, pageW - 40);
  doc.text(rWrap, 20, y + 6);
  y += rWrap.length * 6 + 16;

  doc.text(
    "Le présent certificat est délivré à l'intéressé(e) pour servir et valoir ce que de droit.",
    20,
    y,
    { maxWidth: pageW - 40 }
  );
  y += 20;

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Fait le ${today}`, pageW - 20, y, { align: "right" });
  y += 28;
  doc.setFont("helvetica", "italic");
  doc.text("Signature et cachet", pageW - 20, y, { align: "right" });

  drawFooter(doc, school);
  const fileBase = type === "outgoing" ? "transfert" : "radiation";
  doc.save(`${fileBase}-${student.matricule}.pdf`);
}

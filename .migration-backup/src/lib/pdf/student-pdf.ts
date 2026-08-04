import jsPDF from "jspdf";
import QRCode from "qrcode";

/* ============================================================
   Documents PDF — style "Moderne épuré (corporate)"
   - Carte d'élève au format CR80 (85.6 × 54 mm), 2 pages recto/verso
   - Certificats A4 avec en-tête couleur, sections sobres, QR de vérif
   ============================================================ */

export type PdfOutput = "download" | "print";

/* ---------- Types ---------- */

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
  allergies?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface ClassPdfInfo {
  name?: string | null;
  level_name?: string | null;
  academic_year?: string | null;
}

/* ---------- Helpers ---------- */

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

function hslToRgb(hsl?: string | null): [number, number, number] {
  if (!hsl) return [37, 99, 235];
  const m = hsl.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!m) return [37, 99, 235];
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
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

function lighten([r, g, b]: [number, number, number], amount = 0.85): [number, number, number] {
  return [
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  ];
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
  } catch { return null; }
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return s; }
}

function fullName(s: StudentPdfInfo) {
  return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ");
}

function bloodLabel(bt?: string | null) {
  if (!bt || bt === "unknown") return null;
  return bt.replace("_pos", "+").replace("_neg", "-").toUpperCase();
}

/* ============================================================
   A4 — En-tête / pied corporate
   ============================================================ */

async function drawA4Header(
  doc: jsPDF,
  school: SchoolPdfInfo,
  eyebrow: string,
  title: string
): Promise<number> {
  const [r, g, b] = hslToRgb(school.primary_color);
  const pageW = doc.internal.pageSize.getWidth();

  // Bande couleur fine en haut
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 6, "F");

  // Zone identité école (sobre, noir sur blanc)
  let cursorX = 20;
  if (school.logo_url) {
    const logo = await loadImageDataUrl(school.logo_url);
    if (logo) {
      try {
        doc.addImage(logo, "PNG", 20, 14, 18, 18);
        cursorX = 44;
      } catch { /* ignore */ }
    }
  }

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(school.name.toUpperCase(), cursorX, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  if (school.motto) doc.text(school.motto, cursorX, 25);
  const meta = [school.address, school.phone, school.email]
    .filter(Boolean).join("  ·  ");
  if (meta) {
    const wrapped = doc.splitTextToSize(meta, pageW - cursorX - 20);
    doc.text(wrapped, cursorX, school.motto ? 29 : 25);
  }

  // Bloc titre
  const titleY = 50;
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(eyebrow.toUpperCase(), 20, titleY, { charSpace: 1.5 });

  doc.setTextColor(15, 15, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title, 20, titleY + 9);

  // Trait de séparation
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(20, titleY + 14, pageW - 20, titleY + 14);

  return titleY + 24;
}

function drawA4Footer(doc: jsPDF, school: SchoolPdfInfo, ref?: string) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const [r, g, b] = hslToRgb(school.primary_color);

  // Trait fin
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(20, pageH - 18, pageW - 20, pageH - 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  const date = new Date().toLocaleString("fr-FR");
  const left = ref ? `Réf. ${ref}  ·  Édité le ${date}` : `Édité le ${date}`;
  doc.text(left, 20, pageH - 12);

  const right = school.website || school.email || "";
  if (right) doc.text(right, pageW - 20, pageH - 12, { align: "right" });

  // Petit point couleur côté gauche pour signature visuelle
  doc.setFillColor(r, g, b);
  doc.circle(15, pageH - 13, 1.2, "F");
}

/** Bloc info clé/valeur sur 2 colonnes */
function drawInfoGrid(
  doc: jsPDF,
  rows: Array<[string, string]>,
  x: number,
  y: number,
  width: number,
  colorRGB: [number, number, number]
): number {
  const [r, g, b] = colorRGB;
  const colW = width / 2;
  const rowH = 12;

  rows.forEach((row, i) => {
    const col = i % 2;
    const lineIdx = Math.floor(i / 2);
    const cx = x + col * colW;
    const cy = y + lineIdx * rowH;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(r, g, b);
    doc.text(row[0].toUpperCase(), cx, cy, { charSpace: 0.8 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(25, 25, 25);
    const value = row[1] || "—";
    doc.text(value, cx, cy + 5);
  });

  const rowsCount = Math.ceil(rows.length / 2);
  return y + rowsCount * rowH;
}

/* ============================================================
   1. CARTE D'ÉLÈVE — CR80 recto / verso (2 pages)
   ============================================================ */

const CARD_W = 85.6;
const CARD_H = 54;

async function drawCardRecto(
  doc: jsPDF,
  student: StudentPdfInfo,
  school: SchoolPdfInfo,
  klass?: ClassPdfInfo
) {
  const [r, g, b] = hslToRgb(school.primary_color);

  // Fond
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, CARD_W, CARD_H, "F");

  // Bandeau gauche couleur (vertical, accent corporate)
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 4, CARD_H, "F");

  // Bandeau haut clair (zone identité école)
  const [lr, lg, lb] = lighten([r, g, b], 0.92);
  doc.setFillColor(lr, lg, lb);
  doc.rect(4, 0, CARD_W - 4, 11, "F");

  // Logo + nom école
  let textX = 7;
  if (school.logo_url) {
    const logo = await loadImageDataUrl(school.logo_url);
    if (logo) {
      try { doc.addImage(logo, "PNG", 6, 1.5, 8, 8); textX = 16; } catch { /* */ }
    }
  }
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(school.name.toUpperCase().slice(0, 38), textX, 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(110, 110, 110);
  doc.text("CARTE D'ÉLÈVE", textX, 8.5);

  // Photo (cadre arrondi simulé par bordure)
  const photoX = 7, photoY = 14, photoW = 22, photoH = 28;
  if (student.photo_url) {
    const photo = await loadImageDataUrl(student.photo_url);
    if (photo) {
      try { doc.addImage(photo, "JPEG", photoX, photoY, photoW, photoH); } catch { /* */ }
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(photoX, photoY, photoW, photoH, "F");
    }
  } else {
    doc.setFillColor(245, 245, 245);
    doc.rect(photoX, photoY, photoW, photoH, "F");
  }
  // Liseré couleur sous la photo
  doc.setFillColor(r, g, b);
  doc.rect(photoX, photoY + photoH, photoW, 0.8, "F");

  // Bloc identité (droite)
  const infoX = 33;
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text("ÉLÈVE", infoX, 16, { charSpace: 0.6 });

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const nameLines = doc.splitTextToSize(fullName(student).toUpperCase(), CARD_W - infoX - 4);
  doc.text(nameLines.slice(0, 2), infoX, 20);

  // Mini grille infos
  const miniRow = (label: string, value: string, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(140, 140, 140);
    doc.text(label.toUpperCase(), infoX, y, { charSpace: 0.5 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 30, 30);
    doc.text(value, infoX, y + 3);
  };

  let yy = 28;
  miniRow("Matricule", student.matricule, yy); yy += 7;
  miniRow("Né(e) le", fmtDate(student.date_of_birth), yy); yy += 7;
  if (klass?.name) { miniRow("Classe", `${klass.name}${klass.academic_year ? "  ·  " + klass.academic_year : ""}`, yy); }

  // Bandeau bas couleur avec mention
  doc.setFillColor(r, g, b);
  doc.rect(4, CARD_H - 5, CARD_W - 4, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.text("CARTE OFFICIELLE  ·  NON CESSIBLE", 7, CARD_H - 1.8, { charSpace: 0.5 });
  if (klass?.academic_year) {
    doc.text(`ANNÉE ${klass.academic_year}`, CARD_W - 6, CARD_H - 1.8, { align: "right", charSpace: 0.5 });
  }
}

async function drawCardVerso(
  doc: jsPDF,
  student: StudentPdfInfo,
  school: SchoolPdfInfo
) {
  const [r, g, b] = hslToRgb(school.primary_color);

  // Fond
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, CARD_W, CARD_H, "F");

  // Bandeau haut très fin
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, CARD_W, 3, "F");

  // QR code (gauche)
  const qrSize = 26;
  const qrX = 6, qrY = 8;
  try {
    const qr = await QRCode.toDataURL(
      `https://verify.school/${student.id}|mat:${student.matricule}`,
      { margin: 0, width: 240 }
    );
    doc.addImage(qr, "PNG", qrX, qrY, qrSize, qrSize);
  } catch { /* */ }

  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.text("SCANNER POUR VÉRIFIER", qrX + qrSize / 2, qrY + qrSize + 2.5, { align: "center", charSpace: 0.5 });

  // Bloc infos (droite)
  const ix = 38;

  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("EN CAS D'URGENCE", ix, 8, { charSpace: 0.8 });

  const verRow = (label: string, value: string | null | undefined, y: number) => {
    if (!value) return false;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.8);
    doc.setTextColor(140, 140, 140);
    doc.text(label.toUpperCase(), ix, y, { charSpace: 0.4 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(25, 25, 25);
    const lines = doc.splitTextToSize(value, CARD_W - ix - 4);
    doc.text(lines.slice(0, 2), ix, y + 2.8);
    return true;
  };

  let yy = 13;
  if (verRow("Contact", student.emergency_contact_name, yy)) yy += 8;
  if (verRow("Téléphone", student.emergency_contact_phone, yy)) yy += 8;
  const bt = bloodLabel(student.blood_type);
  if (bt) { verRow("Sang", bt, yy); }
  if (student.allergies) {
    // Allergies en bas, pleine largeur
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.8);
    doc.setTextColor(140, 140, 140);
    doc.text("ALLERGIES", 6, 40, { charSpace: 0.4 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(180, 30, 30);
    const lines = doc.splitTextToSize(student.allergies, CARD_W - 12);
    doc.text(lines.slice(0, 2), 6, 43);
  }

  // Bandeau bas : adresse école
  doc.setFillColor(245, 245, 245);
  doc.rect(0, CARD_H - 7, CARD_W, 7, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(110, 110, 110);
  const ret = `En cas de perte, retourner à : ${school.name}${school.address ? " — " + school.address : ""}`;
  const retLines = doc.splitTextToSize(ret, CARD_W - 6);
  doc.text(retLines.slice(0, 2), 3, CARD_H - 4);
}

export async function generateStudentIDCard(
  student: StudentPdfInfo,
  school: SchoolPdfInfo,
  klass?: ClassPdfInfo,
  output: PdfOutput = "download"
) {
  const doc = new jsPDF({ unit: "mm", format: [CARD_W, CARD_H], orientation: "landscape" });
  await drawCardRecto(doc, student, school, klass);
  doc.addPage([CARD_W, CARD_H], "landscape");
  await drawCardVerso(doc, student, school);
  emit(doc, `carte-${student.matricule}.pdf`, output);
}

/* ============================================================
   2. CERTIFICAT DE SCOLARITÉ
   ============================================================ */

export async function generateEnrollmentCertificate(
  student: StudentPdfInfo,
  school: SchoolPdfInfo,
  klass: ClassPdfInfo,
  output: PdfOutput = "download"
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const [r, g, b] = hslToRgb(school.primary_color);
  const pageW = doc.internal.pageSize.getWidth();

  const ref = `CS-${new Date().getFullYear()}-${student.matricule}`;
  let y = await drawA4Header(doc, school, "Document officiel", "Certificat de scolarité");

  // Carte info élève (panneau clair)
  const [lr, lg, lb] = lighten([r, g, b], 0.94);
  doc.setFillColor(lr, lg, lb);
  doc.roundedRect(20, y, pageW - 40, 56, 2, 2, "F");

  // Nom + matricule en tête du panneau
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("ÉLÈVE", 26, y + 8, { charSpace: 1 });

  doc.setTextColor(15, 15, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(fullName(student).toUpperCase(), 26, y + 16);

  // Grille info
  drawInfoGrid(doc, [
    ["Matricule", student.matricule],
    ["Date de naissance", fmtDate(student.date_of_birth)],
    ["Lieu de naissance", student.place_of_birth || "—"],
    ["Sexe", student.gender === "male" ? "Masculin" : student.gender === "female" ? "Féminin" : "Autre"],
    ["Nationalité", student.nationality || "—"],
    ["Année scolaire", klass.academic_year || "—"],
  ], 26, y + 24, pageW - 52, [r, g, b]);

  y += 66;

  // Corps du certificat
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const klassLabel = [klass.level_name, klass.name].filter(Boolean).join(" / ") || "—";
  const body = `Le Directeur de l'établissement soussigné certifie que l'élève désigné(e) ci-dessus est régulièrement inscrit(e) en classe de ${klassLabel} au titre de l'année scolaire ${klass.academic_year ?? "—"}.`;
  const bodyLines = doc.splitTextToSize(body, pageW - 40);
  doc.text(bodyLines, 20, y);
  y += bodyLines.length * 6 + 8;

  doc.setFont("helvetica", "italic");
  doc.setTextColor(90, 90, 90);
  const note = "En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.";
  const noteLines = doc.splitTextToSize(note, pageW - 40);
  doc.text(noteLines, 20, y);
  y += noteLines.length * 6 + 20;

  // Zone signature
  const sigX = pageW - 80;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(sigX, y + 18, sigX + 60, y + 18);

  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const place = school.address?.split(",").pop()?.trim() ?? "—";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Fait à ${place}, le ${today}`, sigX, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(25, 25, 25);
  doc.text("Signature et cachet", sigX, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("La Direction", sigX, y + 28);

  // QR de vérification (bas gauche)
  try {
    const qr = await QRCode.toDataURL(
      `https://verify.school/cert/${ref}`,
      { margin: 0, width: 200 }
    );
    doc.addImage(qr, "PNG", 20, y + 4, 22, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Vérifier l'authenticité", 20, y + 30);
  } catch { /* */ }

  drawA4Footer(doc, school, ref);
  emit(doc, `certificat-scolarite-${student.matricule}.pdf`, output);
}

/* ============================================================
   3. CERTIFICAT DE TRANSFERT / RADIATION
   ============================================================ */

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
  output?: PdfOutput;
}) {
  const output = opts.output ?? "download";
  const { student, school, type, reason, effective_date, destination_school, certificate_number, last_class, academic_year } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const [r, g, b] = hslToRgb(school.primary_color);
  const pageW = doc.internal.pageSize.getWidth();

  const title = type === "outgoing" ? "Certificat de transfert" : "Certificat de radiation";
  const eyebrow = type === "outgoing" ? "Sortie · Transfert" : "Sortie · Radiation";
  const ref = certificate_number ?? `${type === "outgoing" ? "CT" : "CR"}-${new Date().getFullYear()}-${student.matricule}`;

  let y = await drawA4Header(doc, school, eyebrow, title);

  // Panneau élève
  const [lr, lg, lb] = lighten([r, g, b], 0.94);
  doc.setFillColor(lr, lg, lb);
  doc.roundedRect(20, y, pageW - 40, 44, 2, 2, "F");

  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("ÉLÈVE CONCERNÉ(E)", 26, y + 8, { charSpace: 1 });

  doc.setTextColor(15, 15, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(fullName(student).toUpperCase(), 26, y + 16);

  drawInfoGrid(doc, [
    ["Matricule", student.matricule],
    ["Date de naissance", fmtDate(student.date_of_birth)],
    ["Dernière classe", last_class || "—"],
    ["Année scolaire", academic_year || "—"],
  ], 26, y + 24, pageW - 52, [r, g, b]);

  y += 54;

  // Corps
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const intro = "Le Directeur de l'établissement soussigné atteste que l'élève désigné(e) ci-dessus :";
  doc.text(intro, 20, y);
  y += 8;

  let body: string;
  if (type === "outgoing") {
    body = `est autorisé(e) à être transféré(e)${destination_school ? ` vers l'établissement : ${destination_school}` : ""}, à compter du ${fmtDate(effective_date)}.`;
  } else {
    body = `a été radié(e) de notre établissement à compter du ${fmtDate(effective_date)}.`;
  }
  const bodyLines = doc.splitTextToSize(body, pageW - 40);
  doc.text(bodyLines, 20, y);
  y += bodyLines.length * 6 + 8;

  // Bloc motif (panneau distinct)
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(252, 252, 252);
  const motifH = Math.max(22, doc.splitTextToSize(reason, pageW - 52).length * 6 + 14);
  doc.roundedRect(20, y, pageW - 40, motifH, 2, 2, "FD");

  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("MOTIF", 26, y + 7, { charSpace: 1 });
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const reasonLines = doc.splitTextToSize(reason, pageW - 52);
  doc.text(reasonLines, 26, y + 13);
  y += motifH + 10;

  doc.setFont("helvetica", "italic");
  doc.setTextColor(90, 90, 90);
  doc.setFontSize(10);
  const note = "Le présent certificat est délivré à l'intéressé(e) pour servir et valoir ce que de droit.";
  const noteLines = doc.splitTextToSize(note, pageW - 40);
  doc.text(noteLines, 20, y);
  y += noteLines.length * 6 + 16;

  // Signature
  const sigX = pageW - 80;
  doc.setDrawColor(220, 220, 220);
  doc.line(sigX, y + 18, sigX + 60, y + 18);
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Fait le ${today}`, sigX, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(25, 25, 25);
  doc.text("Signature et cachet", sigX, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("La Direction", sigX, y + 28);

  // QR vérification
  try {
    const qr = await QRCode.toDataURL(
      `https://verify.school/cert/${ref}`,
      { margin: 0, width: 200 }
    );
    doc.addImage(qr, "PNG", 20, y + 4, 22, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Vérifier l'authenticité", 20, y + 30);
  } catch { /* */ }

  drawA4Footer(doc, school, ref);
  const fileBase = type === "outgoing" ? "transfert" : "radiation";
  emit(doc, `${fileBase}-${student.matricule}.pdf`, output);
}

/* ============================================================
   4. PACK COMPLET — Carte (recto/verso) + Scolarité + Transfert
   ============================================================ */

export async function generateAllStudentDocuments(opts: {
  student: StudentPdfInfo;
  school: SchoolPdfInfo;
  klass: ClassPdfInfo;
  lastTransfer?: {
    type: "outgoing" | "expulsion";
    reason: string;
    effective_date: string;
    destination_school?: string | null;
    certificate_number?: string | null;
  } | null;
  output?: PdfOutput;
}) {
  const { student, school, klass, lastTransfer, output = "print" } = opts;

  // Page 1 : carte recto (CR80)
  const doc = new jsPDF({ unit: "mm", format: [CARD_W, CARD_H], orientation: "landscape" });
  await drawCardRecto(doc, student, school, klass);

  // Page 2 : carte verso (CR80)
  doc.addPage([CARD_W, CARD_H], "landscape");
  await drawCardVerso(doc, student, school);

  /* ----- Pages A4 : certificat de scolarité ----- */
  doc.addPage("a4", "portrait");
  const [r, g, b] = hslToRgb(school.primary_color);
  const pageW = doc.internal.pageSize.getWidth();

  let y = await drawA4Header(doc, school, "Document officiel", "Certificat de scolarité");

  const [lr, lg, lb] = lighten([r, g, b], 0.94);
  doc.setFillColor(lr, lg, lb);
  doc.roundedRect(20, y, pageW - 40, 56, 2, 2, "F");
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.text("ÉLÈVE", 26, y + 8, { charSpace: 1 });
  doc.setTextColor(15, 15, 15);
  doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text(fullName(student).toUpperCase(), 26, y + 16);
  drawInfoGrid(doc, [
    ["Matricule", student.matricule],
    ["Date de naissance", fmtDate(student.date_of_birth)],
    ["Lieu de naissance", student.place_of_birth || "—"],
    ["Sexe", student.gender === "male" ? "Masculin" : student.gender === "female" ? "Féminin" : "Autre"],
    ["Nationalité", student.nationality || "—"],
    ["Année scolaire", klass.academic_year || "—"],
  ], 26, y + 24, pageW - 52, [r, g, b]);
  y += 66;

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  const klassLabel = [klass.level_name, klass.name].filter(Boolean).join(" / ") || "—";
  const body = `Le Directeur de l'établissement soussigné certifie que l'élève désigné(e) ci-dessus est régulièrement inscrit(e) en classe de ${klassLabel} au titre de l'année scolaire ${klass.academic_year ?? "—"}.`;
  const bodyLines = doc.splitTextToSize(body, pageW - 40);
  doc.text(bodyLines, 20, y);
  y += bodyLines.length * 6 + 20;

  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const sigX = pageW - 80;
  doc.setDrawColor(220, 220, 220);
  doc.line(sigX, y + 18, sigX + 60, y + 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Fait le ${today}`, sigX, y + 8);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.setTextColor(25, 25, 25);
  doc.text("Signature et cachet", sigX, y + 24);

  drawA4Footer(doc, school, `CS-${new Date().getFullYear()}-${student.matricule}`);

  /* ----- Page A4 (optionnelle) : transfert / radiation ----- */
  if (lastTransfer) {
    doc.addPage("a4", "portrait");
    const title = lastTransfer.type === "outgoing" ? "Certificat de transfert" : "Certificat de radiation";
    const eyebrow = lastTransfer.type === "outgoing" ? "Sortie · Transfert" : "Sortie · Radiation";
    const ref = lastTransfer.certificate_number ?? `${lastTransfer.type === "outgoing" ? "CT" : "CR"}-${new Date().getFullYear()}-${student.matricule}`;
    let y2 = await drawA4Header(doc, school, eyebrow, title);

    doc.setFillColor(lr, lg, lb);
    doc.roundedRect(20, y2, pageW - 40, 36, 2, 2, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text("ÉLÈVE CONCERNÉ(E)", 26, y2 + 8, { charSpace: 1 });
    doc.setTextColor(15, 15, 15);
    doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text(fullName(student).toUpperCase(), 26, y2 + 16);
    drawInfoGrid(doc, [
      ["Matricule", student.matricule],
      ["Date de naissance", fmtDate(student.date_of_birth)],
    ], 26, y2 + 24, pageW - 52, [r, g, b]);
    y2 += 46;

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const txt = lastTransfer.type === "outgoing"
      ? `est autorisé(e) à être transféré(e)${lastTransfer.destination_school ? ` vers : ${lastTransfer.destination_school}` : ""}, à compter du ${fmtDate(lastTransfer.effective_date)}.`
      : `a été radié(e) de notre établissement à compter du ${fmtDate(lastTransfer.effective_date)}.`;
    const tl = doc.splitTextToSize(txt, pageW - 40);
    doc.text(tl, 20, y2);
    y2 += tl.length * 6 + 8;

    const motifH = Math.max(22, doc.splitTextToSize(lastTransfer.reason, pageW - 52).length * 6 + 14);
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(20, y2, pageW - 40, motifH, 2, 2, "FD");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text("MOTIF", 26, y2 + 7, { charSpace: 1 });
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const rl = doc.splitTextToSize(lastTransfer.reason, pageW - 52);
    doc.text(rl, 26, y2 + 13);
    y2 += motifH + 16;

    doc.setDrawColor(220, 220, 220);
    doc.line(sigX, y2 + 18, sigX + 60, y2 + 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`Fait le ${today}`, sigX, y2 + 8);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.setTextColor(25, 25, 25);
    doc.text("Signature et cachet", sigX, y2 + 24);

    drawA4Footer(doc, school, ref);
  }

  emit(doc, `dossier-${student.matricule}.pdf`, output);
}

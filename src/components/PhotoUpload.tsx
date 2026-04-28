import { useRef, useState } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadStudentPhoto } from "@/hooks/useStudents";
import { toast } from "sonner";

interface Props {
  schoolId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  fallback?: string;
}

export function PhotoUpload({ schoolId, value, onChange, fallback = "?" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez choisir une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadStudentPhoto(file, schoolId);
      onChange(url);
      toast.success("Photo téléversée");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du téléversement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className="h-32 w-32 ring-4 ring-background shadow-lg">
          {value && <AvatarImage src={value} alt="Photo" />}
          <AvatarFallback className="bg-gradient-primary text-3xl font-display font-bold text-primary-foreground">
            {fallback.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-foreground/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
          aria-label="Changer la photo"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-background animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-background" />
          )}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition"
            aria-label="Supprimer la photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="h-3.5 w-3.5" />
        {value ? "Changer" : "Ajouter une photo"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

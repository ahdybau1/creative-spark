import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-base" },
  md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
  lg: { box: "h-12 w-12", icon: "h-6 w-6", text: "text-xl" },
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-primary shadow-glow",
          s.box
        )}
      >
        <GraduationCap className={cn("text-primary-foreground", s.icon)} strokeWidth={2.5} />
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-display font-bold tracking-tight", s.text)}>
            EduMaster
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Pro
          </span>
        </div>
      )}
    </div>
  );
}

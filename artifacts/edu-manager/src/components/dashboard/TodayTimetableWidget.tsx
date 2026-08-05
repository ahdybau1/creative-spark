import { Clock, MapPin, User } from "lucide-react";
import { useTodayTimetableForTeacher, useTodayTimetableForStudent, todayWeekday } from "@/hooks/useDashboardData";
import { useCurrentSchool } from "@/hooks/useSchool";
import { useMyStudent, useCurrentEnrollment } from "@/hooks/useMyStudent";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_FR: Record<string, string> = {
  monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi",
  thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche",
};

function SlotRow({ slot, showClass }: { slot: any; showClass?: boolean }) {
  const color = slot.subject?.color ?? "#3b82f6";
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: color, minHeight: 36 }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{slot.subject?.name ?? "—"}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
          </span>
          {slot.room && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {slot.room}
            </span>
          )}
          {showClass && slot.class?.name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {slot.class.name}
            </span>
          )}
          {slot.teacher?.full_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {slot.teacher.full_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TeacherTimetableWidget() {
  const { data: school } = useCurrentSchool();
  const { data: slots, isLoading } = useTodayTimetableForTeacher(school?.id);
  const day = todayWeekday();

  if (isLoading) return <TimetableSkeleton />;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
        {DAY_FR[day]} · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
      </p>
      {!slots || slots.length === 0 ? (
        <EmptyDay />
      ) : (
        <div>{slots.map((s: any) => <SlotRow key={s.id} slot={s} showClass />)}</div>
      )}
    </div>
  );
}

export function StudentTimetableWidget() {
  const { data: myStudent } = useMyStudent();
  const { data: enrollment } = useCurrentEnrollment(myStudent?.id);
  const { data: school } = useCurrentSchool();
  const { data: slots, isLoading } = useTodayTimetableForStudent(
    (enrollment as any)?.class_id,
    school?.id
  );
  const day = todayWeekday();

  if (isLoading || !enrollment) return <TimetableSkeleton />;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
        {DAY_FR[day]} · Classe {(enrollment as any)?.classes?.name ?? "—"}
      </p>
      {!slots || slots.length === 0 ? (
        <EmptyDay />
      ) : (
        <div>{slots.map((s: any) => <SlotRow key={s.id} slot={s} />)}</div>
      )}
    </div>
  );
}

function EmptyDay() {
  return (
    <p className="text-sm text-muted-foreground text-center py-4">
      Aucun cours planifié aujourd'hui 🎉
    </p>
  );
}

function TimetableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton className="w-1 h-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

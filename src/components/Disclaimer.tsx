import { Info } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Disclaimer({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <p
      className={`flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground ${className}`}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <span>{t("common.disclaimer")}</span>
    </p>
  );
}

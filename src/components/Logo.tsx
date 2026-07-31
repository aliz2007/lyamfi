import logo from "@/assets/lyamfi-logo.png.asset.json";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo.url}
        alt="Logo Lyamfi"
        className="h-9 w-9 shrink-0 rounded-lg object-cover"
      />
      <span className="text-lg font-semibold tracking-tight">Lyamfi</span>
    </span>
  );
}

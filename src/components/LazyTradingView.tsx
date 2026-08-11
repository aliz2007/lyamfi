import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Ne monte son contenu (widget TradingView) qu'une fois la carte visible à l'écran :
 * évite de charger des dizaines d'iframes simultanément sur la page Bourse.
 */
export function LazyTradingView({
  className,
  children,
  placeholder,
}: {
  className?: string;
  children: ReactNode;
  placeholder?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : (placeholder ?? <div className="h-full w-full animate-pulse rounded-xl bg-muted/30" />)}
    </div>
  );
}

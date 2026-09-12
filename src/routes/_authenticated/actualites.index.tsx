import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Newspaper, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteInsight, newsFeedQuery, saveInsight, SOURCE_LABEL } from "@/lib/newsfeed";
import { MacroBanner } from "@/components/MacroBanner";
import { NewsCard } from "@/components/NewsCard";
import { NewsInsightEditor } from "@/components/NewsInsightEditor";
import { myRoleQuery } from "@/lib/admin";
import { useFormat } from "@/lib/format";
import { useI18n, usePageTitle } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/actualites/")({
  head: () => ({
    meta: [
      { title: "Actualités de la Bourse de Casablanca | Lyamfi" },
      {
        name: "description",
        content:
          "Le fil Boursenews, Le Boursier (Medias24) et AlphaBourse suivi par Lyamfi : l'actualité de la Bourse de Casablanca, traduite en trois langues et rangée par mots-clés.",
      },
      { property: "og:title", content: "Actualités | Lyamfi" },
      { property: "og:description", content: "Le fil d'actualité boursière de Lyamfi." },
    ],
  }),
  component: NewsPage,
});

/**
 * Le fil multi-sources (Boursenews, Le Boursier — Medias24, AlphaBourse),
 * moissonné côté serveur, mis en cache en base et traduit à la volée. La
 * publication manuelle d'articles a disparu : Lyamfi n'écrit plus que le
 * commentaire de rédaction (« l'œil »), par carte, réservé aux
 * administrateurs. Chaque carte porte ses mots-clés (≤6), qui mènent aux
 * pages par mot-clé.
 */
function NewsPage() {
  const { t, lang } = useI18n();
  const f = useFormat();
  usePageTitle("news.title");

  const qc = useQueryClient();
  const { data: role } = useQuery(myRoleQuery);
  const isAdmin = role === "admin";
  const { data: feed, isLoading, error } = useQuery(newsFeedQuery(lang));
  // Références stables pour le filtrage : sans useMemo, `?? []` recréerait
  // un tableau à chaque rendu et relancerait le filtre en boucle.
  const items = useMemo(() => feed?.items ?? [], [feed]);
  const failedSources = feed?.failedSources ?? [];

  const [search, setSearch] = useState("");
  /** Guid de la carte dont le panneau d'insight est ouvert, null sinon. */
  const [editingInsight, setEditingInsight] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["bnews-feed"] });

  const save = useMutation({
    mutationFn: (v: { guid: string; body: string }) => saveInsight(v.guid, v.body, lang),
    onSuccess: () => {
      toast.success(t("newsfeed.insightSaved"));
      setEditingInsight(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeInsight = useMutation({
    mutationFn: (guid: string) => deleteInsight(guid),
    onSuccess: () => {
      toast.success(t("newsfeed.insightDeleted"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Filtrage sur les titres, à la frappe. Aucun aller-retour réseau. */
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) => i.title.toLowerCase().includes(needle));
  }, [items, search]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* La macroéconomie avant la cote : ce qui cadre l'actualité passe en
          tête, au-dessus même de la recherche. */}
      <MacroBanner />

      <header className="rise">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-[var(--brand-yellow)]" />
          <h1 className="text-3xl font-bold sm:text-4xl">{t("news.title")}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("news.intro")}
        </p>
      </header>

      <div className="relative">
        <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("news.searchPlaceholder")}
          aria-label={t("news.searchPlaceholder")}
          className="w-full rounded-xl border border-input bg-card py-3 ps-11 pe-4 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* Une source injoignable (challenge, panne) ne casse pas le fil : une
          ligne discrète le signale, les autres sources continuent. */}
      {failedSources.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {failedSources
            .map((s) =>
              t("newsfeed.sourceDown", {
                source: SOURCE_LABEL[s as keyof typeof SOURCE_LABEL] ?? s,
              }),
            )
            .join(" ")}
        </p>
      )}

      {error ? (
        <div className="glass p-8 text-center">
          <p className="text-sm text-destructive">{t("newsfeed.fetchError")}</p>
        </div>
      ) : isLoading ? (
        <FeedSkeleton label={t("newsfeed.loadingFeed")} />
      ) : items.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-sm font-medium">{t("newsfeed.empty")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("news.noMatch", { q: search.trim() })}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <NewsCard
              key={item.guid}
              item={item}
              t={t}
              f={f}
              adminSlot={
                isAdmin ? (
                  <>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      <button
                        onClick={() =>
                          setEditingInsight(editingInsight === item.guid ? null : item.guid)
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3.5 py-1.5 text-xs text-brand-yellow transition-colors hover:bg-accent"
                      >
                        {item.insight ? (
                          <Pencil className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {t(item.insight ? "newsfeed.insightEdit" : "newsfeed.insightAdd")}
                      </button>
                      {item.insight && (
                        <button
                          onClick={() => {
                            // La suppression touche tous les membres :
                            // confirmation explicite, comme partout où
                            // l'action est irréversible.
                            if (window.confirm(t("newsfeed.insightDeleteConfirm"))) {
                              removeInsight.mutate(item.guid);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 px-3.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> {t("newsfeed.insightDelete")}
                        </button>
                      )}
                    </div>
                    {editingInsight === item.guid && (
                      <div className="mt-3">
                        <NewsInsightEditor
                          initialBody={item.insight?.body ?? ""}
                          pending={save.isPending && save.variables?.guid === item.guid}
                          onSave={(body) => save.mutate({ guid: item.guid, body })}
                          onCancel={() => setEditingInsight(null)}
                        />
                      </div>
                    )}
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- squelettes */

/** Cartes fantômes pendant le premier chargement du fil. */
function FeedSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="surface-raised animate-pulse overflow-hidden">
            <div className="h-40 bg-accent/60" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 rounded-full bg-accent/60" />
              <div className="h-4 w-full rounded-full bg-accent/60" />
              <div className="h-4 w-3/4 rounded-full bg-accent/60" />
              <div className="h-3 w-full rounded-full bg-accent/40" />
              <div className="h-3 w-5/6 rounded-full bg-accent/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Newspaper, Pencil, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createNews,
  deleteNews,
  MAX_IMAGE_BYTES,
  NewsUploadError,
  newsQuery,
  toDayInput,
  updateNews,
  uploadNewsImage,
  type NewsDraft,
  type NewsPost,
} from "@/lib/news";
import { plainExcerpt } from "@/lib/excerpt";
import { MacroBanner } from "@/components/MacroBanner";
import { myRoleQuery } from "@/lib/admin";
import { useFormat, type Formatter } from "@/lib/format";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/actualites/")({
  head: () => ({
    meta: [
      { title: "Actualités de la Bourse de Casablanca | Lyamfi" },
      {
        name: "description",
        content:
          "Les actualités de la Bourse de Casablanca publiées par Lyamfi : résultats, opérations et mouvements de la cote.",
      },
      { property: "og:title", content: "Actualités | Lyamfi" },
      { property: "og:description", content: "Le fil d'actualité boursière de Lyamfi." },
    ],
  }),
  component: NewsPage,
});

const emptyDraft = (): NewsDraft => ({
  title: "",
  body: "",
  imageUrl: "",
  // Une publication est datée du jour, sauf décision contraire du rédacteur.
  publishedAt: new Date().toISOString().slice(0, 10),
});

function NewsPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("news.title");

  const qc = useQueryClient();
  const { data: role } = useQuery(myRoleQuery);
  const isAdmin = role === "admin";
  const { data: posts = [], isLoading, error } = useQuery(newsQuery);

  const [search, setSearch] = useState("");
  /** `null` : le formulaire publie. Sinon il corrige l'article de cet identifiant. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsDraft>(emptyDraft);
  const formRef = useRef<HTMLDivElement>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["news"] });
  const reset = () => {
    setEditing(null);
    setDraft(emptyDraft());
  };

  const publish = useMutation({
    mutationFn: (v: NewsDraft) => createNews(v),
    onSuccess: () => {
      toast.success(t("news.published"));
      reset();
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: (v: { id: string; draft: NewsDraft }) => updateNews(v.id, v.draft),
    onSuccess: () => {
      toast.success(t("news.updated"));
      reset();
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: (_d, id) => {
      toast.success(t("news.deleted"));
      if (editing === id) reset();
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (post: NewsPost) => {
    setEditing(post.id);
    setDraft({
      title: post.title,
      body: post.body,
      imageUrl: post.imageUrl ?? "",
      publishedAt: toDayInput(post.publishedAt),
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Filtrage sur les titres, à la frappe. Aucun aller-retour réseau. */
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((p) => p.title.toLowerCase().includes(needle));
  }, [posts, search]);

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
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("news.searchPlaceholder")}
          aria-label={t("news.searchPlaceholder")}
          className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {isAdmin && (
        <div ref={formRef}>
          <Editor
            t={t}
            draft={draft}
            editing={editing !== null}
            pending={publish.isPending || save.isPending}
            onChange={setDraft}
            onCancel={reset}
            onSubmit={() => (editing ? save.mutate({ id: editing, draft }) : publish.mutate(draft))}
          />
        </div>
      )}

      {error && (
        <p className="glass p-5 text-sm text-destructive">
          {t("news.error", { reason: (error as Error).message })}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("news.loading")}</p>
      ) : posts.length === 0 ? (
        <div className="glass space-y-2 p-8 text-center">
          <p className="text-sm font-medium">{t("news.empty")}</p>
          <p className="text-xs text-muted-foreground">
            {t(isAdmin ? "news.emptyAdmin" : "news.emptyHint")}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("news.noMatch", { q: search.trim() })}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <ArticleCard
              key={post.id}
              post={post}
              t={t}
              f={f}
              isAdmin={isAdmin}
              editing={editing === post.id}
              onEdit={() => startEdit(post)}
              onDelete={() => remove.mutate(post.id)}
              deleting={remove.isPending && remove.variables === post.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- vignette */

/**
 * Vignette horizontale : image à gauche, texte à droite, empilé sur mobile.
 *
 * La carte entière mène à l'article. Les commandes d'administration sont donc
 * posées HORS du lien : imbriquer un bouton dans une ancre produit un balisage
 * invalide, et cliquer « Supprimer » ouvrirait l'article au passage.
 */
function ArticleCard({
  post,
  t,
  f,
  isAdmin,
  editing,
  onEdit,
  onDelete,
  deleting,
}: {
  post: NewsPost;
  t: Translate;
  f: Formatter;
  isAdmin: boolean;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const excerpt = useMemo(() => plainExcerpt(post.body), [post.body]);

  return (
    <article
      className={`surface-raised card-hover group overflow-hidden ${
        editing ? "border-primary/60 ring-1 ring-primary/30" : ""
      }`}
    >
      <Link
        to="/actualites/$id"
        params={{ id: post.id }}
        className="grid gap-0 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[oklch(0.22_0.006_90)] sm:aspect-[4/3]">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="grid h-full w-full place-items-center">
              <Newspaper className="h-8 w-8 text-muted-foreground/40" />
            </span>
          )}
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <h2 className="text-lg font-bold leading-snug transition-colors group-hover:text-brand-yellow sm:text-xl">
            {post.title}
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {f.weekdayDate(post.publishedAt)} · Lyamfi
          </p>
          {/* Trois lignes, coupées par le CSS : l'article entier se lit sur sa
              page, pas dans le flux. */}
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
          <span className="mt-4 inline-block text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {t("news.readMore")} →
          </span>
        </div>
      </Link>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-5 py-3 sm:px-6">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3.5 py-1.5 text-xs text-brand-yellow transition-colors hover:bg-accent"
          >
            <Pencil className="h-3.5 w-3.5" /> {t("news.edit")}
          </button>
          {confirming ? (
            <>
              <button
                disabled={deleting}
                onClick={onDelete}
                className="rounded-full bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {deleting ? t("news.deleting") : t("news.deleteConfirm")}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground"
              >
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 px-3.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t("news.delete")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

/* --------------------------------------------------------------- éditeur */

function Editor({
  t,
  draft,
  editing,
  pending,
  onChange,
  onCancel,
  onSubmit,
}: {
  t: Translate;
  draft: NewsDraft;
  editing: boolean;
  pending: boolean;
  onChange: (d: NewsDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof NewsDraft>(key: K, value: NewsDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const ready = draft.title.trim().length > 0 && draft.body.trim().length > 0;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      set("imageUrl", await uploadNewsImage(file));
      toast.success(t("news.uploadDone"));
    } catch (e) {
      const kind = e instanceof NewsUploadError ? e.kind : "other";
      const key: Key = (
        {
          type: "news.uploadType",
          size: "news.uploadSize",
          bucket: "news.uploadNoBucket",
          denied: "news.uploadDenied",
          other: "news.uploadFailed",
        } as const
      )[kind];
      toast.error(t(key, { mb: Math.round(MAX_IMAGE_BYTES / 1024 / 1024) }));
    } finally {
      setUploading(false);
      // Le même fichier doit pouvoir être resélectionné après un échec.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const field =
    "w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <section className="surface-raised p-5 sm:p-7">
      <h2 className="text-sm font-semibold">{t(editing ? "news.formEdit" : "news.formNew")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("news.formHint")}</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="news-image">
            {t("news.fieldImage")}
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              id="news-image"
              value={draft.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://…"
              inputMode="url"
              maxLength={2000}
              className={`min-w-0 flex-1 ${field}`}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-4 py-2.5 text-xs text-brand-yellow transition-colors hover:bg-accent disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? t("news.uploading") : t("news.upload")}
            </button>
          </div>
          {draft.imageUrl ? (
            <div className="mt-3 flex items-start gap-3">
              <img
                src={draft.imageUrl}
                alt=""
                className="h-20 w-32 shrink-0 rounded-lg border border-border object-cover"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              <button
                type="button"
                onClick={() => set("imageUrl", "")}
                className="press -mx-2 inline-flex min-h-9 items-center px-2 text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
              >
                {t("news.removeImage")}
              </button>
            </div>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5" /> {t("news.imageOptional")}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="news-title">
              {t("news.fieldTitle")}
            </label>
            <input
              id="news-title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={200}
              placeholder={t("news.titlePlaceholder")}
              className={`mt-1.5 ${field}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="news-date">
              {t("news.fieldDate")}
            </label>
            <input
              id="news-date"
              type="date"
              value={draft.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
              className={`mt-1.5 ${field}`}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="news-body">
            {t("news.fieldBody")}
          </label>
          <textarea
            id="news-body"
            value={draft.body}
            onChange={(e) => set("body", e.target.value)}
            rows={10}
            maxLength={20000}
            placeholder={t("news.bodyPlaceholder")}
            className={`mt-1.5 resize-y leading-relaxed ${field}`}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!ready || pending || uploading}
          onClick={onSubmit}
          className="rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? t("common.saving") : t(editing ? "news.save" : "news.publish")}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </section>
  );
}

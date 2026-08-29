import { Fragment, useMemo } from "react";

/**
 * Rendu du corps d'un article.
 *
 * Même principe que `LessonContent`, avec deux ajouts que la rédaction
 * d'actualités réclame : les séparateurs horizontaux (`---`) et les listes
 * numérotées. Le sous-ensemble reste volontairement étroit, et surtout il est
 * rendu en éléments React : jamais `dangerouslySetInnerHTML`. Un article est
 * écrit par un administrateur, mais un compte administrateur compromis ne doit
 * pas pouvoir injecter de script dans le navigateur de tous les membres.
 *
 * Syntaxe reconnue :
 *   `## Titre`   sous-titre
 *   `- élément`  liste à puces
 *   `1. élément` liste numérotée
 *   `---`        séparateur
 *   `**gras**`   emphase
 */

type Block =
  | { kind: "heading"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "numbers"; items: string[] }
  | { kind: "rule" }
  | { kind: "para"; text: string };

function parse(content: string): Block[] {
  const blocks: Block[] = [];
  let bullets: string[] = [];
  let numbers: string[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push({ kind: "bullets", items: bullets });
      bullets = [];
    }
    if (numbers.length) {
      blocks.push({ kind: "numbers", items: numbers });
      numbers = [];
    }
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^-{3,}$|^\*{3,}$/.test(line)) {
      flush();
      blocks.push({ kind: "rule" });
      continue;
    }
    if (line.startsWith("## ") || line.startsWith("### ")) {
      flush();
      blocks.push({ kind: "heading", text: line.replace(/^#{2,3}\s+/, "") });
      continue;
    }
    const numbered = /^(\d{1,2})[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      if (bullets.length) flush();
      numbers.push(numbered[2]!.trim());
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (numbers.length) flush();
      bullets.push(line.slice(2).trim());
      continue;
    }
    flush();
    const previous = blocks[blocks.length - 1];
    // Une ligne isolée qui suit un paragraphe le continue : les rédacteurs
    // séparent leurs blocs par une ligne vide, pas au milieu d'une phrase.
    if (previous?.kind === "para") previous.text += " " + line;
    else blocks.push({ kind: "para", text: line });
  }
  flush();
  return blocks;
}

/** Rend **gras** sans passer par dangerouslySetInnerHTML. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

const ITEM = "flex gap-3 leading-relaxed text-[oklch(0.86_0.006_90)]";

export function ArticleBody({ content }: { content: string }) {
  const blocks = useMemo(() => parse(content), [content]);

  return (
    <div className="space-y-5 text-[15px]">
      {blocks.map((block, i) => {
        if (block.kind === "rule") {
          return <hr key={i} className="hairline my-8 border-0" />;
        }
        if (block.kind === "heading") {
          return (
            <h2 key={i} className="pt-4 text-xl font-semibold text-foreground first:pt-0">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "bullets") {
          return (
            <ul key={i} className="space-y-2.5">
              {block.items.map((item, j) => (
                <li key={j} className={ITEM}>
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span>
                    <RichText text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "numbers") {
          return (
            <ol key={i} className="space-y-2.5">
              {block.items.map((item, j) => (
                <li key={j} className={ITEM}>
                  <span
                    aria-hidden="true"
                    className="shrink-0 tabular-nums font-semibold text-primary"
                  >
                    {j + 1}.
                  </span>
                  <span>
                    <RichText text={item} />
                  </span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="leading-relaxed text-[oklch(0.86_0.006_90)]">
            <RichText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

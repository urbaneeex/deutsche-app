"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import DonutChart from "@/components/DonutChart";
import {
  getGrammarReview,
  getVocabReview,
  type GrammarCategoryStats,
  type GrammarReview,
  type VocabCategoryStats,
  type VocabReview,
} from "@/lib/data/review";
import {
  MASTERY_META,
  STARTED_LEVELS,
  type MasteryLevel,
} from "@/lib/mastery";

type Tab = "grammar" | "vocab";

const ARTICLE_CLASS: Record<string, string> = {
  der: "text-sky-400",
  die: "text-rose-400",
  das: "text-emerald-400",
};

function MasteryPill({ mastery }: { mastery: MasteryLevel }) {
  const meta = MASTERY_META[mastery];
  return (
    <span className={`flex items-center gap-1.5 text-xs ${meta.textClass}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

function MasteryLegend({ counts }: { counts: Record<MasteryLevel, number> }) {
  return (
    <ul className="space-y-2">
      {STARTED_LEVELS.map((level) => (
        <li key={level} className="flex items-center justify-between text-sm">
          <MasteryPill mastery={level} />
          <span className="font-semibold text-stone-300">{counts[level]}</span>
        </li>
      ))}
    </ul>
  );
}

function StatsHeader({
  title,
  learned,
  toLearn,
  masteryCounts,
  practiceHref,
}: {
  title: string;
  learned: number;
  toLearn: number;
  masteryCounts: Record<MasteryLevel, number>;
  practiceHref: string;
}) {
  const donutSegments = STARTED_LEVELS.map((level) => ({
    value: masteryCounts[level],
    colorClass: MASTERY_META[level].strokeClass,
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
        <p className="text-3xl font-bold">{learned}</p>
        <p className="text-sm text-stone-400">
          {title} aprendidos ·{" "}
          <span className="text-stone-500">{toLearn} por aprender</span>
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Progresa más rápido practicando a diario.
        </p>
        <Link
          href={practiceHref}
          className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400"
        >
          Practicar ahora
        </Link>
      </div>

      <div className="flex items-center gap-5 rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
        <DonutChart
          segments={donutSegments}
          centerLabel={String(learned)}
          centerSubLabel="aprendidos"
        />
        <div className="flex-1">
          <p className="mb-2 text-sm font-semibold text-stone-300">
            Dominio de {title.toLowerCase()}
          </p>
          <MasteryLegend counts={masteryCounts} />
        </div>
      </div>
    </div>
  );
}

function GrammarCategoryRow({ category }: { category: GrammarCategoryStats }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-semibold">{category.topic}</p>
          <p className="text-xs text-stone-500">
            {category.lessons.length}{" "}
            {category.lessons.length === 1 ? "lección" : "lecciones"}
          </p>
        </div>
        <span className={`text-stone-500 transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="space-y-1 border-t border-stone-800 p-2">
          {category.lessons.map(({ lesson, mastery }) => (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.slug}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-stone-800/60"
            >
              <span>
                {lesson.title}{" "}
                <span className="text-xs text-stone-500">· {lesson.level}</span>
              </span>
              <MasteryPill mastery={mastery} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function VocabCategoryRow({ category }: { category: VocabCategoryStats }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-semibold">{category.deck.title}</p>
          <p className="text-xs text-stone-500">
            {category.cards.length}{" "}
            {category.cards.length === 1 ? "palabra" : "palabras"} · {category.deck.level}
          </p>
        </div>
        <span className={`text-stone-500 transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="space-y-1 border-t border-stone-800 p-2">
          {category.cards.map(({ card, mastery }) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
            >
              <span>
                {card.article && (
                  <span className={`mr-1 ${ARTICLE_CLASS[card.article]}`}>
                    {card.article}
                  </span>
                )}
                {card.word}{" "}
                <span className="text-xs text-stone-500">· {card.translation}</span>
              </span>
              <MasteryPill mastery={mastery} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("grammar");
  const [grammar, setGrammar] = useState<GrammarReview | null>(null);
  const [vocab, setVocab] = useState<VocabReview | null>(null);

  useEffect(() => {
    if (!user) return;
    getGrammarReview(user.id).then(setGrammar);
    getVocabReview(user.id).then(setVocab);
  }, [user]);

  const grammarLearned = useMemo(() => {
    if (!grammar) return 0;
    return grammar.totalLessons - grammar.masteryCounts.sin_empezar;
  }, [grammar]);

  const vocabLearned = useMemo(() => {
    if (!vocab) return 0;
    return vocab.totalCards - vocab.masteryCounts.sin_empezar;
  }, [vocab]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revisión</h1>
        <p className="text-stone-400">
          Tu dominio real del alemán: lo que ya controlas y lo que necesita repaso.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-stone-800 bg-stone-900/50 p-1 text-sm">
        <button
          onClick={() => setTab("grammar")}
          className={`flex-1 rounded-lg py-2 font-semibold transition ${
            tab === "grammar" ? "bg-amber-500 text-stone-950" : "text-stone-400"
          }`}
        >
          Gramática
        </button>
        <button
          onClick={() => setTab("vocab")}
          className={`flex-1 rounded-lg py-2 font-semibold transition ${
            tab === "vocab" ? "bg-amber-500 text-stone-950" : "text-stone-400"
          }`}
        >
          Vocabulario
        </button>
      </div>

      {tab === "grammar" && (
        <div className="space-y-6">
          {!grammar ? (
            <p className="text-sm text-stone-500">Cargando estadísticas...</p>
          ) : grammar.totalLessons === 0 ? (
            <p className="text-sm text-stone-500">
              No hay lecciones cargadas todavía. Ejecuta{" "}
              <code className="rounded bg-stone-800 px-1">npm run db:seed</code>.
            </p>
          ) : (
            <>
              <StatsHeader
                title="Temas"
                learned={grammarLearned}
                toLearn={grammar.masteryCounts.sin_empezar}
                masteryCounts={grammar.masteryCounts}
                practiceHref="/lessons"
              />
              <div>
                <p className="mb-3 text-sm text-stone-500">
                  Todas las categorías · {grammar.categories.length}
                </p>
                <div className="space-y-2">
                  {grammar.categories.map((c) => (
                    <GrammarCategoryRow key={c.topic} category={c} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "vocab" && (
        <div className="space-y-6">
          {!vocab ? (
            <p className="text-sm text-stone-500">Cargando estadísticas...</p>
          ) : vocab.totalCards === 0 ? (
            <p className="text-sm text-stone-500">
              No hay tarjetas cargadas todavía. Ejecuta{" "}
              <code className="rounded bg-stone-800 px-1">npm run db:seed</code>.
            </p>
          ) : (
            <>
              <StatsHeader
                title="Palabras"
                learned={vocabLearned}
                toLearn={vocab.masteryCounts.sin_empezar}
                masteryCounts={vocab.masteryCounts}
                practiceHref="/flashcards"
              />
              <div>
                <p className="mb-3 text-sm text-stone-500">
                  Todas las categorías · {vocab.categories.length}
                </p>
                <div className="space-y-2">
                  {vocab.categories.map((c) => (
                    <VocabCategoryRow key={c.deck.id} category={c} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <RequireAuth>
      <ReviewContent />
    </RequireAuth>
  );
}

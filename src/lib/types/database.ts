export type Article = "der" | "die" | "das" | null;
export type ContentSource = "seed" | "ai";
export type DeckCategory = "grammar" | "vocab" | "situation";

export type Deck = {
  id: string;
  slug: string;
  level: string;
  category: DeckCategory;
  topic: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  source: ContentSource;
  created_at: string;
};

export type Card = {
  id: string;
  deck_id: string;
  word: string;
  article: Article;
  gender: string | null;
  translation: string;
  example_sentence: string | null;
  example_translation: string | null;
  tags: string[] | null;
  sort_order: number;
  created_at: string;
};

export type SrsState = {
  id: string;
  user_id: string;
  card_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
};

export type GrammarLessonContent = {
  sections: { heading: string; body: string }[];
  exercises: GrammarExercise[];
};

export type GrammarExercise = {
  prompt: string;
  choices?: string[];
  answer: string;
  explanation?: string;
};

export type GrammarLesson = {
  id: string;
  slug: string;
  level: string;
  title: string;
  topic: string;
  content: GrammarLessonContent;
  sort_order: number;
  created_at: string;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
  score: number;
  attempts: number;
};

export type PathStepContent = {
  sections: { heading: string; body: string }[];
  exercises: GrammarExercise[];
};

export type PathStepType = "lesson" | "exam";

export type PathStep = {
  id: string;
  slug: string;
  level: string;
  sort_order: number;
  title: string;
  topic: string;
  deck_id: string | null;
  content: PathStepContent;
  step_type: PathStepType;
  created_at: string;
};

export type PathProgress = {
  id: string;
  user_id: string;
  step_id: string;
  completed_at: string;
  score: number;
  attempts: number;
};

export type DialogueOption = {
  text_de: string;
  next: number;
};

export type DialogueStep = {
  speaker: string;
  text_de: string;
  text_es: string;
  options?: DialogueOption[];
};

export type Situation = {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
  dialogue: DialogueStep[];
  source: ContentSource;
  created_at: string;
};

export type PronunciationAttempt = {
  id: string;
  user_id: string;
  phrase: string;
  transcript: string | null;
  is_match: boolean | null;
  audio_path: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
};

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      decks: TableDef<Deck>;
      cards: TableDef<Card>;
      srs_state: TableDef<SrsState>;
      grammar_lessons: TableDef<GrammarLesson>;
      lesson_progress: TableDef<LessonProgress>;
      path_steps: TableDef<PathStep>;
      path_progress: TableDef<PathProgress>;
      situations: TableDef<Situation>;
      pronunciation_attempts: TableDef<PronunciationAttempt>;
      profiles: TableDef<Profile>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

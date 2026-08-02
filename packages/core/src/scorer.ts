import type { ScoreResult, Signal, Tier } from "./types.js";

const FILE_EXT =
  /[\w./\\-]+\.(ts|tsx|js|jsx|mjs|py|go|rs|java|rb|c|cpp|h|css|html|json|md|sql|ya?ml|toml|sh)\b/g;
const DIR_PATH = /\b(src|packages|apps|lib|tests?)\/[\w./-]*/g;
const AMBITION =
  /\b(refactor|migrate|architect|redesign|rewrite|overhaul|integrate|optimi[sz]e|design)\b/gi;
const ACTION =
  /\b(add|fix|write|update|convert|debug|extract|cache|mock|create|move|implement|handle)\b/gi;
const SCOPED =
  /\b(rename|explain|what is|what does|what do|show me|show the|list the|typo|reformat|add a comment)\b/i;
const THEN_STEP = /\bthen\b|\bafter that\b|\band also\b/i;
const NUMBERED_ITEM = /\b\d+[.)]\s+\w+/g;
const STACK_TRACE = /(traceback \(most recent call last\)|^\s+at\s+\S+|\w+(Error|Exception):)/im;
const QUESTION_START = /^(what|why|how|when|where|which|who|is|are|does|do|can|should)\b/i;

function matches(text: string, re: RegExp): string[] {
  re.lastIndex = 0;
  return text.match(re) ?? [];
}

export function scoreTask(text: string): ScoreResult {
  const signals: Signal[] = [];
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length > 120) signals.push({ name: "very long prompt", weight: 3 });
  else if (words.length > 50) signals.push({ name: "long prompt", weight: 2 });

  if (/```/.test(text)) signals.push({ name: "code block", weight: 2 });
  if (STACK_TRACE.test(text)) signals.push({ name: "stack trace", weight: 1 });

  const fileRefs = matches(text, FILE_EXT).length + matches(text, DIR_PATH).length;
  if (fileRefs >= 3) signals.push({ name: "many file references", weight: 3 });
  else if (fileRefs >= 1) signals.push({ name: "file reference", weight: 1 });

  const numbered = matches(text, NUMBERED_ITEM).length;
  if (numbered >= 3) signals.push({ name: "numbered steps", weight: 3 });
  else if (numbered === 2 || THEN_STEP.test(text)) {
    signals.push({ name: "multi-step language", weight: 2 });
  }

  const ambitionHits = matches(text, AMBITION).map((m) => m.toLowerCase());
  if (ambitionHits.length > 0) {
    const firstFiveWords = words.slice(0, 5).join(" ").toLowerCase();
    const early = ambitionHits.some((hit) => firstFiveWords.includes(hit));
    signals.push(
      early ? { name: "ambition verb", weight: 3 } : { name: "ambition mentioned", weight: 1 }
    );
  }

  const actionHits = matches(text, ACTION).map((m) => m.toLowerCase());
  if (actionHits.length > 0) signals.push({ name: "action verb", weight: 2 });

  const distinctVerbs = new Set([...ambitionHits, ...actionHits]);
  if (distinctVerbs.size >= 3) signals.push({ name: "many distinct actions", weight: 1 });

  if (SCOPED.test(text)) signals.push({ name: "scoped small task", weight: -3 });
  if (QUESTION_START.test(trimmed) && words.length <= 25) {
    signals.push({ name: "short question", weight: -2 });
  }

  const score = signals.reduce((sum, s) => sum + s.weight, 0);
  const tier: Tier = score >= 5 ? "hard" : score >= 2 ? "medium" : "easy";

  const boundaryDistance =
    tier === "hard" ? score - 5 : tier === "medium" ? Math.min(score - 2, 4 - score) : 1 - score;
  const confidence = Math.min(0.95, 0.6 + 0.07 * Math.max(0, boundaryDistance));

  const positive = signals.filter((s) => s.weight > 0).sort((a, b) => b.weight - a.weight);
  const negative = signals.filter((s) => s.weight < 0);
  const named = (tier === "easy" ? negative.concat(positive) : positive.concat(negative)).slice(
    0,
    3
  );
  const reason =
    named.length > 0
      ? `${tier}: ${named.map((s) => s.name).join(", ")}`
      : `${tier}: no strong signals`;

  return { tier, score, confidence, reason, signals };
}

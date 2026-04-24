import { openai } from "@workspace/integrations-openai-ai-server";
import { randomUUID } from "node:crypto";
import {
  TECHNIQUES,
  TECHNIQUE_LABEL,
  variantStore,
  type Variant,
} from "./store";

const MODEL = "llama-3.3-70b-versatile";

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // strip markdown fences if present
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  return JSON.parse(candidate);
}

async function chatJson(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const res = await openai.chat.completions.create({
    model: MODEL,
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });
  const content = res.choices[0]?.message?.content ?? "";
  return extractJson(content);
}

export interface AnalyzeOutcome {
  detectedLanguage: string;
  originalCode: string;
  fixedCode: string;
  errorsFound: string[];
  problemSummary: string;
  variants: Variant[];
  recommendedVariantId: string;
}

export async function analyzeAndGenerate(
  code: string,
  hintLanguage?: string,
): Promise<AnalyzeOutcome> {
  // STEP 1: detect language + fix errors + summarize problem
  const detectionPrompt = `You are a senior polyglot software engineer. Analyse the following program.
${hintLanguage ? `User suggests the language is "${hintLanguage}". Verify or correct.` : ""}
Tasks:
1. Detect the programming language (lowercase single token like python, javascript, java, cpp, c, ruby, rust, go, swift, kotlin, typescript, csharp, php, etc).
2. Identify any syntax or obvious logical errors. List each error in plain English.
3. Produce a corrected, compilable, runnable version of the program in the SAME language. Preserve the original behaviour & I/O contract. Do not change inputs/outputs.
4. Write a one-sentence summary of what the program does.

Return STRICT JSON with the shape:
{
  "detectedLanguage": "python",
  "errorsFound": ["..."],
  "fixedCode": "...",
  "problemSummary": "..."
}

PROGRAM:
\`\`\`
${code}
\`\`\``;

  const detection = (await chatJson(
    "You output only valid JSON. Never include explanations outside JSON.",
    detectionPrompt,
  )) as {
    detectedLanguage?: string;
    errorsFound?: string[];
    fixedCode?: string;
    problemSummary?: string;
  };

  const detectedLanguage = (detection.detectedLanguage ?? hintLanguage ?? "unknown")
    .toString()
    .toLowerCase()
    .trim();
  const fixedCode = detection.fixedCode ?? code;
  const errorsFound = Array.isArray(detection.errorsFound) ? detection.errorsFound : [];
  const problemSummary = detection.problemSummary ?? "";

  // STEP 2: generate variants across techniques
  const techniqueList = TECHNIQUES.map((t) => `- ${t.slug} (${t.label}): ${t.description}`).join(
    "\n",
  );

  const variantsPrompt = `You are a competitive-programming polyglot. Given the corrected program below, produce MULTIPLE distinct, fully runnable solutions to the SAME problem in the SAME language (${detectedLanguage}). Each solution MUST use a different algorithmic / data-structure technique drawn from this taxonomy. PICK BETWEEN 6 AND 9 of the most APPLICABLE techniques for this problem (do NOT force inapplicable ones). Each variant MUST be unique — no two variants may share the same approach.

Available techniques (use the slug exactly):
${techniqueList}

Each variant must:
- Be complete and executable as-is in ${detectedLanguage} (include any necessary imports/main entry point so it runs standalone).
- Solve the SAME problem with the SAME inputs/outputs as the corrected program.
- Be syntactically and semantically correct (no placeholders, no TODOs).
- Be genuinely different in approach, not a cosmetic rewrite.
- Include accurate big-O time and space complexity, an estimatedTimeMs (a realistic ms estimate for a moderate input size like n=10000), and an estimatedMemoryKb estimate, and a balanceScore from 0 to 100 that rewards a good time/memory trade-off (higher = better balance).

Return STRICT JSON:
{
  "variants": [
    {
      "technique": "two-pointers",
      "title": "Two-pointer linear scan",
      "summary": "Short blog-style hook describing the approach (1-2 sentences).",
      "explanation": "Full paragraph explaining how this variant works, why it suits the problem, and any trade-offs.",
      "code": "<full runnable ${detectedLanguage} program>",
      "benchmark": {
        "timeComplexity": "O(n)",
        "spaceComplexity": "O(1)",
        "estimatedTimeMs": 1.2,
        "estimatedMemoryKb": 64,
        "balanceScore": 88
      }
    }
  ]
}

CORRECTED PROGRAM:
\`\`\`${detectedLanguage}
${fixedCode}
\`\`\`

Problem summary: ${problemSummary}`;

  const variantsRaw = (await chatJson(
    "You output only valid JSON. All code must be syntactically valid and runnable. Never include explanations outside JSON.",
    variantsPrompt,
  )) as {
    variants?: Array<{
      technique?: string;
      title?: string;
      summary?: string;
      explanation?: string;
      code?: string;
      benchmark?: {
        timeComplexity?: string;
        spaceComplexity?: string;
        estimatedTimeMs?: number;
        estimatedMemoryKb?: number;
        balanceScore?: number;
      };
    }>;
  };

  const now = new Date().toISOString();
  const seenTechniques = new Set<string>();
  const variants: Variant[] = [];
  for (const v of variantsRaw.variants ?? []) {
    const technique = (v.technique ?? "").toString().toLowerCase().trim();
    if (!technique || !TECHNIQUE_LABEL[technique] || seenTechniques.has(technique)) continue;
    seenTechniques.add(technique);
    const benchmark = {
      timeComplexity: v.benchmark?.timeComplexity ?? "O(n)",
      spaceComplexity: v.benchmark?.spaceComplexity ?? "O(n)",
      estimatedTimeMs: Number(v.benchmark?.estimatedTimeMs ?? 1),
      estimatedMemoryKb: Number(v.benchmark?.estimatedMemoryKb ?? 64),
      balanceScore: Math.max(
        0,
        Math.min(100, Number(v.benchmark?.balanceScore ?? 50)),
      ),
    };
    const variant: Variant = {
      id: randomUUID(),
      technique,
      techniqueLabel: TECHNIQUE_LABEL[technique],
      title: v.title ?? `${TECHNIQUE_LABEL[technique]} approach`,
      summary: v.summary ?? "",
      explanation: v.explanation ?? "",
      language: detectedLanguage,
      code: v.code ?? "",
      benchmark,
      createdAt: now,
    };
    variants.push(variant);
    variantStore.add(variant);
  }

  // recommended = best balance score
  const recommended = variants.reduce<Variant | null>((best, v) => {
    if (!best) return v;
    return v.benchmark.balanceScore > best.benchmark.balanceScore ? v : best;
  }, null);

  return {
    detectedLanguage,
    originalCode: code,
    fixedCode,
    errorsFound,
    problemSummary,
    variants,
    recommendedVariantId: recommended?.id ?? "",
  };
}

export async function convertVariant(
  variant: Variant,
  targetLanguage: string,
): Promise<{ code: string; notes: string }> {
  const prompt = `Convert the following ${variant.language} program into idiomatic, fully runnable ${targetLanguage}. Preserve algorithmic technique (${variant.techniqueLabel}), inputs and outputs. The output MUST be a complete, self-contained, executable ${targetLanguage} program that compiles/runs without errors.

Return STRICT JSON:
{
  "code": "<full ${targetLanguage} program>",
  "notes": "Short note on idiomatic adjustments made for ${targetLanguage}."
}

SOURCE (${variant.language}):
\`\`\`${variant.language}
${variant.code}
\`\`\``;

  const out = (await chatJson(
    "You output only valid JSON. The code field must be a complete, runnable program with no placeholders.",
    prompt,
  )) as { code?: string; notes?: string };

  return {
    code: out.code ?? "",
    notes: out.notes ?? "",
  };
}

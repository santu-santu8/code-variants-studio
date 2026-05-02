import { openai } from "@workspace/integrations-openai-ai-server";
import { randomUUID } from "node:crypto";
import {
  TECHNIQUES,
  TECHNIQUE_LABEL,
  variantStore,
  type Variant,
} from "./store";

const MODEL = "mixtral-8x7b-32768";

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  return JSON.parse(candidate);
}

async function chatJson(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const res = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
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

  const techniqueList = TECHNIQUES.map((t) => `- ${t.slug} (${t.label}): ${t.description}`).join(
    "\n",
  );

  const variantsPrompt = `You are a competitive-programming polyglot. Given the corrected program below, produce distinct, fully runnable solutions to the SAME problem in the SAME language (${detectedLanguage}). Each solution MUST use a different algorithmic technique. PICK EXACTLY 3 techniques. Each variant MUST be unique.

Available techniques (use the slug exactly):
${techniqueList}

Each variant must:
- Be complete and executable as-is in ${detectedLanguage}.
- Solve the SAME problem with the SAME inputs/outputs.
- Be syntactically correct (no placeholders, no TODOs).
- Include big-O time and space complexity, estimatedTimeMs, estimatedMemoryKb, and balanceScore 0-100.

Return STRICT JSON:
{
  "variants": [
    {
      "technique": "two-pointers",
      "title": "Two-pointer linear scan",
      "summary": "Short 1-2 sentence description.",
      "explanation": "One paragraph explanation.",
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
      balanceScore: Math.max(0, Math.min(100, Number(v.benchmark?.balanceScore ?? 50))),
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
  const prompt = `Convert the following ${variant.language} program into idiomatic, fully runnable ${targetLanguage}. Preserve algorithmic technique (${variant.techniqueLabel}), inputs and outputs. The output MUST be a complete, self-contained, executable ${targetLanguage} program.

Return STRICT JSON:
{
  "code": "<full ${targetLanguage} program>",
  "notes": "Short note on idiomatic adjustments made."
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
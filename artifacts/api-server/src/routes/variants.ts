import { Router, type IRouter } from "express";
import {
  AnalyzeCodeBody,
  ConvertVariantBody,
  GetBlogByTechniqueParams,
  GetVariantParams,
} from "@workspace/api-zod";
import { analyzeAndGenerate, convertVariant } from "../lib/ai";
import { TECHNIQUES, variantStore } from "../lib/store";

const router: IRouter = Router();

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  try {
    const result = await analyzeAndGenerate(parsed.data.code, parsed.data.hintLanguage ?? undefined);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "analyze failed");
    res.status(500).json({ error: "Analysis failed", message: (err as Error).message });
  }
});

router.post("/convert", async (req, res) => {
  const parsed = ConvertVariantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const variant = variantStore.get(parsed.data.variantId);
  if (!variant) {
    res.status(404).json({ error: "Variant not found" });
    return;
  }
  try {
    const result = await convertVariant(variant, parsed.data.targetLanguage);
    res.json({
      variantId: variant.id,
      targetLanguage: parsed.data.targetLanguage,
      code: result.code,
      notes: result.notes,
    });
  } catch (err) {
    req.log.error({ err }, "convert failed");
    res.status(500).json({ error: "Conversion failed", message: (err as Error).message });
  }
});

router.get("/blogs", (_req, res) => {
  const groups = variantStore.groupedByTechnique();
  res.json({ groups, totalVariants: variantStore.size() });
});

router.get("/blogs/:technique", (req, res) => {
  const parsed = GetBlogByTechniqueParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid technique" });
    return;
  }
  const technique = parsed.data.technique;
  const info = TECHNIQUES.find((t) => t.slug === technique);
  if (!info) {
    res.status(404).json({ error: "Technique not found" });
    return;
  }
  res.json({
    technique: info.slug,
    techniqueLabel: info.label,
    variants: variantStore.byTechnique(technique),
  });
});

router.get("/variants/:id", (req, res) => {
  const parsed = GetVariantParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const variant = variantStore.get(parsed.data.id);
  if (!variant) {
    res.status(404).json({ error: "Variant not found" });
    return;
  }
  res.json(variant);
});

router.get("/techniques", (_req, res) => {
  res.json({ techniques: TECHNIQUES });
});

export default router;

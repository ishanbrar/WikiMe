import { describe, expect, it } from "vitest";
import {
  emptyExtractedFacts,
  normalizeExtractedFacts,
} from "@/lib/extractProfileFacts";
import {
  extractedFactsTextVolume,
  generationSourceVolume,
  isSparseGenerationInput,
} from "@/lib/structuredIntakeForPrompt";
import type { IntakeData } from "@/types/article";

const baseIntake = (): IntakeData => ({
  fullName: "Test User",
  articleTitle: "Test User",
  birthplace: "",
  birthday: "",
  deathDate: "",
  currentLocation: "",
  education: "",
  occupation: "",
  achievements: "",
  lifeEvents: "",
  controversies: "",
  tone: "neutral",
  mode: "realism",
  extraNotes: "One short sentence.",
  pastedProfileText: "",
  articleLength: "standard",
});

describe("structuredIntakeForPrompt sparse generation", () => {
  it("treats name plus one sentence as sparse when facts are empty", () => {
    const intake = baseIntake();
    const facts = emptyExtractedFacts();
    expect(generationSourceVolume(intake, facts)).toBeLessThan(1800);
    expect(isSparseGenerationInput(intake, facts)).toBe(true);
  });

  it("is not sparse when screenshot extracts add enough text", () => {
    const intake = baseIntake();
    const facts = normalizeExtractedFacts({
      ...emptyExtractedFacts(),
      rawUsefulText: ["x".repeat(2000)],
    });
    expect(extractedFactsTextVolume(facts)).toBeGreaterThan(1500);
    expect(isSparseGenerationInput(intake, facts)).toBe(false);
  });
});

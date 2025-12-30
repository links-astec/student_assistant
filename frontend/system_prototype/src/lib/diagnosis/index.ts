// Diagnosis Engine Factory
// Creates the appropriate engine based on environment configuration

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiagnosisEngine, DiagnosisEngineMode } from "./interfaces";
import { RuleBasedClassifier } from "./rule-based/classifier";
import { RuleBasedQuestionPlanner } from "./rule-based/question-planner";
import { TemplateEmailDrafter } from "./rule-based/email-drafter";
import { SimpleSummariser } from "./rule-based/summariser";
import { ContactProvider } from "./rule-based/contact-provider";

// LLM stubs (future implementation)
import { LLMClassifier } from "./llm/classifier";
import { LLMQuestionPlanner } from "./llm/question-planner";
import { LLMEmailDrafter } from "./llm/email-drafter";
import { LLMSummariser } from "./llm/summariser";

export function createDiagnosisEngine(
  supabase: SupabaseClient,
  diagnosisMode: DiagnosisEngineMode = "rule",
  drafterMode: "template" | "llm" = "template"
): DiagnosisEngine {
  // Classifier based on diagnosis mode
  const classifier =
    diagnosisMode === "llm"
      ? new LLMClassifier(supabase)
      : new RuleBasedClassifier(supabase);

  // Question planner based on diagnosis mode
  const questionPlanner =
    diagnosisMode === "llm"
      ? new LLMQuestionPlanner(supabase)
      : new RuleBasedQuestionPlanner(supabase);

  // Email drafter based on drafter mode
  const emailDrafter =
    drafterMode === "llm"
      ? new LLMEmailDrafter(supabase)
      : new TemplateEmailDrafter(supabase);

  // Summariser based on diagnosis mode
  const summariser =
    diagnosisMode === "llm"
      ? new LLMSummariser(supabase)
      : new SimpleSummariser(supabase);

  // Contact provider is always database-backed
  const contactProvider = new ContactProvider(supabase);

  return {
    classifier,
    questionPlanner,
    emailDrafter,
    summariser,
    contactProvider,
  };
}

export * from "./interfaces";

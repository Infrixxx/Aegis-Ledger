import { z } from "zod";

export const TradeDirectionSchema = z.enum(["BUY", "SELL", "NO_TRADE_CHOP"]);
export type TradeDirection = z.infer<typeof TradeDirectionSchema>;

export const TradeOutcomeSchema = z.enum(["WIN", "LOSS", "BREAK_EVEN"]);
export type TradeOutcome = z.infer<typeof TradeOutcomeSchema>;

export const MultiTimeframeChecklistSchema = z.object({
  d1MacroTrend: z.literal(true, {
    errorMap: () => ({ message: "D1 Macro Trend alignment is mandatory" }),
  }),
  h4StructureAlignment: z.literal(true, {
    errorMap: () => ({ message: "H4 Structure Alignment is mandatory" }),
  }),
  h1IntermediateTrend: z.literal(true, {
    errorMap: () => ({ message: "H1 Intermediate Trend alignment is mandatory" }),
  }),
  m30SupportResistance: z.literal(true, {
    errorMap: () => ({ message: "M30 Key S/R level confirmation is mandatory" }),
  }),
  m15ExecutionTrigger: z.literal(true, {
    errorMap: () => ({ message: "M15 Execution Trigger confirmation is mandatory" }),
  }),
});
export type MultiTimeframeChecklist = z.infer<typeof MultiTimeframeChecklistSchema>;

export const DialecticalAnalysisSchema = z.object({
  bullThesis: z
    .string()
    .min(20, { message: "Bull thesis requires at least 20 characters of structural justification" }),
  bearThesis: z
    .string()
    .min(20, { message: "Bear thesis requires at least 20 characters of counter-trend risk analysis" }),
  bias: TradeDirectionSchema,
});
export type DialecticalAnalysis = z.infer<typeof DialecticalAnalysisSchema>;

export const RiskValidationSchema = z
  .object({
    accountBalance: z.number().positive(),
    riskAmountCurrency: z.number().positive(),
    entryPrice: z.number().positive(),
    stopLossPrice: z.number().positive(),
    takeProfitPrice: z.number().positive(),
    slAtStructuralFailure: z.literal(true, {
      errorMap: () => ({ message: "Stop Loss must be set at structural market invalidation" }),
    }),
    direction: z.enum(["BUY", "SELL"]),
  })
  .superRefine((data, ctx) => {
    const { direction, entryPrice, stopLossPrice, takeProfitPrice } = data;

    if (direction === "BUY") {
      if (!(stopLossPrice < entryPrice && entryPrice < takeProfitPrice)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Long trade geometry invalid: Required SL < Entry < TP",
          path: ["stopLossPrice"],
        });
      }
    } else {
      if (!(takeProfitPrice < entryPrice && entryPrice < stopLossPrice)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Short trade geometry invalid: Required TP < Entry < SL",
          path: ["stopLossPrice"],
        });
      }
    }

    const risk = Math.abs(entryPrice - stopLossPrice);
    const reward = Math.abs(takeProfitPrice - entryPrice);

    if (risk === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid price points: Zero risk distance",
        path: ["stopLossPrice"],
      });
      return;
    }

    const calculatedRR = reward / risk;
    if (calculatedRR < 2.0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Asymmetric risk violated: R:R must be ≥ 2.0 (Calculated: ${calculatedRR.toFixed(2)})`,
        path: ["takeProfitPrice"],
      });
    }
  });

export type RiskValidation = z.infer<typeof RiskValidationSchema>;

export const PostMortemSchema = z.object({
  setupCompliant: z.boolean(),
  riskCompliant: z.boolean(),
  executionCompliant: z.boolean(),
  outcome: TradeOutcomeSchema,
  realizedR: z.number(),
  netProfitCurrency: z.number(),
  notes: z.string().min(10, { message: "Post-mortem reflection requires minimum 10 characters" }),
  beforeSetupUrl: z.string().url().optional().or(z.literal("")),
  afterOutcomeUrl: z.string().url().optional().or(z.literal("")),
  isLocked: z.boolean().default(false),
});
export type PostMortem = z.infer<typeof PostMortemSchema>;

export function calculateCompliance(pm: Pick<PostMortem, "setupCompliant" | "riskCompliant" | "executionCompliant">): boolean {
  return pm.setupCompliant && pm.riskCompliant && pm.executionCompliant;
}
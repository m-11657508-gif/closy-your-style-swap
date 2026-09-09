import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { askForJson } from "./closy-ai.server";

const estimateInput = z.object({
  height_cm: z.number().min(100).max(230),
  weight_kg: z.number().min(30).max(200),
  age: z.number().min(10).max(100).optional(),
  usual_top_size: z.string().max(20),
  usual_bottom_size: z.string().max(20),
  body_shape: z.string().max(40),
  fit_preference: z.string().max(40),
  notes: z.string().max(400).optional(),
});

export type EstimatedMeasurements = {
  bust_cm: number;
  waist_cm: number;
  hips_cm: number;
  inseam_cm: number;
  shoulder_cm: number;
  body_shape: string;
  confidence: string;
  explanation: string;
};

export const estimateMeasurements = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => estimateInput.parse(input))
  .handler(async ({ data }) => {
    return await askForJson<EstimatedMeasurements>({
      instructions:
        "You estimate approximate body measurements in centimetres for second-hand clothes shopping. " +
        "Use the person's height, weight, usual clothing sizes and body shape. Be realistic and moderate. " +
        "Never claim medical accuracy. Keep the explanation to two friendly sentences and remind them a tape measure is more accurate.",
      input: JSON.stringify(data),
      schemaName: "measurement_estimate",
      schema: {
        type: "object",
        additionalProperties: false,
        required: [
          "bust_cm",
          "waist_cm",
          "hips_cm",
          "inseam_cm",
          "shoulder_cm",
          "body_shape",
          "confidence",
          "explanation",
        ],
        properties: {
          bust_cm: { type: "number" },
          waist_cm: { type: "number" },
          hips_cm: { type: "number" },
          inseam_cm: { type: "number" },
          shoulder_cm: { type: "number" },
          body_shape: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          explanation: { type: "string" },
        },
      },
    });
  });

const stylistInput = z.object({
  prompt: z.string().max(600),
  occasion: z.string().max(80),
  styles: z.array(z.string().max(40)).max(12),
  colours: z.string().max(200),
  budget_cents: z.number().min(0).max(10_000_000),
  measurements: z
    .object({
      height_cm: z.number().nullable().optional(),
      bust_cm: z.number().nullable().optional(),
      waist_cm: z.number().nullable().optional(),
      hips_cm: z.number().nullable().optional(),
      inseam_cm: z.number().nullable().optional(),
      shoulder_cm: z.number().nullable().optional(),
      body_shape: z.string().nullable().optional(),
    })
    .nullable(),
  catalog: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        size_label: z.string().nullable(),
        condition: z.string(),
        colour: z.string().nullable(),
        style_tags: z.array(z.string()),
        price_cents: z.number(),
        mode: z.string(),
        fit_notes: z.record(z.string(), z.unknown()).nullable(),
      }),
    )
    .max(60),
});

export type StylistResult = {
  intro: string;
  picks: {
    listing_id: string;
    why: string;
    fit_verdict: string;
    styling_tip: string;
  }[];
};

export const recommendOutfits = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => stylistInput.parse(input))
  .handler(async ({ data }) => {
    const result = await askForJson<StylistResult>({
      instructions:
        "You are Closy's warm, practical personal stylist for a second-hand clothing marketplace. " +
        "Pick between 2 and 4 items from the provided catalog only, using the exact listing ids given. " +
        "Match the shopper's stated taste, occasion, budget and measurements. " +
        "For fit_verdict compare the item's fit notes and size with the shopper's measurements and say plainly whether it should fit, run snug or run loose. " +
        "Keep every field to one short sentence. Never invent items that are not in the catalog.",
      input: JSON.stringify(data),
      schemaName: "stylist_picks",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["intro", "picks"],
        properties: {
          intro: { type: "string" },
          picks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["listing_id", "why", "fit_verdict", "styling_tip"],
              properties: {
                listing_id: { type: "string" },
                why: { type: "string" },
                fit_verdict: { type: "string" },
                styling_tip: { type: "string" },
              },
            },
          },
        },
      },
    });

    const validIds = new Set(data.catalog.map((item) => item.id));
    return { ...result, picks: result.picks.filter((pick) => validIds.has(pick.listing_id)) };
  });

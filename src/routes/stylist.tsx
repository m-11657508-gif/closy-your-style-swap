import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ListingRow } from "@/components/closy/listing-card";
import { SiteHeader } from "@/components/closy/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { recommendOutfits, type StylistResult } from "@/lib/closy.functions";
import { formatPrice, listingImage } from "@/lib/listing-images";

export const Route = createFileRoute("/stylist")({
  head: () => ({
    meta: [
      { title: "AI stylist — Closy" },
      {
        name: "description",
        content:
          "Tell Closy your vibe, occasion and budget. The AI stylist picks real second-hand listings and explains how each one will fit you.",
      },
      { property: "og:title", content: "AI stylist — Closy" },
      {
        property: "og:description",
        content: "Personal stylist picks from real pre-loved listings, matched to your measurements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StylistPage,
});

const styleOptions = [
  "minimal",
  "romantic",
  "street",
  "cottagecore",
  "office",
  "evening",
  "casual",
  "cute",
];

function StylistPage() {
  const { user } = useSession();
  const ask = useServerFn(recommendOutfits);

  const [prompt, setPrompt] = useState("");
  const [occasion, setOccasion] = useState("everyday");
  const [colours, setColours] = useState("pastels, soft blue, cream");
  const [budget, setBudget] = useState("100");
  const [styles, setStyles] = useState<string[]>(["minimal", "romantic"]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<StylistResult | null>(null);

  const { data: listings } = useQuery({
    queryKey: ["listings", "catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "available")
        .limit(60);
      if (error) throw error;
      return data as ListingRow[];
    },
  });

  const { data: measurements } = useQuery({
    queryKey: ["measurements", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("measurements").select("*").maybeSingle();
      if (error) throw error;
      return data as Record<string, number | string | null> | null;
    },
  });

  function toggleStyle(style: string) {
    setStyles((current) =>
      current.includes(style) ? current.filter((item) => item !== style) : [...current, style],
    );
  }

  async function run() {
    if (!listings || listings.length === 0) {
      toast.error("No outfits to style yet");
      return;
    }
    setThinking(true);
    try {
      const response = await ask({
        data: {
          prompt: prompt || "Something I can wear often that suits my shape.",
          occasion,
          styles,
          colours,
          budget_cents: Math.round(Number(budget || "0") * 100),
          measurements: measurements
            ? {
                height_cm: Number(measurements["height_cm"]) || null,
                bust_cm: Number(measurements["bust_cm"]) || null,
                waist_cm: Number(measurements["waist_cm"]) || null,
                hips_cm: Number(measurements["hips_cm"]) || null,
                inseam_cm: Number(measurements["inseam_cm"]) || null,
                shoulder_cm: Number(measurements["shoulder_cm"]) || null,
                body_shape: (measurements["body_shape"] as string) ?? null,
              }
            : null,
          catalog: listings.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            size_label: item.size_label,
            condition: item.condition,
            colour: item.colour,
            style_tags: item.style_tags ?? [],
            price_cents: item.price_cents,
            mode: item.mode,
            fit_notes: (item.fit_notes as Record<string, unknown>) ?? null,
          })),
        },
      });
      setResult(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The stylist is unavailable right now");
    } finally {
      setThinking(false);
    }
  }

  const byId = new Map((listings ?? []).map((item) => [item.id, item]));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-4xl">Your AI stylist</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Closy reads your saved measurements and the community's listings, then picks pieces that
          suit you — with a plain-English verdict on the fit.
        </p>
        {!measurements ? (
          <p className="mt-4 rounded-2xl bg-secondary p-4 text-sm">
            Tip: save your measurements first for fit advice.{" "}
            <Link to="/measurements" className="underline">
              Add measurements
            </Link>
          </p>
        ) : null}

        <div className="card-soft mt-8 grid gap-4 p-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="prompt">What are you looking for?</Label>
            <Textarea
              id="prompt"
              rows={3}
              placeholder="A soft outfit for a friend's engagement brunch, nothing tight around the waist."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Input
              id="occasion"
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget per piece (MYR)</Label>
            <Input
              id="budget"
              inputMode="decimal"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="colours">Colours you love</Label>
            <Input
              id="colours"
              value={colours}
              onChange={(event) => setColours(event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Your style</Label>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((style) => (
                <button key={style} type="button" onClick={() => toggleStyle(style)}>
                  <Badge variant={styles.includes(style) ? "default" : "outline"}>{style}</Badge>
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button disabled={thinking} onClick={run}>
              <Sparkles className="mr-1 size-4" />
              {thinking ? "Styling you…" : "Style me"}
            </Button>
          </div>
        </div>

        {result ? (
          <section className="mt-10 space-y-5">
            <p className="text-lg">{result.intro}</p>
            {result.picks.map((pick) => {
              const item = byId.get(pick.listing_id);
              if (!item) return null;
              return (
                <div key={pick.listing_id} className="card-soft flex flex-col gap-4 p-4 sm:flex-row">
                  <img
                    src={listingImage(item)}
                    alt={item.title}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="h-48 w-full rounded-2xl object-cover sm:w-36"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-xl">{item.title}</h2>
                      <span className="font-semibold">
                        {formatPrice(item.price_cents, item.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{pick.why}</p>
                    <p className="text-sm">
                      <strong>Fit: </strong>
                      {pick.fit_verdict}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Style it: </strong>
                      {pick.styling_tip}
                    </p>
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/item/$id" params={{ id: item.id }}>
                        View outfit
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}
      </main>
    </div>
  );
}

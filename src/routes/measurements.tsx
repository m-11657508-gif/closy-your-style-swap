import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/closy/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { estimateMeasurements } from "@/lib/closy.functions";

export const Route = createFileRoute("/measurements")({
  head: () => ({
    meta: [
      { title: "My measurements — Closy" },
      {
        name: "description",
        content:
          "Enter your measurements by hand or let Closy's AI estimate them from your height, weight and usual sizes.",
      },
      { property: "og:title", content: "My measurements — Closy" },
      {
        property: "og:description",
        content: "Save your body measurements once so every Closy outfit shows how it will fit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeasurementsPage,
});

const fields = [
  { key: "height_cm", label: "Height (cm)" },
  { key: "weight_kg", label: "Weight (kg)" },
  { key: "bust_cm", label: "Bust / chest (cm)" },
  { key: "waist_cm", label: "Waist (cm)" },
  { key: "hips_cm", label: "Hips (cm)" },
  { key: "inseam_cm", label: "Inseam (cm)" },
  { key: "shoulder_cm", label: "Shoulder (cm)" },
] as const;

type FormState = Record<string, string>;

function MeasurementsPage() {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const estimate = useServerFn(estimateMeasurements);

  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [quiz, setQuiz] = useState({
    height_cm: "",
    weight_kg: "",
    usual_top_size: "M",
    usual_bottom_size: "M",
    body_shape: "not sure",
    fit_preference: "true to size",
    notes: "",
  });

  const { data: saved } = useQuery({
    queryKey: ["measurements", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("measurements").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!saved) return;
    const next: FormState = {};
    for (const field of fields) {
      const value = (saved as Record<string, unknown>)[field.key];
      next[field.key] = value == null ? "" : String(value);
    }
    setForm(next);
    setQuiz((current) => ({
      ...current,
      height_cm: next["height_cm"] ?? "",
      weight_kg: next["weight_kg"] ?? "",
    }));
  }, [saved]);

  async function save(method: "manual" | "ai") {
    if (!user) return;
    setSaving(true);
    const payload: Record<string, unknown> = { user_id: user.id, method };
    for (const field of fields) {
      const raw = form[field.key];
      payload[field.key] = raw ? Number(raw) : null;
    }
    const { error } = await supabase
      .from("measurements")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Measurements saved");
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
    }
  }

  async function runEstimate() {
    const height = Number(quiz.height_cm);
    const weight = Number(quiz.weight_kg);
    if (!height || !weight) {
      toast.error("Add your height and weight first");
      return;
    }
    setThinking(true);
    try {
      const result = await estimate({
        data: {
          height_cm: height,
          weight_kg: weight,
          usual_top_size: quiz.usual_top_size,
          usual_bottom_size: quiz.usual_bottom_size,
          body_shape: quiz.body_shape,
          fit_preference: quiz.fit_preference,
          notes: quiz.notes || undefined,
        },
      });
      setForm({
        height_cm: String(height),
        weight_kg: String(weight),
        bust_cm: String(result.bust_cm),
        waist_cm: String(result.waist_cm),
        hips_cm: String(result.hips_cm),
        inseam_cm: String(result.inseam_cm),
        shoulder_cm: String(result.shoulder_cm),
      });
      setExplanation(result.explanation);
      toast.success("Estimate ready — review and save");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not estimate right now");
    } finally {
      setThinking(false);
    }
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-3xl">Sign in to save measurements</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your measurements stay private to you and power your fit checks.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">Sign in</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl">My measurements</h1>
        <p className="mt-2 text-muted-foreground">
          Measure with a tape for the best accuracy, or answer a few questions and let Closy estimate
          for you.
        </p>

        <Tabs defaultValue="manual" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 sm:w-96">
            <TabsTrigger value="manual">Enter by hand</TabsTrigger>
            <TabsTrigger value="ai">Estimate with AI</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="pt-6">
            <div className="card-soft grid gap-4 p-6 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    inputMode="decimal"
                    value={form[field.key] ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button disabled={saving} onClick={() => save("manual")}>
                  Save measurements
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="pt-6">
            <div className="card-soft grid gap-4 p-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q-height">Height (cm)</Label>
                <Input
                  id="q-height"
                  inputMode="decimal"
                  value={quiz.height_cm}
                  onChange={(event) => setQuiz({ ...quiz, height_cm: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-weight">Weight (kg)</Label>
                <Input
                  id="q-weight"
                  inputMode="decimal"
                  value={quiz.weight_kg}
                  onChange={(event) => setQuiz({ ...quiz, weight_kg: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-top">Usual top size</Label>
                <Input
                  id="q-top"
                  value={quiz.usual_top_size}
                  onChange={(event) => setQuiz({ ...quiz, usual_top_size: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-bottom">Usual bottom size</Label>
                <Input
                  id="q-bottom"
                  value={quiz.usual_bottom_size}
                  onChange={(event) => setQuiz({ ...quiz, usual_bottom_size: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-shape">Body shape (if you know it)</Label>
                <Input
                  id="q-shape"
                  value={quiz.body_shape}
                  onChange={(event) => setQuiz({ ...quiz, body_shape: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-fit">How do you like clothes to fit?</Label>
                <Input
                  id="q-fit"
                  value={quiz.fit_preference}
                  onChange={(event) => setQuiz({ ...quiz, fit_preference: event.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="q-notes">Anything else?</Label>
                <Textarea
                  id="q-notes"
                  rows={3}
                  placeholder="Long legs, broad shoulders, tops always tight at the chest…"
                  value={quiz.notes}
                  onChange={(event) => setQuiz({ ...quiz, notes: event.target.value })}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <Button disabled={thinking} onClick={runEstimate}>
                  <Sparkles className="mr-1 size-4" />
                  {thinking ? "Estimating…" : "Estimate my measurements"}
                </Button>
                <Button variant="secondary" disabled={saving} onClick={() => save("ai")}>
                  Save the estimate
                </Button>
              </div>
              {explanation ? (
                <p className="rounded-2xl bg-secondary p-4 text-sm sm:col-span-2">{explanation}</p>
              ) : null}
              {Object.keys(form).length > 0 ? (
                <div className="grid gap-2 text-sm sm:col-span-2 sm:grid-cols-2">
                  {fields.map((field) =>
                    form[field.key] ? (
                      <p key={field.key} className="text-muted-foreground">
                        {field.label}: <strong className="text-foreground">{form[field.key]}</strong>
                      </p>
                    ) : null,
                  )}
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

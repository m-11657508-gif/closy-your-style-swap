import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/closy/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { imageKeyOptions, listingImage } from "@/lib/listing-images";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "List an outfit — Closy" },
      {
        name: "description",
        content:
          "List a pre-loved outfit on Closy in a minute: photo, size, condition, fit measurements, and whether it's for sale or swap.",
      },
      { property: "og:title", content: "List an outfit — Closy" },
      {
        property: "og:description",
        content: "Sell or swap the clothes you no longer wear with the Closy community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    brand: "",
    category: "dresses",
    size_label: "M",
    condition: "good",
    colour: "",
    style_tags: "",
    price: "",
    mode: "both",
    image_key: imageKeyOptions[0] ?? "dress-cream",
    bust_cm: "",
    waist_cm: "",
    hips_cm: "",
    length_cm: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Give your outfit a title");
      return;
    }
    setSaving(true);
    const fitNotes: Record<string, number> = {};
    for (const key of ["bust_cm", "waist_cm", "hips_cm", "length_cm"] as const) {
      if (form[key]) fitNotes[key] = Number(form[key]);
    }
    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        seller_name:
          (user.user_metadata?.["display_name"] as string) ?? user.email?.split("@")[0] ?? "Closy member",
        title: form.title.trim(),
        description: form.description.trim() || null,
        brand: form.brand.trim() || null,
        category: form.category,
        size_label: form.size_label,
        condition: form.condition,
        colour: form.colour.trim() || null,
        style_tags: form.style_tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        price_cents: Math.round(Number(form.price || "0") * 100),
        image_key: form.image_key,
        fit_notes: fitNotes,
        mode: form.mode,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your outfit is live");
    navigate({ to: "/item/$id", params: { id: data.id } });
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-3xl">Sign in to list an outfit</h1>
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
        <h1 className="text-4xl">List an outfit</h1>
        <p className="mt-2 text-muted-foreground">
          Add the fit measurements — that is what helps someone know it will suit them.
        </p>

        <div className="card-soft mt-8 grid gap-4 p-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Buttercream linen midi dress"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Worn twice, hidden pockets, tiny mark on the hem."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={form.brand}
              onChange={(event) => update("brand", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="colour">Colour</Label>
            <Input
              id="colour"
              value={form.colour}
              onChange={(event) => update("colour", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(value) => update("category", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["dresses", "tops", "bottoms", "outerwear", "shoes", "other"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size label</Label>
            <Input
              id="size"
              value={form.size_label}
              onChange={(event) => update("size_label", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(value) => update("condition", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["like new", "good", "well loved"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Buy or swap</Label>
            <Select value={form.mode} onValueChange={(value) => update("mode", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Buy or swap</SelectItem>
                <SelectItem value="buy">For sale only</SelectItem>
                <SelectItem value="swap">Swap only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (MYR)</Label>
            <Input
              id="price"
              inputMode="decimal"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Style tags (comma separated)</Label>
            <Input
              id="tags"
              value={form.style_tags}
              onChange={(event) => update("style_tags", event.target.value)}
              placeholder="minimal, brunch, linen"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Photo</Label>
            <div className="flex flex-wrap gap-3">
              {imageKeyOptions.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => update("image_key", key)}
                  className={`overflow-hidden rounded-2xl border-2 ${
                    form.image_key === key ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={listingImage({ image_key: key })}
                    alt={key}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="size-20 object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pick a stand-in photo for now — uploading your own photos is coming next.
            </p>
          </div>

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-4">
            {(
              [
                ["bust_cm", "Bust (cm)"],
                ["waist_cm", "Waist (cm)"],
                ["hips_cm", "Hips (cm)"],
                ["length_cm", "Length (cm)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  inputMode="decimal"
                  value={form[key]}
                  onChange={(event) => update(key, event.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="sm:col-span-2">
            <Button disabled={saving} onClick={submit}>
              {saving ? "Publishing…" : "Publish outfit"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

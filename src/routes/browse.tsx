import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ListingCard, type ListingRow } from "@/components/closy/listing-card";
import { SiteHeader } from "@/components/closy/site-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse pre-loved outfits — Closy" },
      {
        name: "description",
        content:
          "Search Closy's second-hand outfits by size, category and vibe. Every listing shows real fit measurements.",
      },
      { property: "og:title", content: "Browse pre-loved outfits — Closy" },
      {
        property: "og:description",
        content: "Second-hand dresses, tops, bottoms and outerwear, ready to buy or swap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Browse,
});

function Browse() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [mode, setMode] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["listings", "all"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return rows as ListingRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (mode !== "all" && item.mode !== mode && item.mode !== "both") return false;
      if (!term) return true;
      const haystack = [item.title, item.brand, item.colour, ...(item.style_tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [data, search, category, mode]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl">Browse the closet</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Pre-loved pieces from the Closy community. Filter by what you need, then check the fit
          notes before you buy or swap.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder="Search dresses, brands, colours…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="dresses">Dresses</SelectItem>
              <SelectItem value="tops">Tops</SelectItem>
              <SelectItem value="bottoms">Bottoms</SelectItem>
              <SelectItem value="outerwear">Outerwear</SelectItem>
              <SelectItem value="shoes">Shoes</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Buy or swap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Buy or swap</SelectItem>
              <SelectItem value="buy">For sale</SelectItem>
              <SelectItem value="swap">Swap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-96 rounded-3xl" />
              ))
            : filtered.map((item) => <ListingCard key={item.id} item={item} />)}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Nothing matches that yet — try a different search.
          </p>
        ) : null}
      </main>
    </div>
  );
}

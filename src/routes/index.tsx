import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Ruler, Sparkles, Repeat } from "lucide-react";

import { ListingCard, type ListingRow } from "@/components/closy/listing-card";
import { SiteHeader } from "@/components/closy/site-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/closy-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Closy — Buy, sell and swap second-hand outfits" },
      {
        name: "description",
        content:
          "Closy is the pastel marketplace for pre-loved fashion: buy, sell and swap outfits, measure your body, and get AI stylist picks that actually fit.",
      },
      { property: "og:title", content: "Closy — Buy, sell and swap second-hand outfits" },
      {
        property: "og:description",
        content:
          "Pre-loved fashion that fits. Measure yourself, get AI stylist picks, then buy or swap with the Closy community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return rows as ListingRow[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="bg-blush-wash">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-soft">
                <Sparkles className="size-3.5" /> Pre-loved fashion that actually fits
              </span>
              <h1 className="text-4xl leading-tight sm:text-5xl md:text-6xl">
                Buy, sell and swap outfits with a stylist in your pocket
              </h1>
              <p className="max-w-md text-base text-muted-foreground">
                Closy remembers your measurements, so every second-hand piece you see is one you can
                actually wear. Swap with someone your size or pay in a few taps.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/browse">Browse outfits</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/stylist">Try the AI stylist</Link>
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl shadow-lift">
              <img
                src={heroImage}
                alt="Two friends swapping pastel second-hand clothes on a clothing rack"
                width={1600}
                height={1000}
                className="size-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Ruler,
                title: "Measure your way",
                body: "Type in your tape-measure numbers, or answer a few questions and let AI estimate them.",
                to: "/measurements",
                cta: "Set my measurements",
              },
              {
                icon: Sparkles,
                title: "Stylist picks",
                body: "Tell Closy the vibe and occasion. It picks real listings and tells you how they'll fit.",
                to: "/stylist",
                cta: "Ask the stylist",
              },
              {
                icon: Repeat,
                title: "Buy or swap",
                body: "Pay for a piece, or offer one of your own outfits in a swap. Your closet, refreshed.",
                to: "/sell",
                cta: "List an outfit",
              },
            ].map((card) => (
              <div key={card.title} className="card-soft space-y-3 p-6">
                <span className="grid size-10 place-items-center rounded-2xl bg-secondary">
                  <card.icon className="size-5" />
                </span>
                <h2 className="text-xl">{card.title}</h2>
                <p className="text-sm text-muted-foreground">{card.body}</p>
                <Button asChild variant="link" className="px-0">
                  <Link to={card.to}>{card.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-3xl">Fresh in the closet</h2>
            <Button asChild variant="ghost">
              <Link to="/browse">See all</Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-96 rounded-3xl" />
                ))
              : (data ?? []).map((item) => <ListingCard key={item.id} item={item} />)}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
        Closy — give your outfits a second life.
      </footer>
    </div>
  );
}

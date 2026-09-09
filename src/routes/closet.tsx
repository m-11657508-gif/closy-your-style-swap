import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { ListingCard, type ListingRow } from "@/components/closy/listing-card";
import { SiteHeader } from "@/components/closy/site-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/listing-images";

export const Route = createFileRoute("/closet")({
  head: () => ({
    meta: [
      { title: "My closet — Closy" },
      {
        name: "description",
        content:
          "Your saved outfits, your own listings, your purchases and your swap offers, all in one place on Closy.",
      },
      { property: "og:title", content: "My closet — Closy" },
      {
        property: "og:description",
        content: "Saved outfits, listings, purchases and swap offers on Closy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClosetPage,
});

function ClosetPage() {
  const { user, loading } = useSession();

  const saved = useQuery({
    queryKey: ["closet", "saved", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("listings(*)");
      if (error) throw error;
      return (data ?? []).map((row) => row.listings as unknown as ListingRow).filter(Boolean);
    },
  });

  const mine = useQuery({
    queryKey: ["closet", "mine", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ListingRow[];
    },
  });

  const orders = useQuery({
    queryKey: ["closet", "orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,amount_cents,currency,created_at,listings(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const swaps = useQuery({
    queryKey: ["closet", "swaps", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swap_requests")
        .select("id,status,message,created_at,listings!swap_requests_listing_id_fkey(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!loading && !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-3xl">Sign in to see your closet</h1>
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
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl">My closet</h1>

        <Tabs defaultValue="saved" className="mt-8">
          <TabsList>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="listings">My listings</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="swaps">Swap offers</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="pt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(saved.data ?? []).map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
            {(saved.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">Nothing saved yet.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="listings" className="pt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(mine.data ?? []).map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
            {(mine.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">
                You have not listed anything yet.{" "}
                <Link to="/sell" className="underline">
                  List an outfit
                </Link>
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-3 pt-6">
            {(orders.data ?? []).map((order) => (
              <div key={order.id} className="card-soft flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    {(order.listings as { title?: string } | null)?.title ?? "Outfit"}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.status}</p>
                </div>
                <span className="font-semibold">
                  {formatPrice(order.amount_cents, order.currency)}
                </span>
              </div>
            ))}
            {(orders.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">No purchases yet.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="swaps" className="space-y-3 pt-6">
            {(swaps.data ?? []).map((swap) => (
              <div key={swap.id} className="card-soft p-4">
                <p className="font-medium">
                  {(swap.listings as { title?: string } | null)?.title ?? "Outfit"}
                </p>
                <p className="text-sm text-muted-foreground">{swap.status}</p>
                {swap.message ? <p className="mt-1 text-sm">{swap.message}</p> : null}
              </div>
            ))}
            {(swaps.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">No swap offers yet.</p>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

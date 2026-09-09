import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart, ShoppingBag, Repeat } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ListingRow } from "@/components/closy/listing-card";
import { SiteHeader } from "@/components/closy/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, listingImage } from "@/lib/listing-images";

export const Route = createFileRoute("/item/$id")({
  head: () => ({
    meta: [
      { title: "Outfit details — Closy" },
      {
        name: "description",
        content:
          "See the size, condition and exact fit measurements of this pre-loved outfit, then buy it or offer a swap on Closy.",
      },
      { property: "og:title", content: "Outfit details — Closy" },
      {
        property: "og:description",
        content: "A pre-loved outfit on Closy, with real fit measurements.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ItemPage,
});

function ItemPage() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [buyOpen, setBuyOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [offered, setOffered] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as ListingRow | null;
    },
  });

  const { data: myListings } = useQuery({
    queryKey: ["listings", "mine", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title")
        .eq("seller_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: favourited } = useQuery({
    queryKey: ["favorite", id, user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("listing_id", id)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  async function toggleFavourite() {
    if (!user) {
      toast.error("Sign in to save outfits");
      return;
    }
    if (favourited) {
      await supabase.from("favorites").delete().eq("listing_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("favorites").insert({ listing_id: id, user_id: user.id });
    }
    queryClient.invalidateQueries({ queryKey: ["favorite", id] });
  }

  async function confirmPurchase() {
    if (!user || !item) return;
    setBusy(true);
    const { error } = await supabase.from("orders").insert({
      buyer_id: user.id,
      listing_id: item.id,
      amount_cents: item.price_cents,
      currency: item.currency,
      status: "reserved",
    });
    setBusy(false);
    setBuyOpen(false);
    if (error) toast.error(error.message);
    else toast.success("Reserved! Find it under My closet → Purchases.");
  }

  async function sendSwap() {
    if (!user || !item) return;
    setBusy(true);
    const { error } = await supabase.from("swap_requests").insert({
      requester_id: user.id,
      listing_id: item.id,
      offered_listing_id: offered || null,
      message: message || null,
    });
    setBusy(false);
    setSwapOpen(false);
    if (error) toast.error(error.message);
    else toast.success("Swap offer sent to the seller");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-[520px] rounded-3xl" />
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-3xl">Outfit not found</h1>
          <Button asChild className="mt-6">
            <Link to="/browse">Back to browsing</Link>
          </Button>
        </main>
      </div>
    );
  }

  const fitNotes = Object.entries((item.fit_notes as Record<string, unknown>) ?? {});
  const canBuy = item.mode !== "swap" && item.price_cents > 0;
  const canSwap = item.mode !== "buy";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl shadow-soft">
          <img
            src={listingImage(item)}
            alt={item.title}
            width={800}
            height={1000}
            className="size-full object-cover"
          />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-4xl">{item.title}</h1>
            <p className="text-sm text-muted-foreground">
              Listed by {item.seller_name ?? "a Closy member"}
            </p>
            <p className="text-2xl font-semibold">
              {formatPrice(item.price_cents, item.currency)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.brand ? <Badge variant="secondary">{item.brand}</Badge> : null}
            {item.size_label ? <Badge variant="secondary">Size {item.size_label}</Badge> : null}
            <Badge variant="secondary">{item.condition}</Badge>
            {(item.style_tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {item.description ? <p className="text-muted-foreground">{item.description}</p> : null}

          {fitNotes.length > 0 ? (
            <div className="card-soft p-5">
              <h2 className="text-lg">Fit measurements</h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {fitNotes.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{key.replace(/_/g, " ")}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {canBuy ? (
              <Button
                size="lg"
                onClick={() => (user ? setBuyOpen(true) : toast.error("Sign in to buy"))}
              >
                <ShoppingBag className="mr-1 size-4" /> Buy now
              </Button>
            ) : null}
            {canSwap ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => (user ? setSwapOpen(true) : toast.error("Sign in to swap"))}
              >
                <Repeat className="mr-1 size-4" /> Offer a swap
              </Button>
            ) : null}
            <Button size="lg" variant="ghost" onClick={toggleFavourite}>
              <Heart className={`mr-1 size-4 ${favourited ? "fill-current" : ""}`} />
              {favourited ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              {item.title} — {formatPrice(item.price_cents, item.currency)}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Card payments are not switched on yet, so Closy will reserve this outfit for you and the
            seller will confirm delivery details.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBuyOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={confirmPurchase}>
              Reserve this outfit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer a swap</DialogTitle>
            <DialogDescription>Offer one of your outfits in exchange.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your outfit</Label>
              <Select value={offered} onValueChange={setOffered}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose one of your listings" />
                </SelectTrigger>
                <SelectContent>
                  {(myListings ?? []).map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(myListings ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You have no listings yet —{" "}
                  <Link to="/sell" className="underline">
                    list an outfit
                  </Link>{" "}
                  to swap.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="swap-message">Message</Label>
              <Textarea
                id="swap-message"
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Hi! Would you swap this for my lilac skirt?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSwapOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={sendSwap}>
              Send offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

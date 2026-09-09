import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { formatPrice, listingImage } from "@/lib/listing-images";

export type ListingRow = {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  size_label: string | null;
  condition: string;
  colour: string | null;
  style_tags: string[] | null;
  price_cents: number;
  currency: string;
  image_key: string | null;
  image_url: string | null;
  mode: string;
  seller_name: string | null;
  description?: string | null;
  fit_notes?: Record<string, unknown> | null;
  status?: string;
};

const modeLabel: Record<string, string> = {
  buy: "For sale",
  swap: "Swap only",
  both: "Buy or swap",
};

export function ListingCard({ item }: { item: ListingRow }) {
  return (
    <Link to="/item/$id" params={{ id: item.id }} className="group block">
      <article className="card-soft lift-hover overflow-hidden">
        <div className="aspect-4/5 overflow-hidden bg-secondary">
          <img
            src={listingImage(item)}
            alt={item.title}
            loading="lazy"
            width={800}
            height={1000}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base leading-snug">{item.title}</h3>
            <span className="shrink-0 text-sm font-semibold">
              {formatPrice(item.price_cents, item.currency)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {[item.brand, item.size_label ? `Size ${item.size_label}` : null, item.condition]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary">{modeLabel[item.mode] ?? item.mode}</Badge>
            {(item.style_tags ?? []).slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}

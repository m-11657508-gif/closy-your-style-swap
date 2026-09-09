import blazerBlue from "@/assets/blazer-blue.jpg";
import cardiganPink from "@/assets/cardigan-pink.jpg";
import dressCream from "@/assets/dress-cream.jpg";
import jeansDenim from "@/assets/jeans-denim.jpg";
import shirtBlue from "@/assets/shirt-blue.jpg";
import skirtLilac from "@/assets/skirt-lilac.jpg";

const imagesByKey: Record<string, string> = {
  "dress-cream": dressCream,
  "blazer-blue": blazerBlue,
  "cardigan-pink": cardiganPink,
  "jeans-denim": jeansDenim,
  "skirt-lilac": skirtLilac,
  "shirt-blue": shirtBlue,
};

export const imageKeyOptions = Object.keys(imagesByKey);

export function listingImage(item: {
  image_key?: string | null;
  image_url?: string | null;
}): string {
  if (item.image_url) return item.image_url;
  const mapped = item.image_key ? imagesByKey[item.image_key] : undefined;
  return mapped ?? dressCream;
}

export function formatPrice(cents: number, currency = "MYR") {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

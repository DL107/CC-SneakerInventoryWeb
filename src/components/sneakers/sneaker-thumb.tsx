import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholders/sneaker-placeholder.svg";

export function SneakerThumb({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    // object-contain (not cover) so transparent-background sneaker shots
    // keep their full silhouette instead of being cropped to the frame.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src || PLACEHOLDER} alt={alt} className={cn("object-contain", className)} />
  );
}

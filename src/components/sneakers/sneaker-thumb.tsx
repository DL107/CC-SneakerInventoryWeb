import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholders/sneaker-placeholder.svg";

export function SneakerThumb({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src || PLACEHOLDER} alt={alt} className={cn("object-cover", className)} />
  );
}

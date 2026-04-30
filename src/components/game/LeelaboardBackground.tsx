import Image from "next/image";

export function LeelaboardBackground() {
  return (
    <Image
      src="/board-background-9x8.png"
      alt=""
      aria-hidden
      fill
      priority
      className="pointer-events-none absolute inset-0 object-cover"
      sizes="(max-width: 768px) 100vw, 80vw"
    />
  );
}

type ReviewStarsProps = {
  rating: number;
  label: string;
  size?: "sm" | "md";
};

function Star({ fill, size }: { fill: number; size: number }) {
  const clip = Math.round(Math.min(1, Math.max(0, fill)) * 100);

  return (
    <span
      className="relative inline-block shrink-0 text-glow"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="text-foreground/20"
        fill="currentColor"
      >
        <path d="M12 3.2 14.6 9l6.4.7-4.8 4.3 1.4 6.3L12 17.2 6.4 20.3 7.8 14 3 9.7 9.4 9z" />
      </svg>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${clip}%` }}
      >
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className="text-glow"
          fill="currentColor"
        >
          <path d="M12 3.2 14.6 9l6.4.7-4.8 4.3 1.4 6.3L12 17.2 6.4 20.3 7.8 14 3 9.7 9.4 9z" />
        </svg>
      </span>
    </span>
  );
}

export function ReviewStars({
  rating,
  label,
  size = "sm",
}: ReviewStarsProps) {
  const px = size === "md" ? 16 : 13;

  return (
    <span
      className="inline-flex items-center gap-[2px]"
      role="img"
      aria-label={label}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} fill={rating - index} size={px} />
      ))}
    </span>
  );
}

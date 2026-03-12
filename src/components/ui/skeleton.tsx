import { cn } from "@/lib/utils";

type SkeletonVariant = 'base' | 'gold' | 'vida';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

function Skeleton({ className, variant = 'base', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        variant === 'gold' && "sk-gold",
        variant === 'vida' && "sk-vida",
        variant === 'base' && "sk",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonVariant };

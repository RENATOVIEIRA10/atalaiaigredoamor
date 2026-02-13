import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CoupleAvatarsProps {
  spouse1?: { name?: string; avatar_url?: string | null } | null;
  spouse2?: { name?: string; avatar_url?: string | null } | null;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function CoupleAvatars({ spouse1, spouse2, size = 'md', onClick, className }: CoupleAvatarsProps) {
  return (
    <div className={cn("flex -space-x-3 cursor-pointer", className)} onClick={onClick}>
      <Avatar className={cn(sizeClasses[size], "border-2 border-background z-10")}>
        <AvatarImage src={spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {spouse1?.name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      <Avatar className={cn(sizeClasses[size], "border-2 border-background")}>
        <AvatarImage src={spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {spouse2?.name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

import { Heart, Eye, LayoutGrid, Network, Crown, Shield, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  eye: Eye,
  grid: LayoutGrid,
  network: Network,
  crown: Crown,
  shield: Shield,
  sunrise: Sunrise,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export function OnboardingIcon({ name, size = 18, className }: Props) {
  const Icon = iconMap[name] || Heart;
  return <Icon size={size} className={className} strokeWidth={1.6} />;
}

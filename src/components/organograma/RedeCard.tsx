import { useState } from 'react';
import { Network } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import type { OrgNode } from '@/hooks/useOrganograma';

interface RedeCardProps {
  node: OrgNode;
}

export function RedeCard({ node }: RedeCardProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div
        className="w-full max-w-lg mx-auto rounded-xl border border-primary/25 bg-card p-4 shadow-md cursor-pointer card-hover"
        onClick={() => setShowProfile(true)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-3 shrink-0">
            <Avatar className="h-12 w-12 border-2 border-primary/20 z-10 ring-2 ring-background">
              <AvatarImage src={node.spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {node.spouse1?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <Avatar className="h-12 w-12 border-2 border-primary/20 ring-2 ring-background">
              <AvatarImage src={node.spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {node.spouse2?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 mb-1 bg-primary/10 text-primary border-primary/20 gap-1">
              <Network className="h-3 w-3" />
              Líderes de Rede
            </Badge>
            <h4 className="font-bold text-foreground truncate">{node.name}</h4>
            {node.coupleName && (
              <p className="text-xs text-muted-foreground truncate">{node.coupleName}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-primary">{node.childrenCount}</p>
            <p className="text-[10px] text-muted-foreground">coordenações</p>
          </div>
        </div>
      </div>

      {showProfile && (
        <ProfileViewerDialog
          open={showProfile}
          onOpenChange={setShowProfile}
          person1={node.spouse1}
          person2={node.spouse2}
          entityType="rede"
          entityName={node.name}
        />
      )}
    </>
  );
}

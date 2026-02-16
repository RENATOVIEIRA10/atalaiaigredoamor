import { useState } from 'react';
import { Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import type { OrgNode } from '@/hooks/useOrganograma';

interface CelulaCardOrgProps {
  node: OrgNode;
  searchQuery: string;
}

export function CelulaCardOrg({ node, searchQuery }: CelulaCardOrgProps) {
  const [showProfile, setShowProfile] = useState(false);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!node.name.toLowerCase().includes(q) && !node.coupleName?.toLowerCase().includes(q)) return null;
  }

  return (
    <>
      <div
        className="flex items-center gap-2 p-2 rounded-md border border-border/40 bg-card hover:bg-accent/20 transition-colors cursor-pointer"
        onClick={() => setShowProfile(true)}
      >
        <div className="flex items-center -space-x-1.5 shrink-0">
          <Avatar className="h-6 w-6 border border-background z-10">
            <AvatarImage src={node.spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
            <AvatarFallback className="bg-accent text-accent-foreground text-[8px]">
              {node.spouse1?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          {node.spouse2 && (
            <Avatar className="h-6 w-6 border border-background">
              <AvatarImage src={node.spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="bg-accent text-accent-foreground text-[8px]">
                {node.spouse2?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground truncate flex items-center gap-1">
            <Home className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            {node.name}
          </p>
          {node.coupleName && (
            <p className="text-[10px] text-muted-foreground truncate">{node.coupleName}</p>
          )}
        </div>
      </div>

      {showProfile && (
        <ProfileViewerDialog
          open={showProfile}
          onOpenChange={setShowProfile}
          person1={node.spouse1}
          person2={node.spouse2}
          entityType="celula"
          entityName={node.name}
        />
      )}
    </>
  );
}

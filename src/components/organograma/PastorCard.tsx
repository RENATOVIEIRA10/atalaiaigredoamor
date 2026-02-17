import { useState } from 'react';
import { Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import type { OrgNode } from '@/hooks/useOrganograma';

interface PastorCardProps {
  node: OrgNode;
}

export function PastorCard({ node }: PastorCardProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div
        className="relative w-full max-w-md mx-auto rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-accent to-card p-6 shadow-lg glow-gold cursor-pointer card-hover"
        onClick={() => setShowProfile(true)}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow">
            <Crown className="h-3.5 w-3.5" />
            Pastores Sêniores
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex items-center -space-x-4">
            <Avatar className="h-16 w-16 border-[3px] border-primary/30 z-10 ring-2 ring-background">
              <AvatarImage src={node.spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
                {node.spouse1?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <Avatar className="h-16 w-16 border-[3px] border-primary/30 ring-2 ring-background">
              <AvatarImage src={node.spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
                {node.spouse2?.name?.charAt(0) || 'T'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-foreground">{node.coupleName || 'Pr. Arthur & Pra. Talitha'}</h3>
          </div>
        </div>
      </div>

      {showProfile && (
        <ProfileViewerDialog
          open={showProfile}
          onOpenChange={setShowProfile}
          person1={node.spouse1}
          person2={node.spouse2}
          entityType="pastor"
          entityName="Igreja do Amor"
          coupleId={node.coupleId || undefined}
        />
      )}
    </>
  );
}

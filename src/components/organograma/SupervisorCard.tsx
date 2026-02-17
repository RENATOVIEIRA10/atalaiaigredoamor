import { useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import { CelulaCardOrg } from './CelulaCardOrg';
import type { OrgNode } from '@/hooks/useOrganograma';
import { cn } from '@/lib/utils';

interface SupervisorCardProps {
  node: OrgNode;
  searchQuery: string;
}

function matchesSearch(node: OrgNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.coupleName?.toLowerCase().includes(q)) return true;
  return node.children.some(child => matchesSearch(child, q));
}

export function SupervisorCard({ node, searchQuery }: SupervisorCardProps) {
  const [expanded, setExpanded] = useState(!!searchQuery);
  const [showProfile, setShowProfile] = useState(false);
  const hasChildren = node.children.length > 0;

  if (searchQuery && !matchesSearch(node, searchQuery)) return null;

  return (
    <>
      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <div
          className="flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          <div
            className="shrink-0"
            onClick={(e) => { e.stopPropagation(); setShowProfile(true); }}
          >
            <div className="flex items-center -space-x-2">
              <Avatar className="h-8 w-8 border-2 border-background z-10">
                <AvatarImage src={node.spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
                <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">
                  {node.spouse1?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarImage src={node.spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
                <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">
                  {node.spouse2?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-border/50 gap-0.5">
                <ClipboardCheck className="h-2.5 w-2.5" />
                Supervisor
              </Badge>
              {hasChildren && (
                <span className="text-[9px] text-muted-foreground">{node.children.length} cél.</span>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground truncate mt-0.5">
              {node.coupleName || node.name}
            </p>
          </div>

          {hasChildren && (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )
          )}
        </div>

        {expanded && hasChildren && (
          <div className="border-t border-border/40 p-2 bg-secondary/20 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {node.children.map(cel => (
                <CelulaCardOrg key={cel.id} node={cel} searchQuery={searchQuery} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showProfile && (
        <ProfileViewerDialog
          open={showProfile}
          onOpenChange={setShowProfile}
          person1={node.spouse1}
          person2={node.spouse2}
          entityType="supervisor"
          entityName={node.name}
          coupleId={node.coupleId || undefined}
        />
      )}
    </>
  );
}

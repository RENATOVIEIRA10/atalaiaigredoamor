import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderTree, Users, ClipboardCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import { SupervisorCard } from './SupervisorCard';
import { CelulaCardOrg } from './CelulaCardOrg';
import type { OrgNode } from '@/hooks/useOrganograma';
import { cn } from '@/lib/utils';

interface CoordenacaoCardProps {
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

export function CoordenacaoCard({ node, searchQuery }: CoordenacaoCardProps) {
  const [expanded, setExpanded] = useState(!!searchQuery);
  const [showProfile, setShowProfile] = useState(false);

  if (searchQuery && !matchesSearch(node, searchQuery)) return null;

  const supervisors = node.children.filter(c => c.type === 'supervisor');
  const directCelulas = node.children.filter(c => c.type === 'celula');
  const totalCelulas = supervisors.reduce((sum, s) => sum + s.children.length, 0) + directCelulas.length;

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden card-hover">
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div
            className="shrink-0"
            onClick={(e) => { e.stopPropagation(); setShowProfile(true); }}
          >
            <div className="flex items-center -space-x-2">
              <Avatar className="h-10 w-10 border-2 border-primary/15 z-10 ring-1 ring-background">
                <AvatarImage src={node.spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {node.spouse1?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-10 w-10 border-2 border-primary/15 ring-1 ring-background">
                <AvatarImage src={node.spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {node.spouse2?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/15 gap-0.5">
                <FolderTree className="h-2.5 w-2.5" />
                Coordenação
              </Badge>
            </div>
            <h4 className="font-bold text-sm text-foreground truncate">{node.name}</h4>
            {node.coupleName && (
              <p className="text-xs text-muted-foreground truncate">{node.coupleName}</p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-3 text-center">
              <div>
                <p className="text-sm font-bold text-foreground">{supervisors.length}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">
                  <ClipboardCheck className="h-2.5 w-2.5 inline mr-0.5" />
                  sup.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{totalCelulas}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">
                  <Users className="h-2.5 w-2.5 inline mr-0.5" />
                  cél.
                </p>
              </div>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className={cn("border-t border-border p-3 space-y-2 bg-secondary/30 animate-fade-in")}>
            {supervisors.map(sup => (
              <SupervisorCard key={sup.id} node={sup} searchQuery={searchQuery} />
            ))}
            {directCelulas.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1">Células sem supervisor</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {directCelulas.map(cel => (
                    <CelulaCardOrg key={cel.id} node={cel} searchQuery={searchQuery} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showProfile && (
        <ProfileViewerDialog
          open={showProfile}
          onOpenChange={setShowProfile}
          person1={node.spouse1}
          person2={node.spouse2}
          entityType="coordenacao"
          entityName={node.name}
          coupleId={node.coupleId || undefined}
        />
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HandHeart, Plus, X, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const MINISTRY_SUGGESTIONS = [
  'Louvor', 'Intercessão', 'Recepção', 'Mídia', 'Kids',
  'Batismo/Aclamação', 'Recomeço', 'Central de Células',
  'Discipulado', 'Ação Social', 'Diaconia', 'Teatro', 'Dança',
];

interface MinistryEditBlockProps {
  memberId: string;
  serveMinisterio: boolean;
  ministerios: string[];
  observacaoServico: string | null;
  canEdit: boolean;
}

export function MinistryEditBlock({
  memberId,
  serveMinisterio,
  ministerios,
  observacaoServico,
  canEdit,
}: MinistryEditBlockProps) {
  const [serves, setServes] = useState(serveMinisterio);
  const [tags, setTags] = useState<string[]>(ministerios);
  const [role, setRole] = useState(observacaoServico || '');
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setServes(serveMinisterio);
    setTags(ministerios);
    setRole(observacaoServico || '');
    setDirty(false);
  }, [serveMinisterio, ministerios, observacaoServico]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setDirty(true);
  };

  const addCustom = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setDirty(true);
    }
    setCustomTag('');
  };

  const handleSave = async () => {
    if (serves && tags.length === 0) {
      toast({ title: 'Selecione ao menos 1 ministério', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('members')
      .update({
        serve_ministerio: serves,
        ministerios: serves ? tags : [],
        observacao_servico: serves ? (role || null) : null,
      })
      .eq('id', memberId);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ministério atualizado!' });
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-profile', memberId] });
      queryClient.invalidateQueries({ queryKey: ['global-pastoral-ranking'] });
    }
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandHeart className="h-5 w-5 text-primary" />
            Ministério
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serveMinisterio ? (
            <div className="space-y-2">
              <Badge variant="default" className="bg-green-600">Serve em ministério</Badge>
              {ministerios.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {ministerios.map(min => (
                    <Badge key={min} variant="secondary">{min}</Badge>
                  ))}
                </div>
              )}
              {observacaoServico && (
                <p className="text-xs text-muted-foreground mt-1">Função: {observacaoServico}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ainda não serve em ministério.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HandHeart className="h-5 w-5 text-primary" />
          Serviço / Ministério
        </CardTitle>
        <CardDescription>Defina se o membro serve em algum ministério</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="serve-toggle" className="text-sm font-medium">
            Serve em algum ministério?
          </Label>
          <Switch
            id="serve-toggle"
            checked={serves}
            onCheckedChange={(v) => { setServes(v); setDirty(true); }}
          />
        </div>

        {serves && (
          <>
            {/* Tag picker */}
            <div className="space-y-2">
              <Label className="text-sm">Onde serve? (selecione ou adicione)</Label>
              <div className="flex flex-wrap gap-2">
                {MINISTRY_SUGGESTIONS.map(s => (
                  <Badge
                    key={s}
                    variant={tags.includes(s) ? 'default' : 'outline'}
                    className="cursor-pointer select-none transition-colors"
                    onClick={() => toggleTag(s)}
                  >
                    {tags.includes(s) && <X className="h-3 w-3 mr-1" />}
                    {s}
                  </Badge>
                ))}
                {/* Custom tags not in suggestions */}
                {tags.filter(t => !MINISTRY_SUGGESTIONS.includes(t)).map(t => (
                  <Badge
                    key={t}
                    variant="default"
                    className="cursor-pointer select-none"
                    onClick={() => toggleTag(t)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t}
                  </Badge>
                ))}
              </div>

              {/* Add custom */}
              <div className="flex gap-2">
                <Input
                  placeholder="Outro ministério…"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                  className="h-9 text-sm"
                />
                <Button type="button" size="sm" variant="outline" onClick={addCustom} disabled={!customTag.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <Label className="text-sm">Função (opcional)</Label>
              <Input
                placeholder="Ex: Líder, Apoio, Voluntário"
                value={role}
                onChange={(e) => { setRole(e.target.value); setDirty(true); }}
                className="h-9 text-sm"
              />
            </div>
          </>
        )}

        {dirty && (
          <Button onClick={handleSave} disabled={saving} className="w-full h-11">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Ministério
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

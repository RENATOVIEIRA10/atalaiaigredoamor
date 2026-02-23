import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRede, RedeInfo } from '@/contexts/RedeContext';
import { Loader2, Network } from 'lucide-react';

interface RedeSelectorProps {
  onSelected: () => void;
}

export function RedeSelector({ onSelected }: RedeSelectorProps) {
  const { setActiveRede, setRedes } = useRede();
  const [loading, setLoading] = useState(true);
  const [availableRedes, setAvailableRedes] = useState<RedeInfo[]>([]);

  useEffect(() => {
    loadRedes();
  }, []);

  async function loadRedes() {
    const { data } = await supabase
      .from('redes')
      .select('id, name, slug, ativa')
      .eq('ativa', true)
      .order('name');

    const list = (data || []).map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      ativa: r.ativa,
    }));
    setAvailableRedes(list);
    setRedes(list);
    setLoading(false);
  }

  function handleSelect(rede: RedeInfo) {
    setActiveRede(rede);
    onSelected();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Network className="h-5 w-5" style={{ color: '#C5A059' }} />
          <h2
            className="text-lg font-semibold"
            style={{ color: '#F4EDE4', fontFamily: "'Outfit', sans-serif" }}
          >
            Selecione a Rede
          </h2>
        </div>
        <p className="text-xs" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif" }}>
          Escolha a rede que deseja acessar
        </p>
      </div>

      <div className="grid gap-3">
        {availableRedes.map((rede) => (
          <button
            key={rede.id}
            onClick={() => handleSelect(rede)}
            className="w-full p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] btn-tap"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(197,160,89,0.2)',
              borderRadius: '12px',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(197,160,89,0.2) 0%, rgba(197,160,89,0.08) 100%)',
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: '#C5A059', fontFamily: "'Outfit', sans-serif" }}
                >
                  {rede.name.charAt(0)}
                </span>
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: '#F4EDE4', fontFamily: "'Inter', sans-serif" }}
                >
                  {rede.name}
                </p>
                {rede.slug && (
                  <p className="text-[11px]" style={{ color: '#B8B6B3' }}>
                    {rede.slug}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

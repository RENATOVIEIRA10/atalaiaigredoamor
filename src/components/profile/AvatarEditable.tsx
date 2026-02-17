import { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { compressImage } from '@/utils/imageCompression';

interface AvatarEditableProps {
  /** The current avatar URL */
  currentUrl?: string | null;
  /** Whether the user can edit this avatar */
  canEdit?: boolean;
  /** Callback after successful save with the new public URL */
  onSaved?: (newUrl: string) => void;
  /** Fallback text (initials) when no image */
  fallbackText?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional class names */
  className?: string;
  /** Storage bucket to upload to */
  bucket?: string;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
};

type AvatarState = 'idle' | 'preview' | 'uploading' | 'success' | 'error';

export function AvatarEditable({
  currentUrl,
  canEdit = false,
  onSaved,
  fallbackText = '?',
  size = 'lg',
  className,
  bucket = 'avatars',
}: AvatarEditableProps) {
  const [state, setState] = useState<AvatarState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const displayUrl = previewUrl || currentUrl;

  const resetState = useCallback(() => {
    setState('idle');
    setPreviewUrl(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato inválido', description: 'Selecione uma imagem JPG, PNG ou WebP.', variant: 'destructive' });
      return;
    }

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O arquivo deve ter no máximo 2MB. Tente uma foto menor.', variant: 'destructive' });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setState('preview');
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  }, [toast]);

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;
    setState('uploading');

    try {
      const compressed = await compressImage(selectedFile, { maxDimension: 512, targetSizeKB: 200 });
      const filePath = `${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressed, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setState('success');
      onSaved?.(publicUrl);

      // Invalidate all relevant queries for global propagation
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      queryClient.invalidateQueries({ queryKey: ['redes'] });
      queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });
      queryClient.invalidateQueries({ queryKey: ['organograma'] });
      queryClient.invalidateQueries({ queryKey: ['casais'] });

      toast({ title: 'Foto atualizada!' });

      // Reset after brief success indicator
      setTimeout(resetState, 1200);
    } catch (error: any) {
      setState('error');
      toast({ title: 'Erro ao enviar foto', description: error.message, variant: 'destructive' });
      setTimeout(() => setState('preview'), 2000);
    }
  }, [selectedFile, bucket, onSaved, queryClient, toast, resetState]);

  const handleCancel = useCallback(() => {
    resetState();
  }, [resetState]);

  const openFilePicker = useCallback(() => {
    if (canEdit && state === 'idle') {
      inputRef.current?.click();
    }
  }, [canEdit, state]);

  // --- Render ---

  const isPreviewMode = state === 'preview' || state === 'uploading' || state === 'success' || state === 'error';

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Avatar */}
      <div className="relative group inline-block">
        <button
          type="button"
          onClick={openFilePicker}
          disabled={!canEdit || state !== 'idle'}
          className={cn(
            "relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            canEdit && state === 'idle' && "cursor-pointer",
            (!canEdit || state !== 'idle') && "cursor-default"
          )}
          aria-label={canEdit ? 'Alterar foto' : undefined}
          tabIndex={canEdit ? 0 : -1}
        >
          <Avatar className={cn(sizeClasses[size], "border-2 border-background")}>
            <AvatarImage src={displayUrl || undefined} crossOrigin="anonymous" />
            <AvatarFallback className="bg-accent text-accent-foreground text-lg">
              {state === 'uploading' ? (
                <Loader2 className={cn(iconSizes[size], "animate-spin")} />
              ) : state === 'success' ? (
                <Check className={cn(iconSizes[size], "text-green-500")} />
              ) : (
                fallbackText
              )}
            </AvatarFallback>
          </Avatar>

          {/* Overlay — desktop hover + mobile active (only in idle state) */}
          {canEdit && state === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-200">
              <Camera className={cn(iconSizes[size], "text-white")} />
              <span className="text-[10px] text-white mt-0.5 font-medium">Alterar</span>
            </div>
          )}

          {/* Uploading overlay */}
          {state === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className={cn(iconSizes[size], "text-white animate-spin")} />
            </div>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Microcopy — only when editable and idle */}
      {canEdit && state === 'idle' && (
        <p className="text-xs text-muted-foreground">Toque/clique para alterar a foto</p>
      )}

      {/* Preview actions */}
      {isPreviewMode && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={state === 'uploading' || state === 'success'}
            className="gap-1"
          >
            {state === 'uploading' ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Enviando…
              </>
            ) : state === 'success' ? (
              <>
                <Check className="h-3 w-3" />
                Salvo!
              </>
            ) : (
              'Salvar'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={state === 'uploading'}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

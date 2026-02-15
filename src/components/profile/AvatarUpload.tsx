import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { compressImage } from '@/utils/imageCompression';

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

export function AvatarUpload({ currentUrl, onUploaded, fallbackText = '?', size = 'md', className }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const displayUrl = previewUrl || currentUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato inválido', description: 'Selecione uma imagem JPG ou PNG', variant: 'destructive' });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 512, targetSizeKB: 200 });
      const fileExt = 'jpg';
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUploaded(publicUrl);
      toast({ title: 'Foto enviada!' });
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("relative group inline-block", className)}>
      <Avatar className={cn(sizeClasses[size], "border-2 border-background cursor-pointer")} onClick={() => inputRef.current?.click()}>
        <AvatarImage src={displayUrl || undefined} crossOrigin="anonymous" />
        <AvatarFallback className="bg-accent text-accent-foreground text-sm">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : fallbackText}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Camera className="h-4 w-4 text-white" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

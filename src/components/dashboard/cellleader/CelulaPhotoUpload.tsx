import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';

interface CelulaPhotoUploadProps {
  photoUrl?: string | null;
  onPhotoChange: (url: string | null) => void;
  celulaId: string;
  weekStart: string;
}

export function CelulaPhotoUpload({ photoUrl, onPhotoChange, celulaId, weekStart }: CelulaPhotoUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Compress image before upload
      const compressed = await compressImage(file, { maxDimension: 1920, targetSizeKB: 800 });
      
      // Generate unique filename
      const fileExt = 'jpg';
      const fileName = `${celulaId}/${weekStart}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('celula-photos')
        .upload(fileName, compressed, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('celula-photos')
        .getPublicUrl(fileName);

      onPhotoChange(publicUrl);
      
      toast({
        title: 'Foto enviada!',
        description: 'A foto da célula foi salva com sucesso',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar a foto',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (photoUrl) {
      // Extract path from URL
      const urlParts = photoUrl.split('/celula-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('celula-photos').remove([filePath]);
      }
    }
    onPhotoChange(null);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Foto da Célula
      </Label>
      
      {photoUrl ? (
        <div className="relative">
          <img
            src={photoUrl}
            alt="Foto da célula"
            crossOrigin="anonymous"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemovePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Enviando foto...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Clique para adicionar uma foto da célula
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo 10MB • JPG, PNG
              </p>
            </div>
          )}
        </div>
      )}
      
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}

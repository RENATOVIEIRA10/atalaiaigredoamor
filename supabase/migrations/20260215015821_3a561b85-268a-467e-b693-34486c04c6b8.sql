
-- Add WhatsApp-related fields to celulas
ALTER TABLE public.celulas 
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS instagram_lider1 text,
ADD COLUMN IF NOT EXISTS instagram_lider2 text,
ADD COLUMN IF NOT EXISTS instagram_celula text;

-- Add message fields to weekly_reports
ALTER TABLE public.weekly_reports
ADD COLUMN IF NOT EXISTS mensagem_whatsapp text,
ADD COLUMN IF NOT EXISTS paixao_whatsapp text,
ADD COLUMN IF NOT EXISTS cultura_whatsapp text;

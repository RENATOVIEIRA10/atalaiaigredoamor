import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { WeeklyReport } from '@/hooks/useWeeklyReports';
import { format, parseISO } from 'date-fns';

interface ReportEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: WeeklyReport | null;
  onSave: (data: {
    id: string;
    members_present: number;
    leaders_in_training: number;
    discipleships: number;
    visitors: number;
    children: number;
    notes: string | null;
  }) => void;
  isLoading?: boolean;
}

export function ReportEditDialog({ open, onOpenChange, report, onSave, isLoading }: ReportEditDialogProps) {
  // Use string state to allow clearing the field while typing (avoids "01" bug)
  const [formData, setFormData] = useState({
    members_present: '',
    leaders_in_training: '',
    discipleships: '',
    visitors: '',
    children: '',
    notes: '',
  });

  useEffect(() => {
    if (report) {
      setFormData({
        members_present: String(report.members_present),
        leaders_in_training: String(report.leaders_in_training),
        discipleships: String(report.discipleships),
        visitors: String(report.visitors),
        children: String(report.children),
        notes: report.notes || '',
      });
    }
  }, [report]);

  const toInt = (val: string) => {
    const n = parseInt(val, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const handleNumericChange = (field: keyof typeof formData, value: string) => {
    // Allow empty string while typing; strip leading zeros except single "0"
    const sanitized = value.replace(/[^0-9]/g, '');
    const cleaned = sanitized === '' ? '' : String(parseInt(sanitized, 10));
    setFormData(prev => ({ ...prev, [field]: cleaned }));
  };

  const handleBlur = (field: keyof typeof formData) => {
    // On blur, ensure empty becomes "0"
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] === '' ? '0' : prev[field],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    
    onSave({
      id: report.id,
      members_present: toInt(formData.members_present),
      leaders_in_training: toInt(formData.leaders_in_training),
      discipleships: toInt(formData.discipleships),
      visitors: toInt(formData.visitors),
      children: toInt(formData.children),
      notes: formData.notes || null,
    });
  };

  const reportDate = report?.meeting_date || report?.week_start;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Relatório</DialogTitle>
          <DialogDescription>
            {report?.celula?.name} - {reportDate ? format(parseISO(reportDate), 'dd/MM/yyyy') : 'Data não disponível'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="members_present">Membros Presentes</Label>
              <Input
                id="members_present"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.members_present}
                onChange={(e) => handleNumericChange('members_present', e.target.value)}
                onBlur={() => handleBlur('members_present')}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaders_in_training">Líderes em Treinamento</Label>
              <Input
                id="leaders_in_training"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.leaders_in_training}
                onChange={(e) => handleNumericChange('leaders_in_training', e.target.value)}
                onBlur={() => handleBlur('leaders_in_training')}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discipleships">Discipulados</Label>
              <Input
                id="discipleships"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.discipleships}
                onChange={(e) => handleNumericChange('discipleships', e.target.value)}
                onBlur={() => handleBlur('discipleships')}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitors">Visitantes</Label>
              <Input
                id="visitors"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.visitors}
                onChange={(e) => handleNumericChange('visitors', e.target.value)}
                onBlur={() => handleBlur('visitors')}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Crianças</Label>
              <Input
                id="children"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.children}
                onChange={(e) => handleNumericChange('children', e.target.value)}
                onBlur={() => handleBlur('children')}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a reunião..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

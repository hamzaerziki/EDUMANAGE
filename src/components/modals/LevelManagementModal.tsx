import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  GraduationCap, 
  Settings, 
  Edit, 
  Trash2, 
  FolderOpen, 
  Save, 
  X, 
  AlertTriangle,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { categoriesApi, levelsApi, type Category, type EducationLevel } from '@/lib/api';

interface LevelManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLevelsUpdated?: () => void;
}

export const LevelManagementModal: React.FC<LevelManagementModalProps> = ({
  open,
  onOpenChange,
  onLevelsUpdated
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      loadLevels();
    }
  }, [open]);
  
  const loadLevels = async () => {
    try {
      setLoading(true);
      const data = await levelsApi.list({ active_only: false });
      setLevels(data.sort((a, b) => a.order_index - b.order_index));
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to load education levels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInitializeDefaults = async () => {
    if (!confirm('This will create default Moroccan education levels. Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      await levelsApi.initializeDefaults();
      toast({
        title: t.success || 'Success',
        description: 'Default education levels initialized successfully'
      });
      await loadLevels();
      onLevelsUpdated?.();
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to initialize default levels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {t.levelManagement || 'Education Level Management'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t.existingLevels || 'Existing Levels'}</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleInitializeDefaults}
              disabled={loading}
            >
              <Settings className="h-4 w-4 mr-1" />
              {t.initializeDefaults || 'Initialize Defaults'}
            </Button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.loading || 'Loading...'}
              </div>
            ) : levels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.noLevelsFound || 'No education levels found. Click "Initialize Defaults" to create default levels.'}
              </div>
            ) : (
              levels.map((level) => (
                <div key={level.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{level.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Category: {level.category} • {level.grades?.length || 0} grades
                      </p>
                    </div>
                    {!level.is_active && (
                      <span className="text-xs text-red-500">Inactive</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelManagementModal;
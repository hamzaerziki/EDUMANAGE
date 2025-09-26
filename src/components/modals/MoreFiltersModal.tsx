import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";

interface MoreFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFiltersApply: (filters: any) => void;
}

const MoreFiltersModal = ({ open, onOpenChange, onFiltersApply }: MoreFiltersModalProps) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    enrollmentDateFrom: "",
    enrollmentDateTo: "",
    ageRange: [13, 18],
    gpaRange: [0, 4],
    attendanceRange: [0, 100],
    classes: [] as string[],
    hasParentEmail: false,
    hasUnpaidFees: false
  });

  const availableClasses = ["9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClassToggle = (className: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      classes: checked 
        ? [...prev.classes, className]
        : prev.classes.filter(c => c !== className)
    }));
  };

  const applyFilters = () => {
    onFiltersApply(filters);
    onOpenChange(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      enrollmentDateFrom: "",
      enrollmentDateTo: "",
      ageRange: [13, 18],
      gpaRange: [0, 4],
      attendanceRange: [0, 100],
      classes: [],
      hasParentEmail: false,
      hasUnpaidFees: false
    };
    setFilters(clearedFilters);
    onFiltersApply(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value !== '';
    return false;
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t.advancedFilters || 'Advanced Filters'}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              {t.clearAll || 'Clear All'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t.enrollmentDateRange || 'Enrollment Date Range'}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">{t.from || 'From'}</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.enrollmentDateFrom}
                  onChange={(e) => handleFilterChange("enrollmentDateFrom", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">{t.to || 'To'}</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.enrollmentDateTo}
                  onChange={(e) => handleFilterChange("enrollmentDateTo", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {(t.ageRange || 'Age Range') + ': '}{filters.ageRange[0]} - {filters.ageRange[1]} {t.years || 'years'}
            </Label>
            <Slider
              value={filters.ageRange}
              onValueChange={(value) => handleFilterChange("ageRange", value)}
              max={20}
              min={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* GPA Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {(t.gpaRange || 'GPA Range') + ': '}{filters.gpaRange[0].toFixed(1)} - {filters.gpaRange[1].toFixed(1)}
            </Label>
            <Slider
              value={filters.gpaRange}
              onValueChange={(value) => handleFilterChange("gpaRange", value)}
              max={4}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Attendance Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {(t.attendanceRange || 'Attendance Range') + ': '}{filters.attendanceRange[0]}% - {filters.attendanceRange[1]}%
            </Label>
            <Slider
              value={filters.attendanceRange}
              onValueChange={(value) => handleFilterChange("attendanceRange", value)}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          {/* Classes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t.classes || 'Classes'}</Label>
            <div className="grid grid-cols-4 gap-2">
              {availableClasses.map((className) => (
                <div key={className} className="flex items-center space-x-2">
                  <Checkbox
                    id={className}
                    checked={filters.classes.includes(className)}
                    onCheckedChange={(checked) => handleClassToggle(className, checked as boolean)}
                  />
                  <Label htmlFor={className} className="text-sm">{className}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t.additionalFilters || 'Additional Filters'}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasParentEmail"
                  checked={filters.hasParentEmail}
                  onCheckedChange={(checked) => handleFilterChange("hasParentEmail", checked)}
                />
                <Label htmlFor="hasParentEmail" className="text-sm">{t.hasParentEmail || 'Has Parent Email'}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasUnpaidFees"
                  checked={filters.hasUnpaidFees}
                  onCheckedChange={(checked) => handleFilterChange("hasUnpaidFees", checked)}
                />
                <Label htmlFor="hasUnpaidFees" className="text-sm">{t.hasUnpaidFees || 'Has Unpaid Fees'}</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={applyFilters}>
            {(t.applyFilters || 'Apply Filters')} ({activeFiltersCount})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoreFiltersModal;
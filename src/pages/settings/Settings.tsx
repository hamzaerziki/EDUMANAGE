import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Language } from "@/lib/translations";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/apiClient";
import {
  RefreshCw,
  Save,
  Settings2,
  User,
  Database,
  Shield,
  Eye,
  EyeOff,
  Palette,
  Download,
  Upload,
} from "lucide-react";


const Settings = () => {
  const { language, setLanguage, t } = useTranslation();
  const { institutionSettings, updateInstitutionSettings, resetToDefaults } = useSettings();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState(institutionSettings);
  
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('app-font-size') || 'medium';
  });

  // Track changes to institution settings
  useEffect(() => {
    const hasSettingsChanged = JSON.stringify(localSettings) !== JSON.stringify(institutionSettings);
    setHasChanges(hasSettingsChanged);
  }, [localSettings, institutionSettings]);

  const handleSettingChange = (field: keyof typeof institutionSettings, value: string | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = () => {
    updateInstitutionSettings(localSettings);
    if (localSettings.language !== language) {
      setLanguage(localSettings.language as Language);
    }
    setHasChanges(false);
    toast({
      title: t.success,
      description: language === 'en' ? "Institution settings have been updated successfully."
                  : language === 'fr' ? "Les paramètres de l'institution ont été mis à jour avec succès."
                  : "تم تحديث إعدادات المؤسسة بنجاح.",
    });
  };

  const handleResetSettings = () => {
    resetToDefaults();
    setLocalSettings(institutionSettings);
    setHasChanges(false);
    toast({
      title: language === 'en' ? "Settings Reset" : language === 'fr' ? "Paramètres réinitialisés" : "تم إعادة تعيين الإعدادات",
      description: language === 'en' ? "Settings have been restored to default values."
                  : language === 'fr' ? "Les paramètres ont été restaurés aux valeurs par défaut."
                  : "تم استعادة الإعدادات إلى القيم الافتراضية.",
    });
  };
  // Handle dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle font size change
  useEffect(() => {
    localStorage.setItem('app-font-size', fontSize);
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  const [systemInfo, setSystemInfo] = useState({
    version: "1.2.4",
    totalStudents: 0,
  });

  useEffect(() => {
    const fetchSystemInfo = async () => {
      console.log("Fetching system info...");
      try {
        const response = await apiRequest("/system-info");
        console.log("System info response:", response);
        setSystemInfo(response.data);
      } catch (error) {
        console.error("Error fetching system info:", error);
      }
    };

    fetchSystemInfo();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.systemSettings}</h1>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage your system preferences and configurations' :
             language === 'fr' ? 'Gérez vos préférences et configurations système' :
             'إدارة تفضيلات وإعدادات النظام'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleResetSettings}>
            <RefreshCw className="h-4 w-4" />
            {language === 'en' ? 'Reset' : language === 'fr' ? 'Réinitialiser' : 'إعادة تعيين'}
          </Button>
          <Button 
            className="gap-2 bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/90"
            onClick={handleSaveSettings}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4" />
            {hasChanges ? 
              (language === 'en' ? "Save Settings" : language === 'fr' ? "Enregistrer" : "حفظ الإعدادات") : 
              (language === 'en' ? "Settings Saved" : language === 'fr' ? "Paramètres sauvegardés" : "تم حفظ الإعدادات")
            }
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Version</CardTitle>
            <Settings2 className="h-4 w-4 text-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue">{systemInfo.version}</div>
            <p className="text-xs text-muted-foreground">Latest version</p>
          </CardContent>
        </Card>


      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">{t.general}</TabsTrigger>
          <TabsTrigger value="security">{t.security}</TabsTrigger>
          <TabsTrigger value="appearance">{t.appearance}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                {t.general} {t.settings}
              </CardTitle>
              {hasChanges && (
                <Badge variant="secondary" className="w-fit">
                  Modifications non sauvegardées
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.institutionName}</label>
                  <Input 
                    value={localSettings.name}
                    onChange={(e) => handleSettingChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.contactEmail}</label>
                  <Input 
                    value={localSettings.email}
                    onChange={(e) => handleSettingChange('email', e.target.value)}
                    type="email" 
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.phoneNumber}</label>
                  <Input 
                    value={localSettings.phone}
                    onChange={(e) => handleSettingChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.timeZone}</label>
                  <Select 
                    value={localSettings.timeZone} 
                    onValueChange={(value) => handleSettingChange('timeZone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Casablanca">Africa/Casablanca (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.address}</label>
                <Textarea 
                  value={localSettings.address}
                  onChange={(e) => handleSettingChange('address', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.language}</label>
                <Select 
                  value={localSettings.language} 
                  onValueChange={(value) => { handleSettingChange('language', value); setLanguage(value as Language); }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="ar">🇲🇦 العربية</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'Select your preferred language for the interface' : 
                   language === 'fr' ? 'Sélectionnez votre langue préférée pour l\'interface' :
                   'اختر لغتك المفضلة للواجهة'}
                </p>
                <div className="pt-3">
                  <Button 
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow"
                    onClick={handleSaveSettings}
                  >
                    <Save className="h-4 w-4" />
                    {language === 'en' ? 'Save Changes' : language === 'fr' ? 'Sauvegarder' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-print in receipts</label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={localSettings.autoPrint || false}
                      onCheckedChange={(checked) => handleSettingChange('autoPrint', checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Automatically include institution info in receipts
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.currentPassword || 'Current Password'}</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder={t.currentPassword || 'Current Password'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.newPassword || 'New Password'}</label>
                  <Input type="password" placeholder={t.newPassword || 'New Password'} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.confirmNewPassword || 'Confirm New Password'}</label>
                  <Input type="password" placeholder={t.confirmNewPassword || 'Confirm New Password'} />
                </div>

                <Button className="bg-gradient-primary text-primary-foreground">
                  {t.updatePassword || 'Update Password'}
                </Button>

                <Separator />

                <div className="space-y-3">
                  <p className="font-medium">{t.twoFactorAuth || 'Two-Factor Authentication'}</p>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">{t.enable2FA || 'Enable 2FA'}</p>
                      <p className="text-xs text-muted-foreground">{t.twoFactorDescription || 'Add an extra layer of security'}</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="font-medium">{t.sessionManagement || 'Session Management'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t.autoLogoutAfterInactivity || 'Auto-logout after inactivity'}</span>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t.appearance} {t.settings}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{t.darkMode}</p>
                      <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                    </div>
                    <Switch 
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>

                <Separator />

                <div className="space-y-3">
                  <p className="font-medium">Theme Colors</p>
                  <div className="grid grid-cols-4 gap-3">
                    {["bg-blue", "bg-green", "bg-purple", "bg-orange"].map((color, index) => (
                      <div key={index} className="space-y-2">
                        <div className={`w-full h-12 rounded-lg ${color} cursor-pointer hover:opacity-80 transition-opacity`} />
                        <p className="text-xs text-center capitalize">{color.replace('bg-', '')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="font-medium">{t.fontSize}</p>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">{t.small}</SelectItem>
                      <SelectItem value="medium">{t.medium}</SelectItem>
                      <SelectItem value="large">{t.large}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Institution Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Upload or update the institution’s logo.</p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Changes Footer - only show when there are unsaved changes */}
      {hasChanges && (
        <Card className="fixed bottom-6 left-6 right-6 z-50 shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="animate-pulse">
                  {language === 'en' ? 'You have unsaved changes' :
                   language === 'fr' ? 'Vous avez des modifications non sauvegardées' :
                   'لديك تغييرات غير محفوظة'}
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2" onClick={handleResetSettings}>
                  <RefreshCw className="h-4 w-4" />
                  {language === 'en' ? 'Reset' : language === 'fr' ? 'Réinitialiser' : 'إعادة تعيين'}
                </Button>
                <Button 
                  className="gap-2 bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/90"
                  onClick={handleSaveSettings}
                  disabled={!hasChanges}
                >
                  <Save className="h-4 w-4" />
                  {language === 'en' ? "Save All Changes" : language === 'fr' ? "Sauvegarder" : "حفظ جميع التغييرات"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
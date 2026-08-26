import { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  Server, 
  Sparkles, 
  Settings, 
  Save, 
  Info, 
  ToggleLeft, 
  ToggleRight, 
  Layout, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdSettings, updateAdSettings, bulkImportModels } from '../services/api';

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'system' | 'ads'>('system');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<'home_top' | 'home_mid' | 'sidebar' | 'in_list'>('home_top');
  
  // Local state for editing form
  const [localSettings, setLocalSettings] = useState<any>({
    home_top: { slotKey: 'home_top', isActive: false, adClient: '', adSlot: '' },
    home_mid: { slotKey: 'home_mid', isActive: false, adClient: '', adSlot: '' },
    sidebar: { slotKey: 'sidebar', isActive: false, adClient: '', adSlot: '' },
    in_list: { slotKey: 'in_list', isActive: false, adClient: '', adSlot: '' },
  });

  const { data: settingsData, isLoading: settingsLoading, isError } = useQuery({
    queryKey: ['ad-settings'],
    queryFn: getAdSettings,
  });

  // Sync server data to local state
  useEffect(() => {
    if (settingsData?.data) {
      setLocalSettings(settingsData.data);
    }
  }, [settingsData]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: updateAdSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-settings'] });
      alert('Ad settings updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save ad settings');
    }
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: bulkImportModels,
    onSuccess: (data: any) => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ['models'] });
      alert(data.message || 'Bulk import completed successfully!');
    },
    onError: (err: any) => {
      setIsUploading(false);
      alert(err.response?.data?.message || 'Failed to import CSV file');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    bulkImportMutation.mutate(file);
    // Reset file input value so same file can be selected again if needed
    e.target.value = '';
  };

  const handleInputChange = (field: 'adClient' | 'adSlot', value: string) => {
    setLocalSettings((prev: any) => ({
      ...prev,
      [selectedSlot]: {
        ...prev[selectedSlot],
        [field]: value
      }
    }));
  };

  const handleToggleActive = () => {
    setLocalSettings((prev: any) => ({
      ...prev,
      [selectedSlot]: {
        ...prev[selectedSlot],
        isActive: !prev[selectedSlot].isActive
      }
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(localSettings);
  };

  // Human-readable titles for ad placements
  const slotLabels = {
    home_top: {
      title: 'Home Top Banner (Placement A)',
      desc: 'Sits directly below the global Search Bar and above the main "Universal List 2026" Blue Hero Card. Fluid/Leaderboard size.',
      dimensions: '728 x 90 or Responsive'
    },
    home_mid: {
      title: 'Home Mid-Page Divider (Placement B)',
      desc: 'Breaks up vertical scrolls nicely, positioned between the Recent Updates table and the All Categories grid.',
      dimensions: 'Fluid / Horizontal Banner'
    },
    sidebar: {
      title: 'Sidebar Persistent Slot (Placement C)',
      desc: 'Utilizes empty space in the left sidebar, placed right below the "Join Community" card and above the Dark Mode toggle.',
      dimensions: '300 x 250 Medium Rectangle'
    },
    in_list: {
      title: 'In-Feed / List Banner (Placement D)',
      desc: 'Appears after the 4th item on model compatibility listings (e.g. VIVO Display Connector List page) to capture active user attention.',
      dimensions: 'Responsive In-Feed Banner'
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-gray-500 mt-1">Configure system data, PM2 parameters, and global advertisement units.</p>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'system'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>System & Data</span>
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`pb-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ads'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Ad Management</span>
        </button>
      </div>

      {activeTab === 'system' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bulk Import Section */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Data Management</h2>
            </div>

            <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:bg-[var(--color-border)]/20 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
                  <p className="font-medium">Processing CSV import...</p>
                  <p className="text-sm text-gray-500 mt-1">Please do not close this window.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium text-lg">Bulk CSV Import</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    Upload a CSV file containing models and compatibilities.
                  </p>
                  <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] shadow-lg shadow-[var(--color-primary)]/30 font-medium pointer-events-none">
                    Select CSV File
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-start space-x-3">
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">CSV Format Requirements:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Columns: Model Name, Brand, Category, Compatible Models (comma-separated)</li>
                  <li>Maximum 5,000 rows per upload</li>
                  <li>UTF-8 encoding required</li>
                </ul>
              </div>
            </div>
          </GlassCard>

          {/* System Status Section */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded-lg">
                <Server className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">System Status (PM2 / VPS)</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-[var(--color-border)] rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">API Server (Node.js)</p>
                  <p className="text-sm text-gray-500">Running via PM2 • 2 instances</p>
                </div>
                <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Online</span>
                </div>
              </div>

              <div className="p-4 border border-[var(--color-border)] rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">Database (MySQL)</p>
                  <p className="text-sm text-gray-500">Connection pool active • 12ms ping</p>
                </div>
                <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Online</span>
                </div>
              </div>

              <div className="p-4 border border-[var(--color-border)] rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">Redis Cache (Search)</p>
                  <p className="text-sm text-gray-500">Not configured</p>
                </div>
                <div className="flex items-center space-x-2 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>Pending</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                <h3 className="font-medium mb-3">Resource Usage</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">CPU Usage</span>
                      <span className="font-medium">12%</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-secondary)] w-[12%] rounded-full"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Memory Usage (2GB / 8GB)</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-primary)] w-[25%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* Gorgeous Ad Management Tab */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Control Panel */}
          <div className="xl:col-span-2 space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Ad Slot Configurations</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle active states and input Google AdSense keys globally.</p>
                </div>
              </div>

              {settingsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-500">Retrieving ad server configurations...</p>
                </div>
              ) : isError ? (
                <div className="p-4 bg-red-500/10 text-red-500 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Failed to load ad settings from backend.</span>
                </div>
              ) : (
                <form onSubmit={handleSaveAll} className="space-y-6">
                  {/* Dropdown Layout Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      1. Select Ad Placement Location
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 select-arrow font-semibold"
                      >
                        <option value="home_top" className="bg-[#0f172a] text-white">Home Top Banner - Placement A</option>
                        <option value="home_mid" className="bg-[#0f172a] text-white">Home Mid-Page Divider - Placement B</option>
                        <option value="sidebar" className="bg-[#0f172a] text-white">Sidebar Persistent Box - Placement C</option>
                        <option value="in_list" className="bg-[#0f172a] text-white">In-Feed / List Banner (VIVO display connector) - Placement D</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">Active Status</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Turn this specific ad slot ON or OFF globally. If disabled, the slot collapses cleanly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      className="text-blue-500 hover:text-blue-600 transition-colors p-1 cursor-pointer"
                    >
                      {localSettings[selectedSlot]?.isActive ? (
                        <ToggleRight className="w-14 h-8 text-blue-500" />
                      ) : (
                        <ToggleLeft className="w-14 h-8 text-gray-400 dark:text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        AdSense data-ad-client (Client ID)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ca-pub-3940256099942544"
                        value={localSettings[selectedSlot]?.adClient || ''}
                        onChange={(e) => handleInputChange('adClient', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                        required={localSettings[selectedSlot]?.isActive}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        AdSense data-ad-slot (Slot ID)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 6300978111"
                        value={localSettings[selectedSlot]?.adSlot || ''}
                        onChange={(e) => handleInputChange('adSlot', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                        required={localSettings[selectedSlot]?.isActive}
                      />
                    </div>
                  </div>

                  {/* Info alert box */}
                  <div className="p-4 bg-gray-500/5 rounded-xl border border-gray-500/10 flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Google AdSense Safety Notice:</p>
                      <p className="mt-0.5 leading-relaxed">
                        To prevent layout shifting, slots are initialized with fixed aspect ratios corresponding to typical Google AdSense leaderboard and rectangular modules. Changes reflect instantly on save.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saveMutation.isPending ? 'Saving Settings...' : 'Save Ad Settings'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </GlassCard>

            {/* Quick Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['home_top', 'home_mid', 'sidebar', 'in_list'] as const).map((key) => {
                const isActive = localSettings[key]?.isActive;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSlot(key)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedSlot === key
                        ? 'bg-blue-600/10 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-bold shadow-md shadow-blue-500/5'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-700'
                    }`}
                  >
                    <p className="text-xs uppercase font-bold tracking-wider">{key.replace('_', ' ')}</p>
                    <div className="mt-2 flex items-center justify-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{isActive ? 'Active' : 'Off'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Elegant Visual Layout Preview Wireframe */}
          <div className="space-y-6">
            <GlassCard className="p-6 flex flex-col h-full bg-slate-950 text-white relative overflow-hidden min-h-[400px]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.08),transparent_50%)] pointer-events-none"></div>
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Layout className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm tracking-wide">Live Frontend Placement Preview</h3>
              </div>

              {/* Wireframe Area */}
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-full max-w-[280px] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl relative space-y-4">
                  {/* Outer Frame Title */}
                  <div className="absolute -top-3 left-4 px-2 py-0.5 bg-slate-800 text-[9px] uppercase tracking-widest font-black rounded text-gray-400 border border-slate-700">
                    Client Mockup
                  </div>

                  {/* Wireframe based on selected slot */}
                  {selectedSlot === 'home_top' && (
                    <div className="space-y-3">
                      {/* Search Bar */}
                      <div className="h-6 bg-slate-800/80 border border-slate-700/50 rounded-lg flex items-center px-2">
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                        <div className="w-12 h-1 bg-slate-600 ml-2 rounded"></div>
                      </div>
                      
                      {/* AD SLOT HIGHLIGHT */}
                      <div className={`h-8 border-2 border-dashed border-blue-500 rounded-xl bg-blue-500/20 flex flex-col items-center justify-center p-1 relative overflow-hidden animate-pulse ${localSettings.home_top.isActive ? 'border-solid border-green-500/80 bg-green-500/10' : ''}`}>
                        <span className={`text-[8px] font-black tracking-wider uppercase text-blue-400 ${localSettings.home_top.isActive ? 'text-green-400' : ''}`}>
                          [ Home Top Banner ]
                        </span>
                        <span className="text-[6px] text-gray-500 font-bold uppercase mt-0.5">{slotLabels.home_top.dimensions}</span>
                      </div>

                      {/* Blue Hero Card */}
                      <div className="h-16 bg-blue-600 rounded-xl p-2 space-y-2">
                        <div className="w-16 h-2 bg-white/40 rounded"></div>
                        <div className="w-24 h-1.5 bg-white/20 rounded"></div>
                        <div className="w-20 h-1.5 bg-white/20 rounded"></div>
                      </div>
                    </div>
                  )}

                  {selectedSlot === 'home_mid' && (
                    <div className="space-y-3">
                      {/* Hero Card */}
                      <div className="h-10 bg-blue-900/50 border border-blue-800/20 rounded-xl p-2 flex items-center justify-between">
                        <div className="w-12 h-2 bg-blue-400/40 rounded"></div>
                        <div className="w-4 h-4 bg-blue-400/20 rounded-full"></div>
                      </div>

                      {/* Updates Table */}
                      <div className="border border-slate-800 rounded-xl p-2 space-y-1 bg-slate-950/40">
                        <div className="w-16 h-1.5 bg-slate-700 rounded mb-2"></div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                          <div className="w-20 h-1 bg-slate-800 rounded"></div>
                          <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <div className="w-16 h-1 bg-slate-800 rounded"></div>
                          <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                        </div>
                      </div>

                      {/* AD SLOT HIGHLIGHT */}
                      <div className={`h-8 border-2 border-dashed border-blue-500 rounded-xl bg-blue-500/20 flex flex-col items-center justify-center p-1 relative overflow-hidden animate-pulse ${localSettings.home_mid.isActive ? 'border-solid border-green-500/80 bg-green-500/10' : ''}`}>
                        <span className={`text-[8px] font-black tracking-wider uppercase text-blue-400 ${localSettings.home_mid.isActive ? 'text-green-400' : ''}`}>
                          [ Home Mid Divider ]
                        </span>
                        <span className="text-[6px] text-gray-500 font-bold uppercase mt-0.5">{slotLabels.home_mid.dimensions}</span>
                      </div>

                      {/* Categories Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-8 bg-slate-800 rounded-lg"></div>
                        <div className="h-8 bg-slate-800 rounded-lg"></div>
                      </div>
                    </div>
                  )}

                  {selectedSlot === 'sidebar' && (
                    <div className="flex space-x-2">
                      {/* Sidebar Mock */}
                      <div className="w-20 bg-slate-950 border border-slate-800 rounded-xl p-1.5 space-y-2 shrink-0">
                        <div className="w-5 h-2 bg-blue-500/40 rounded mb-1"></div>
                        <div className="space-y-1">
                          <div className="w-12 h-1 bg-slate-800 rounded"></div>
                          <div className="w-10 h-1 bg-slate-800 rounded"></div>
                          <div className="w-12 h-1 bg-slate-800 rounded"></div>
                        </div>
                        
                        <div className="h-4 bg-indigo-950/40 rounded border border-indigo-900/30"></div>

                        {/* AD SLOT HIGHLIGHT */}
                        <div className={`h-12 border border-dashed border-blue-500 rounded bg-blue-500/20 flex flex-col items-center justify-center p-0.5 relative overflow-hidden animate-pulse ${localSettings.sidebar.isActive ? 'border-solid border-green-500/80 bg-green-500/10' : ''}`}>
                          <span className={`text-[6px] font-black tracking-wider uppercase text-blue-400 text-center leading-none ${localSettings.sidebar.isActive ? 'text-green-400' : ''}`}>
                            [ Sidebar ]
                          </span>
                          <span className="text-[4px] text-gray-500 font-bold uppercase mt-0.5 text-center leading-none">300x250 Box</span>
                        </div>
                      </div>

                      {/* Main Mock */}
                      <div className="flex-1 bg-slate-950/20 border border-slate-800 rounded-xl p-2 space-y-2 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="w-16 h-2 bg-slate-700 rounded"></div>
                          <div className="w-24 h-1 bg-slate-800 rounded"></div>
                        </div>
                        <div className="h-16 bg-slate-800 rounded-lg"></div>
                      </div>
                    </div>
                  )}

                  {selectedSlot === 'in_list' && (
                    <div className="space-y-2">
                      {/* List Header */}
                      <div className="flex justify-between items-center">
                        <div className="w-16 h-2 bg-slate-700 rounded"></div>
                        <div className="w-10 h-3 bg-slate-800 rounded"></div>
                      </div>

                      {/* List Items */}
                      <div className="border border-slate-850 rounded-xl bg-slate-950/40 divide-y divide-slate-850 overflow-hidden text-[6px] text-gray-500">
                        <div className="p-1 flex items-center"><div className="w-1 h-1 rounded-full bg-blue-500 mr-1"></div> VIVO Y200 display connector</div>
                        <div className="p-1 flex items-center"><div className="w-1 h-1 rounded-full bg-blue-500 mr-1"></div> VIVO T3 compatibility list</div>
                        
                        {/* AD SLOT HIGHLIGHT */}
                        <div className={`p-1 border-y border-dashed border-blue-500 bg-blue-500/15 flex flex-col items-center justify-center relative overflow-hidden animate-pulse ${localSettings.in_list.isActive ? 'border-solid border-green-500/80 bg-green-500/10' : ''}`}>
                          <span className={`text-[6px] font-black tracking-wider uppercase text-blue-400 leading-none ${localSettings.in_list.isActive ? 'text-green-400' : ''}`}>
                            [ In-Feed Banner ]
                          </span>
                          <span className="text-[4px] text-gray-500 font-bold uppercase mt-0.5 leading-none">VIVO Display list</span>
                        </div>
                        
                        <div className="p-1 flex items-center"><div className="w-1 h-1 rounded-full bg-blue-500 mr-1"></div> VIVO Y16 display connector</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Placement explanation */}
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                <h4 className="font-bold text-xs text-blue-400 flex items-center">
                  <span>{slotLabels[selectedSlot].title}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 text-gray-600" />
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {slotLabels[selectedSlot].desc}
                </p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase mt-1">
                  <span>Ad Format Style:</span>
                  <span className="text-gray-300">{slotLabels[selectedSlot].dimensions}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}

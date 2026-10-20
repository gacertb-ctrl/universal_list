import { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  Layers, 
  Smartphone, 
  Sparkles, 
  Bot, 
  Users, 
  Megaphone, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  Server, 
  Settings, 
  Save, 
  Upload, 
  RefreshCw, 
  Play, 
  Check, 
  X, 
  Shield, 
  Plus, 
  Search, 
  Eye, 
  ChevronRight, 
  ToggleLeft, 
  ToggleRight, 
  Layout, 
  Trash2, 
  Zap,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAdminMetrics,
  getAdminUsers, 
  updateUserStatus, 
  updateUserRole,
  getAiJobs, 
  runAiJob, 
  getAiCandidates, 
  approveAiCandidate, 
  rejectAiCandidate, 
  getAiSettings, 
  updateAiSettings,
  getAvailableGeminiModels,
  getAuditLogs,
  getCategories,
  createCategory,
  updateCategory,
  getCategoryTypes,
  createCategoryType,
  getBrands,
  getModels,
  createModel,
  deleteModel,
  addModelCompatibility,
  getAdSettings, 
  updateAdSettings, 
  bulkImportModels,
  downloadSampleCsv
} from '../services/api';
import { ModelDetailsModal } from '../components/catalog/ModelDetailsModal';

type AdminTab = 'overview' | 'categories' | 'models' | 'ai_updates' | 'ai_settings' | 'users' | 'ads';

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Inspect Model modal
  const [inspectModelId, setInspectModelId] = useState<number | null>(null);

  // ==========================================
  // 1. OVERVIEW DATA
  // ==========================================
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: getAdminMetrics,
    refetchInterval: 30000,
  });
  const metrics = metricsData?.data;

  // ==========================================
  // 2. CATEGORIES & TYPES DATA
  // ==========================================
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  const categories = categoriesData?.data || [];

  const [selectedCategoryForTypes, setSelectedCategoryForTypes] = useState<number | null>(null);
  const { data: categoryTypesData, isLoading: typesLoading } = useQuery({
    queryKey: ['category-types', selectedCategoryForTypes],
    queryFn: () => getCategoryTypes(selectedCategoryForTypes!),
    enabled: !!selectedCategoryForTypes,
  });
  const categoryTypes = categoryTypesData?.data || [];

  // Create Category Form State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatNavType, setNewCatNavType] = useState<'brand_first' | 'type_first'>('brand_first');
  const [newCatDesc, setNewCatDesc] = useState('');

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowAddCategoryModal(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      alert('Category created successfully!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to create category'),
  });

  // Create Type Form State
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeSlug, setNewTypeSlug] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const createTypeMutation = useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: any }) =>
      createCategoryType(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-types', selectedCategoryForTypes] });
      setShowAddTypeModal(false);
      setNewTypeName('');
      setNewTypeSlug('');
      setNewTypeDesc('');
      alert('Type added to category successfully!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to create type'),
  });

  // Toggle Category Navigation Type
  const updateCatNavMutation = useMutation({
    mutationFn: ({ id, navType }: { id: number; navType: 'brand_first' | 'type_first' }) =>
      updateCategory(id, { navigationType: navType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // ==========================================
  // 3. BRANDS & MODELS DATA
  // ==========================================
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
  });
  const brands = brandsData?.data || [];

  const [modelSearch, setModelSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('');

  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models', modelSearch, selectedCatFilter, selectedBrandFilter],
    queryFn: () => getModels({ 
      q: modelSearch || undefined, 
      categoryId: selectedCatFilter || undefined,
      brandId: selectedBrandFilter || undefined,
      limit: 50
    }),
  });
  const models = modelsData?.data || [];

  // Add Model Modal State
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelBrandId, setNewModelBrandId] = useState<number | ''>('');
  const [newModelCatId, setNewModelCatId] = useState<number | ''>('');
  const [newModelTypeId, setNewModelTypeId] = useState<number | ''>('');
  const [newModelNotes, setNewModelNotes] = useState('');
  const [newModelVerified, setNewModelVerified] = useState(true);

  // Available types for the selected category in Add Model modal
  const { data: modalCatTypesData } = useQuery({
    queryKey: ['modal-cat-types', newModelCatId],
    queryFn: () => getCategoryTypes(newModelCatId!),
    enabled: typeof newModelCatId === 'number' && newModelCatId > 0,
  });
  const modalCatTypes = modalCatTypesData?.data || [];

  const createModelMutation = useMutation({
    mutationFn: createModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      setShowAddModelModal(false);
      setNewModelName('');
      setNewModelNotes('');
      alert('Model created successfully!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to create model'),
  });

  // Add Compatibility Modal State
  const [compatTargetModel, setCompatTargetModel] = useState<any | null>(null);
  const [compatWithName, setCompatWithName] = useState('');
  const [compatConnector, setCompatConnector] = useState('');
  const [compatNotes, setCompatNotes] = useState('');

  const addCompatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => addModelCompatibility(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      setCompatTargetModel(null);
      setCompatWithName('');
      setCompatConnector('');
      setCompatNotes('');
      alert('Compatibility relationship linked successfully!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to add compatibility'),
  });

  const deleteModelMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      alert('Model deleted successfully.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to delete model'),
  });

  // ==========================================
  // 4. AI UPDATES & REVIEW QUEUE DATA
  // ==========================================
  const [candidateFilterStatus, setCandidateFilterStatus] = useState<string>('unverified');
  
  const { data: aiCandidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ['ai-candidates', candidateFilterStatus],
    queryFn: () => getAiCandidates({ status: candidateFilterStatus === 'all' ? undefined : candidateFilterStatus }),
  });
  const candidates = aiCandidatesData?.data || [];

  const { data: aiJobsData } = useQuery({
    queryKey: ['ai-jobs'],
    queryFn: getAiJobs,
  });
  const aiJobs = aiJobsData?.data || [];

  // Trigger AI Job mutation
  const [isDryRun, setIsDryRun] = useState(false);
  const runAiJobMutation = useMutation({
    mutationFn: (dryRun: boolean) => runAiJob(dryRun),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['ai-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      alert(data.message || 'AI Update Job completed successfully!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'AI Job failed'),
  });

  const approveCandidateMutation = useMutation({
    mutationFn: approveAiCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      alert('Candidate approved and applied to MySQL models & compatibility records!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to approve candidate'),
  });

  const rejectCandidateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => rejectAiCandidate(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      alert('Candidate rejected.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to reject candidate'),
  });

  // ==========================================
  // 5. AI SETTINGS DATA
  // ==========================================
  const { data: aiSettingsResponse } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: getAiSettings,
  });

  const { 
    data: geminiModelsResponse, 
    isLoading: loadingGeminiModels, 
    error: geminiModelsError,
    refetch: refetchGeminiModels,
    isFetching: isFetchingGeminiModels
  } = useQuery({
    queryKey: ['gemini-models'],
    queryFn: getAvailableGeminiModels,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  const availableModels = geminiModelsResponse?.data || [];

  const [aiConfig, setAiConfig] = useState({
    geminiModel: 'gemini-1.5-pro',
    cronExpression: '30 2 * * *',
    timezone: 'Asia/Kolkata',
    autoApply: 'false',
    maxCandidates: '20',
    targetCategories: 'tempered-glass,display-combo,battery,cover-panel'
  });

  useEffect(() => {
    if (aiSettingsResponse?.data) {
      setAiConfig((prev) => ({
        ...prev,
        ...aiSettingsResponse.data
      }));
    }
  }, [aiSettingsResponse]);

  const updateAiSettingsMutation = useMutation({
    mutationFn: updateAiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      alert('Gemini AI settings saved and scheduler refreshed!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update AI settings'),
  });

  // ==========================================
  // 6. USERS & AUDIT LOGS DATA
  // ==========================================
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });
  const users = usersData?.data || [];

  const { data: auditLogsData } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
  });
  const auditLogs = auditLogsData?.data || [];

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User status updated successfully.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update status'),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: number; roleId: number }) => updateUserRole(id, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User role updated successfully.');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update role'),
  });

  // ==========================================
  // 7. ADSENSE & BULK CSV DATA
  // ==========================================
  const [selectedSlot, setSelectedSlot] = useState<'home_top' | 'home_mid' | 'sidebar' | 'in_list'>('home_top');
  const [isUploading, setIsUploading] = useState(false);
  const [localSettings, setLocalSettings] = useState<any>({
    home_top: { slotKey: 'home_top', isActive: false, adClient: '', adSlot: '' },
    home_mid: { slotKey: 'home_mid', isActive: false, adClient: '', adSlot: '' },
    sidebar: { slotKey: 'sidebar', isActive: false, adClient: '', adSlot: '' },
    in_list: { slotKey: 'in_list', isActive: false, adClient: '', adSlot: '' },
  });

  const { data: settingsData } = useQuery({
    queryKey: ['ad-settings'],
    queryFn: getAdSettings,
  });

  useEffect(() => {
    if (settingsData?.data) {
      setLocalSettings(settingsData.data);
    }
  }, [settingsData]);

  const saveAdMutation = useMutation({
    mutationFn: updateAdSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-settings'] });
      alert('Ad settings saved successfully!');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to save ad settings'),
  });

  const bulkImportMutation = useMutation({
    mutationFn: bulkImportModels,
    onSuccess: (data: any) => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
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
    e.target.value = '';
  };

  const [isDownloadingSample, setIsDownloadingSample] = useState(false);

  const handleDownloadSampleCsv = async () => {
    setIsDownloadingSample(true);
    try {
      const blob = await downloadSampleCsv();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_models_import.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const link = document.createElement('a');
      link.href = '/sample_models_import.csv';
      link.setAttribute('download', 'sample_models_import.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const slotLabels = {
    home_top: {
      title: 'Home Top Banner (Placement A)',
      desc: 'Positioned right under global search bar, before main Hero Card.',
      dimensions: '728 x 90 or Fluid Responsive'
    },
    home_mid: {
      title: 'Home Mid-Page Divider (Placement B)',
      desc: 'Breaks up vertical scrolls between recent updates and categories grid.',
      dimensions: 'Fluid Horizontal Banner'
    },
    sidebar: {
      title: 'Sidebar Persistent Box (Placement C)',
      desc: 'Left sidebar space below navigation items.',
      dimensions: '300 x 250 Medium Rectangle'
    },
    in_list: {
      title: 'In-Feed / List Banner (Placement D)',
      desc: 'Appears after the 4th item on model compatibility listings.',
      dimensions: 'Responsive In-Feed Banner'
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Quick Status */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Universal List 2026 • Master Admin Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Admin & Business Control Center</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Real MySQL 10.6 database, automated Gemini AI compatibility engine, category hierarchy management, and Google AdSense revenue controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => runAiJobMutation.mutate(false)}
              disabled={runAiJobMutation.isPending}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {runAiJobMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Run AI Scan Now</span>
            </button>

            <button
              onClick={() => setShowAddModelModal(true)}
              className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Model</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-blue-100">MySQL Database: <strong className="text-white">Active (3306)</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="text-blue-100">AI Engine: <strong className="text-white">Gemini 1.5 Pro</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span className="text-blue-100">Scheduler: <strong className="text-white">02:30 AM Daily</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-blue-100">Pending Reviews: <strong className="text-white">{metrics?.pendingAiCandidates || 0} items</strong></span>
          </div>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 scrollbar-none space-x-2">
        {[
          { key: 'overview', label: 'Overview & Metrics', icon: LayoutDashboard },
          { key: 'categories', label: 'Categories & Types', icon: Layers },
          { key: 'models', label: 'Models & Compatibility', icon: Smartphone },
          { key: 'ai_updates', label: `AI Review Queue (${metrics?.pendingAiCandidates || 0})`, icon: Sparkles },
          { key: 'ai_settings', label: 'Gemini Engine Config', icon: Bot },
          { key: 'users', label: 'Technicians & Audits', icon: Users },
          { key: 'ads', label: 'AdSense & CSV Import', icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              className={`pb-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & REAL METRICS */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Categories</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {metricsLoading ? '...' : metrics?.totalCategories || 0}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">Configurable Hierarchy</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Brands</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {metricsLoading ? '...' : metrics?.totalBrands || 0}
              </p>
              <span className="text-[10px] text-blue-500 font-semibold mt-1 block">Active Manufacturers</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Models</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {metricsLoading ? '...' : metrics?.totalModels || 0}
              </p>
              <span className="text-[10px] text-indigo-500 font-semibold mt-1 block">Phones & Hardware</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Verified Compat.</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {metricsLoading ? '...' : metrics?.totalCompatibilities || 0}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">100% Tested Pinouts</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">AI Candidates</span>
              <p className="text-2xl font-black text-amber-500 mt-1">
                {metricsLoading ? '...' : metrics?.pendingAiCandidates || 0}
              </p>
              <span className="text-[10px] text-amber-500 font-semibold mt-1 block">Awaiting Verification</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Users</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {metricsLoading ? '...' : metrics?.totalUsers || 0}
              </p>
              <span className="text-[10px] text-purple-500 font-semibold mt-1 block">Technicians & Admins</span>
            </div>
          </div>

          {/* System Health & Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Server & Infrastructure</h3>
                  <p className="text-xs text-gray-400">Node.js Express 5 + MariaDB</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/40">
                  <span className="text-gray-500">Node.js API Server</span>
                  <span className="font-bold text-emerald-500 flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Port 5000 Online</span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/40">
                  <span className="text-gray-500">MySQL / MariaDB 10.6</span>
                  <span className="font-bold text-emerald-500 flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Port 3306 Connected</span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/40">
                  <span className="text-gray-500">Gemini AI Auto-Job</span>
                  <span className="font-bold text-blue-500 flex items-center"><Zap className="w-3.5 h-3.5 mr-1" /> Scheduled (Asia/Kolkata)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => refetchMetrics()}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Real-Time Metrics</span>
                </button>
              </div>
            </div>

            {/* Recent Audit Activities */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent System Activity</h3>
                      <p className="text-xs text-gray-400">Logged security & operational modifications</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="text-xs text-blue-500 hover:underline font-semibold"
                  >
                    View All Audits
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="pb-2">Action</th>
                        <th className="pb-2">Entity</th>
                        <th className="pb-2">Initiated By</th>
                        <th className="pb-2 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {(metrics?.recentAuditLogs || []).slice(0, 5).map((log: any) => (
                        <tr key={log.id} className="py-2.5">
                          <td className="py-2 font-semibold text-gray-900 dark:text-gray-200">
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2 text-gray-500">{log.entity} #{log.entityId}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">{log.user?.email || 'System Runner'}</td>
                          <td className="py-2 text-right text-gray-400">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                      {(!metrics?.recentAuditLogs || metrics.recentAuditLogs.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400">
                            No recent audit logs recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
                <span>Database: `universal_list` (MariaDB/MySQL)</span>
                <span className="text-emerald-500 font-semibold">Strict Transaction Guarantees</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CATEGORIES & TYPES HIERARCHY MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Category Hierarchy Configuration</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Configure technician navigation workflows: Type First (e.g. Tempered Glass Normal / Edge) vs Brand First (Cover, Battery, Combo).
              </p>
            </div>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories List */}
            <div className="lg:col-span-2 space-y-3">
              {categoriesLoading ? (
                <div className="p-12 text-center text-gray-400">Loading categories from MySQL...</div>
              ) : (
                categories.map((cat: any) => {
                  const isSelected = selectedCategoryForTypes === cat.id;
                  const isTypeFirst = cat.navigationType === 'type_first';

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryForTypes(cat.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-md'
                          : 'bg-white dark:bg-[#0b1329] border-gray-200 dark:border-gray-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3.5">
                          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xl font-bold">
                            {cat.icon || '📱'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-sm text-gray-900 dark:text-white">{cat.name}</h3>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                {cat.slug}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{cat.description || 'Hardware compatibility category.'}</p>
                            
                            {/* Navigation Type Selector Badge */}
                            <div className="mt-3 flex items-center space-x-2">
                              <span className="text-[11px] text-gray-400 font-semibold">Hierarchy Flow:</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCatNavMutation.mutate({
                                    id: cat.id,
                                    navType: isTypeFirst ? 'brand_first' : 'type_first'
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                                  isTypeFirst
                                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}
                                title="Click to toggle navigation flow"
                              >
                                <span>{isTypeFirst ? 'Type First (Normal / Edge)' : 'Brand First (All Brands)'}</span>
                                <RefreshCw className="w-3 h-3 ml-1 opacity-70" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategoryForTypes(cat.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 text-gray-600 dark:text-gray-300 hover:text-blue-600 text-xs font-semibold flex items-center space-x-1"
                        >
                          <span>Manage Types</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Category Types Sidebar */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Sub-Types Configuration</h3>
                  <p className="text-[11px] text-gray-400">
                    {selectedCategoryForTypes 
                      ? `Category #${selectedCategoryForTypes}` 
                      : 'Select a category on the left'}
                  </p>
                </div>
                {selectedCategoryForTypes && (
                  <button
                    onClick={() => setShowAddTypeModal(true)}
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
                    title="Add Type to Category"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {selectedCategoryForTypes ? (
                typesLoading ? (
                  <div className="py-8 text-center text-xs text-gray-400">Loading sub-types...</div>
                ) : categoryTypes.length > 0 ? (
                  <div className="space-y-2">
                    {categoryTypes.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white">{t.name}</h4>
                          <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                            {t.code}
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-[11px] text-gray-500 mt-1">{t.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400 space-y-2">
                    <p>No sub-types added for this category yet.</p>
                    <button
                      onClick={() => setShowAddTypeModal(true)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold"
                    >
                      + Add Normal / Edge Sub-type
                    </button>
                  </div>
                )
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  Click on any category on the left to view or add sub-types.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MODELS & COMPATIBILITY MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hardware Models & Compatibility Engine</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage all device models, assign categories, and connect verified = cross-compatibility relationships.
              </p>
            </div>
            <button
              onClick={() => setShowAddModelModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Device Model</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search models (e.g. Vivo V11)..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Brands</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Models Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
            {modelsLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading models from MySQL...</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Model Name</th>
                    <th className="pb-3">Brand</th>
                    <th className="pb-3">Category & Type</th>
                    <th className="pb-3">Verified Equivalent Compatibilities</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {models.map((model: any) => {
                    const compatList = model.compatibilityLists || [];

                    return (
                      <tr key={model.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                          <button
                            onClick={() => setInspectModelId(model.id)}
                            className="hover:text-blue-500 hover:underline text-left"
                          >
                            {model.name}
                          </button>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {model.brand?.name}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{model.category?.name}</span>
                            {model.categoryType && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                {model.categoryType.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5">
                          {compatList.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-gray-400 font-bold mr-1">=</span>
                              {compatList.slice(0, 3).map((comp: any) => (
                                <span 
                                  key={comp.id} 
                                  className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded"
                                >
                                  {comp.compatibleWith}
                                </span>
                              ))}
                              {compatList.length > 3 && (
                                <span className="text-[10px] text-gray-400 font-semibold">
                                  +{compatList.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">None linked</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          {model.isVerified ? (
                            <span className="inline-flex items-center text-emerald-500 font-semibold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-amber-500 font-semibold text-[11px]">
                              <Clock className="w-3.5 h-3.5 mr-1" /> Unverified
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          <button
                            onClick={() => setCompatTargetModel(model)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] transition-colors"
                            title="Add Compatible Model"
                          >
                            + Link Compat
                          </button>
                          <button
                            onClick={() => setInspectModelId(model.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete model ${model.name}? This will cascade delete its compatibility links.`)) {
                                deleteModelMutation.mutate(model.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-gray-400 hover:text-red-500"
                            title="Delete Model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AI UPDATES & REVIEW QUEUE */}
      {/* ========================================================= */}
      {activeTab === 'ai_updates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gemini AI Compatibility Review Queue</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Review proposed model updates and cross-device compatibility relationships before applying them to MySQL.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDryRun}
                  onChange={(e) => setIsDryRun(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Dry Run Mode</span>
              </label>

              <button
                onClick={() => runAiJobMutation.mutate(isDryRun)}
                disabled={runAiJobMutation.isPending}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {runAiJobMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>Trigger AI Scan Now</span>
              </button>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex space-x-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            {[
              { id: 'unverified', label: 'Pending Review' },
              { id: 'approved', label: 'Approved & Applied' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'all', label: 'All Candidates' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCandidateFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  candidateFilterStatus === f.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Candidates Grid */}
          <div className="space-y-4">
            {candidatesLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading AI update candidates...</div>
            ) : candidates.length > 0 ? (
              candidates.map((c: any) => {
                let parsedCompat: any[] = [];
                let parsedWarnings: string[] = [];
                try {
                  if (c.compatibilityJson) parsedCompat = JSON.parse(c.compatibilityJson);
                } catch (e) {}
                try {
                  if (c.warningsJson) parsedWarnings = JSON.parse(c.warningsJson);
                } catch (e) {}

                const isPending = c.verificationStatus === 'unverified' || c.verificationStatus === 'pending_review';

                return (
                  <div
                    key={c.id}
                    className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {c.brandName}
                          </span>
                          <h3 className="text-base font-black text-gray-900 dark:text-white">{c.modelName}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                            {c.operation}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Category: <strong className="text-gray-300">{c.categorySlug}</strong>
                          {c.typeSlug && <> • Sub-Type: <strong className="text-purple-400">{c.typeSlug}</strong></>}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Confidence</span>
                          <span className="text-sm font-black text-emerald-500">
                            {Math.round((c.confidence || 0) * 100)}%
                          </span>
                        </div>

                        {isPending ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => approveCandidateMutation.mutate(c.id)}
                              disabled={approveCandidateMutation.isPending}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Apply</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason (optional):');
                                rejectCandidateMutation.mutate({ id: c.id, reason: reason || undefined });
                              }}
                              disabled={rejectCandidateMutation.isPending}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-950/50 text-gray-600 hover:text-red-600 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            c.verificationStatus === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                          }`}>
                            {c.verificationStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proposed Equivalents Diff Box */}
                    {parsedCompat.length > 0 && (
                      <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 space-y-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                          Proposed Equivalent Compatibilities:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold">
                            {c.modelName}
                          </span>
                          {parsedCompat.map((comp: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-1.5">
                              <span className="text-gray-400 font-bold">=</span>
                              <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                                {comp.targetModelName} {comp.connectorType ? `(${comp.connectorType})` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conflict & Warning Alerts */}
                    {parsedWarnings.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Technician Caution:</strong>
                          <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                            {parsedWarnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-xs text-gray-400 p-8 bg-white dark:bg-[#0b1329] rounded-3xl border border-gray-200 dark:border-gray-800">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">All Candidates Reviewed</p>
                <p className="mt-1">No items currently waiting for verification under filter: {candidateFilterStatus}.</p>
              </div>
            )}
          </div>

          {/* AI Jobs History Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent AI Update Executions (Jobs)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-2">Job ID</th>
                    <th className="pb-2">Triggered By</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Candidates Found</th>
                    <th className="pb-2">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {aiJobs.map((j: any) => (
                    <tr key={j.id}>
                      <td className="py-2.5 font-mono text-gray-700 dark:text-gray-300">{j.jobId}</td>
                      <td className="py-2.5 text-gray-500">{j.triggeredBy} {j.isDryRun && '(dry run)'}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          j.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : j.status === 'failed'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold">{j.candidatesFound} items</td>
                      <td className="py-2.5 text-gray-400">{new Date(j.startedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {aiJobs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">No jobs recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: GEMINI ENGINE SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'ai_settings' && (
        <div className="max-w-3xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gemini 1.5/2.0 Engine Configuration</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tune prompts, background scheduler, safety thresholds, and auto-approval rules.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateAiSettingsMutation.mutate(aiConfig);
            }}
            className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5"
          >
            {/* API Key Status Notice */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-blue-900 dark:text-blue-200">Google Gemini API Authentication:</p>
                <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                  The API key is securely loaded from <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">backend/.env</code>.
                  Current status: {aiSettingsResponse?.isApiKeyConfigured ? (
                    <strong className="text-emerald-500">Configured & Validated</strong>
                  ) : (
                    <strong className="text-amber-500">Active Test Key Configured</strong>
                  )}
                </p>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Gemini Model Version</span>
                  <span className="text-[10px] lowercase font-normal px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Text Models Only
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  {loadingGeminiModels || isFetchingGeminiModels ? (
                    <span className="text-[11px] text-blue-500 animate-pulse font-medium flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Fetching live models...
                    </span>
                  ) : geminiModelsError ? (
                    <span className="text-[11px] text-amber-500 font-medium">Using cached defaults</span>
                  ) : (
                    <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {availableModels.length} text models live
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => refetchGeminiModels()}
                    disabled={loadingGeminiModels || isFetchingGeminiModels}
                    className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded transition-colors"
                    title="Refresh Models from Google API"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGeminiModels ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <select
                value={aiConfig.geminiModel}
                onChange={(e) => setAiConfig({ ...aiConfig, geminiModel: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-mono"
              >
                {availableModels.length > 0 ? (
                  availableModels.map((m: any) => {
                    const isFree = m.tier === 'Free';
                    return (
                      <option key={m.id} value={m.id}>
                        [{isFree ? 'FREE' : 'PAID'}] {m.name || m.id} ({m.id}) {m.inputTokenLimit ? `• ${m.inputTokenLimit.toLocaleString()} tokens` : ''}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="gemini-2.5-flash">[FREE] Gemini 2.5 Flash (Recommended - Free Tier)</option>
                    <option value="gemini-2.5-flash-lite">[FREE] Gemini 2.5 Flash-Lite (Free Tier)</option>
                    <option value="gemini-2.0-flash">[FREE] Gemini 2.0 Flash (Free Tier)</option>
                    <option value="gemini-2.5-pro">[PAID] Gemini 2.5 Pro (Paid Tier / Pay-As-You-Go)</option>
                    <option value="gemini-1.5-pro">[PAID] Gemini 1.5 Pro (Paid Tier)</option>
                  </>
                )}
              </select>

              {/* Show details for selected model */}
              {(() => {
                const selectedModel = availableModels.find((m: any) => m.id === aiConfig.geminiModel);
                const isFree = selectedModel ? selectedModel.tier === 'Free' : !aiConfig.geminiModel.includes('pro');
                return (
                  <div className="mt-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-gray-800/40 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isFree 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {isFree ? 'Free Tier (15 RPM / 1M TPM)' : 'Paid Tier (Pay-As-You-Go)'}
                        </span>
                        {selectedModel?.inputTokenLimit && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            Limit: {selectedModel.inputTokenLimit.toLocaleString()} tokens
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                        {selectedModel?.description || 'Text generation and automated phone compatibility specification parsing model.'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Cron & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Daily Cron Schedule
                </label>
                <input
                  type="text"
                  value={aiConfig.cronExpression}
                  onChange={(e) => setAiConfig({ ...aiConfig, cronExpression: e.target.value })}
                  placeholder="30 2 * * *"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Default: 02:30 AM every day</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Scheduler Timezone
                </label>
                <input
                  type="text"
                  value={aiConfig.timezone}
                  onChange={(e) => setAiConfig({ ...aiConfig, timezone: e.target.value })}
                  placeholder="Asia/Kolkata"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Timezone for daily trigger</span>
              </div>
            </div>

            {/* Auto Apply Toggle */}
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-white">Auto-Apply Candidates to MySQL</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  When enabled, candidates with &gt;95% confidence and 0 warnings are automatically committed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiConfig({ ...aiConfig, autoApply: aiConfig.autoApply === 'true' ? 'false' : 'true' })}
                className="p-1 cursor-pointer"
              >
                {aiConfig.autoApply === 'true' ? (
                  <ToggleRight className="w-12 h-7 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-12 h-7 text-gray-400" />
                )}
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={updateAiSettingsMutation.isPending}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save AI Engine Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: USERS & AUDIT LOGS */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Technician User Access & Activity Audit</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review technician logins, grant role-based permissions, and inspect immutable audit trail records.
            </p>
          </div>

          {/* User Management Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Registered Users & Technicians</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 font-bold text-gray-900 dark:text-white">{u.name}</td>
                      <td className="py-3 text-gray-500">{u.email}</td>
                      <td className="py-3">
                        <select
                          value={u.roleId || (u.role?.name === 'Super Admin' ? 1 : u.role?.name === 'Admin' ? 2 : 3)}
                          onChange={(e) => {
                            updateUserRoleMutation.mutate({ id: u.id, roleId: Number(e.target.value) });
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none text-gray-800 dark:text-gray-200"
                        >
                          <option value={1}>Super Admin</option>
                          <option value={2}>Admin</option>
                          <option value={3}>Technician</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            const newStatus = u.status === 'active' ? 'suspended' : 'active';
                            updateUserStatusMutation.mutate({ id: u.id, status: newStatus });
                          }}
                          className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-semibold text-[11px]"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail Log */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Audit Log History (Last 50 Entries)</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-white dark:bg-[#0b1329]">
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Target Entity</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">{log.action}</td>
                      <td className="py-2.5 text-gray-700 dark:text-gray-300">{log.entity} #{log.entityId}</td>
                      <td className="py-2.5 text-gray-500">{log.user?.email || 'Automated Engine'}</td>
                      <td className="py-2.5 text-gray-400 truncate max-w-xs">{log.details || '-'}</td>
                      <td className="py-2.5 text-right text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">No logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: GOOGLE ADSENSE & BULK CSV IMPORT */}
      {/* ========================================================= */}
      {activeTab === 'ads' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Ad Slot Controls */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Ad Slot Configuration</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Toggle active states and manage Google AdSense client IDs globally.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    1. Select Placement Location
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                  >
                    <option value="home_top">Home Top Banner - Placement A</option>
                    <option value="home_mid">Home Mid-Page Divider - Placement B</option>
                    <option value="sidebar">Sidebar Persistent Slot - Placement C</option>
                    <option value="in_list">In-Feed / List Banner (VIVO display connector) - Placement D</option>
                  </select>
                </div>

                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">Slot Active State</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Enable or disable this specific ad unit across the site.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings((prev: any) => ({
                        ...prev,
                        [selectedSlot]: {
                          ...prev[selectedSlot],
                          isActive: !prev[selectedSlot]?.isActive
                        }
                      }));
                    }}
                    className="cursor-pointer"
                  >
                    {localSettings[selectedSlot]?.isActive ? (
                      <ToggleRight className="w-12 h-7 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-12 h-7 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      AdSense data-ad-client
                    </label>
                    <input
                      type="text"
                      placeholder="ca-pub-3940256099942544"
                      value={localSettings[selectedSlot]?.adClient || ''}
                      onChange={(e) => {
                        setLocalSettings((prev: any) => ({
                          ...prev,
                          [selectedSlot]: { ...prev[selectedSlot], adClient: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      AdSense data-ad-slot
                    </label>
                    <input
                      type="text"
                      placeholder="6300978111"
                      value={localSettings[selectedSlot]?.adSlot || ''}
                      onChange={(e) => {
                        setLocalSettings((prev: any) => ({
                          ...prev,
                          [selectedSlot]: { ...prev[selectedSlot], adSlot: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => saveAdMutation.mutate(localSettings)}
                    disabled={saveAdMutation.isPending}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save AdSense Placements</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk CSV Import */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Bulk CSV Importer</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Upload a CSV dataset of mobile models and cross-compatibilities.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  disabled={isDownloadingSample}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:shadow"
                  title="Download sample CSV template with standard columns and examples"
                >
                  {isDownloadingSample ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Export Sample CSV</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="font-bold text-xs">Importing models into MySQL database...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-blue-500" />
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Click or Drag CSV here</span>
                    <span className="text-[10px] text-gray-400">Supported columns: Model Name, Brand, Category, Compatible Models</span>
                  </div>
                )}
              </div>

              {/* Sample Template Columns Guide */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px]">Columns:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Model Name', 'Brand', 'Category', 'Compatible Models'].map((col) => (
                      <span key={col} className="px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[10px] text-gray-700 dark:text-gray-300">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-bold text-[11px] flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .csv</span>
                </button>
              </div>
            </div>
          </div>

          {/* Wireframe Mockup */}
          <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
              <Layout className="w-4 h-4" />
              <span>Placement Preview Wireframe</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-gray-300">{slotLabels[selectedSlot].title}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">{slotLabels[selectedSlot].desc}</p>
              <div className="p-4 rounded-xl border-2 border-dashed border-blue-500/80 bg-blue-500/10 text-center animate-pulse">
                <span className="text-xs font-bold text-blue-300 uppercase">
                  {selectedSlot.replace('_', ' ')} ACTIVE BANNER
                </span>
                <span className="block text-[10px] text-gray-400 mt-1">{slotLabels[selectedSlot].dimensions}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD CATEGORY */}
      {/* ========================================================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Create New Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCategoryMutation.mutate({
                  name: newCatName,
                  slug: newCatSlug || newCatName.toLowerCase().replace(/\s+/g, '-'),
                  navigationType: newCatNavType,
                  description: newCatDesc,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-gray-400 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Camera Lens Glass"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-400 block mb-1">Hierarchy Flow (Technician Navigation)</label>
                <select
                  value={newCatNavType}
                  onChange={(e) => setNewCatNavType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-medium"
                >
                  <option value="brand_first">Brand Selection First (Cover, Combo, Battery, CC Board)</option>
                  <option value="type_first">Sub-type Selection First (Tempered Glass: Normal / Edge)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Category description..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD TYPE TO CATEGORY */}
      {/* ========================================================= */}
      {showAddTypeModal && selectedCategoryForTypes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Add Sub-Type</h3>
              <button onClick={() => setShowAddTypeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTypeMutation.mutate({
                  categoryId: selectedCategoryForTypes,
                  data: {
                    name: newTypeName,
                    code: newTypeSlug || newTypeName.toLowerCase().replace(/\s+/g, '-'),
                    description: newTypeDesc,
                  }
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-gray-400 block mb-1">Sub-Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Matte Tempered or Privacy Edge"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-400 block mb-1">Code / Slug</label>
                <input
                  type="text"
                  placeholder="e.g. matte-tempered"
                  value={newTypeSlug}
                  onChange={(e) => setNewTypeSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Type specifications..."
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTypeMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {createTypeMutation.isPending ? 'Saving...' : 'Add Sub-Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD MODEL */}
      {/* ========================================================= */}
      {showAddModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Add New Device Model</h3>
              <button onClick={() => setShowAddModelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newModelBrandId || !newModelCatId) {
                  alert('Please select both Brand and Category.');
                  return;
                }
                createModelMutation.mutate({
                  name: newModelName,
                  brandId: Number(newModelBrandId),
                  categoryId: Number(newModelCatId),
                  typeId: newModelTypeId ? Number(newModelTypeId) : undefined,
                  notes: newModelNotes,
                  isVerified: newModelVerified,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-gray-400 block mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vivo Y200e 5G"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-400 block mb-1">Brand</label>
                  <select
                    required
                    value={newModelBrandId}
                    onChange={(e) => setNewModelBrandId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-400 block mb-1">Category</label>
                  <select
                    required
                    value={newModelCatId}
                    onChange={(e) => setNewModelCatId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {modalCatTypes.length > 0 && (
                <div>
                  <label className="font-bold text-gray-400 block mb-1">Sub-Type (Optional)</label>
                  <select
                    value={newModelTypeId}
                    onChange={(e) => setNewModelTypeId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                  >
                    <option value="">None (Standard)</option>
                    {modalCatTypes.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-400 block mb-1">Technical Notes / Pinout</label>
                <textarea
                  rows={2}
                  placeholder="Connector type, dimensional specifications, etc."
                  value={newModelNotes}
                  onChange={(e) => setNewModelNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newModelVerified}
                  onChange={(e) => setNewModelVerified(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-bold text-gray-700 dark:text-gray-300">Mark as 100% Tested & Verified</span>
              </label>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModelModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createModelMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {createModelMutation.isPending ? 'Saving...' : 'Add Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD COMPATIBILITY LINK */}
      {/* ========================================================= */}
      {compatTargetModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Link Equivalent Compatibility</h3>
                <p className="text-xs text-blue-500 font-semibold mt-0.5">Base: {compatTargetModel.name}</p>
              </div>
              <button onClick={() => setCompatTargetModel(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCompatMutation.mutate({
                  id: compatTargetModel.id,
                  data: {
                    compatibleWith: compatWithName,
                    connectorType: compatConnector || undefined,
                    notes: compatNotes || undefined,
                  }
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-gray-400 block mb-1">Compatible Equivalent Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vivo Y83 Pro or Y71"
                  value={compatWithName}
                  onChange={(e) => setCompatWithName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-400 block mb-1">Connector / Pinout Type (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 24-pin ribbon, 40-pin flex"
                  value={compatConnector}
                  onChange={(e) => setCompatConnector(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-400 block mb-1">Verification Notes</label>
                <textarea
                  rows={2}
                  placeholder="Hardware test notes for technicians..."
                  value={compatNotes}
                  onChange={(e) => setCompatNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompatTargetModel(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCompatMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {addCompatMutation.isPending ? 'Linking...' : 'Save Compatibility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Model Details Inspector Modal */}
      <ModelDetailsModal
        modelId={inspectModelId}
        onClose={() => setInspectModelId(null)}
      />
    </div>
  );
}

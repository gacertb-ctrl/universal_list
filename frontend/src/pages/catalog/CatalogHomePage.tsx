import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getDashboardStats, getRecentUpdates } from '../../services/api';
import { Link } from 'react-router-dom';
import { AdComponent } from '../../components/ui/AdComponent';
import { AdvancedSearch } from '../../components/search/AdvancedSearch';
import { ModelDetailsModal } from '../../components/catalog/ModelDetailsModal';
import { 
  Smartphone, 
  Battery, 
  Layers, 
  Monitor, 
  Cpu, 
  Box, 
  Zap, 
  ChevronRight,
  Shield,
  MessageCircle,
  Search,
  CheckCircle,
  Clock
} from 'lucide-react';

export function CatalogHomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats
  });

  const { data: updatesData, isLoading: updatesLoading } = useQuery({
    queryKey: ['recent-updates'],
    queryFn: getRecentUpdates
  });

  const categories = categoriesData?.data || [];
  const stats = statsData?.data || { totalModels: '...', totalBrands: '...', totalCategories: '...' };
  const updates = updatesData?.data || [];

  const getCategoryIcon = (name: string, index: number) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tempered') || lowerName.includes('glass')) return Shield;
    if (lowerName.includes('touch') || lowerName.includes('oca')) return Layers;
    if (lowerName.includes('display') || lowerName.includes('combo') || lowerName.includes('folder')) return Monitor;
    if (lowerName.includes('connector')) return Cpu;
    if (lowerName.includes('frame') || lowerName.includes('middle')) return Smartphone;
    if (lowerName.includes('cover') || lowerName.includes('back')) return Box;
    if (lowerName.includes('battery')) return Battery;
    if (lowerName.includes('charging') || lowerName.includes('board')) return Zap;
    if (lowerName.includes('flex') || lowerName.includes('strip')) return Cpu;
    
    const icons = [Monitor, Battery, Layers, Cpu, Box, Smartphone, Zap, Shield];
    return icons[index % icons.length];
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Search Bar (Interactive Database Search) */}
      <div 
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
      >
        <div className="flex items-center space-x-3 text-gray-400 w-full max-w-2xl">
          <Search className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Search models, brands, or compatibility (e.g. Vivo V11, Redmi Note 10, Normal Tempered)...
          </span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 ml-2 sm:ml-4 shrink-0">
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            Ctrl + K
          </span>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/20">
            UL
          </div>
        </div>
      </div>

      <AdComponent 
        slotKey="home_top" 
        previewGradient="from-blue-600/10 via-indigo-600/5 to-purple-600/10"
        previewName="AdSlot: Home Top Banner"
        previewDescription="Displays a premium horizontal leaderboard (728x90 or fluid) between the global Search Bar and Blue Hero Card."
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-xl z-10 text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100">
              Universal List 2026
            </h1>
            <p className="text-lg sm:text-xl font-semibold mb-2 text-blue-100">One List. All Models. Always Updated.</p>
            <p className="text-xs sm:text-sm text-blue-200/80 mb-6 leading-relaxed max-w-lg">
              Your trusted mobile repair compatibility engine. Find matching tempered glass, combo folders, charging boards, batteries, and flex cables across manufacturers.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 text-xs sm:text-sm w-full sm:w-auto cursor-pointer"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Search Parts</span>
              </button>
              <a 
                href="https://whatsapp.com" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2.5 sm:px-6 sm:py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105 text-white text-xs sm:text-sm w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>WhatsApp Community</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 md:mt-0 flex flex-row gap-4 sm:gap-6 z-10 w-full md:w-auto justify-center">
            <div className="flex-1 sm:flex-none bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 text-center shadow-2xl flex flex-col justify-center transform rotate-3 max-w-[140px] sm:max-w-none">
              <span className="text-2xl sm:text-3xl font-black">{stats.totalModels || '30+'}</span>
              <span className="text-blue-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">Models</span>
            </div>
            <div className="flex-1 sm:flex-none bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 text-center shadow-2xl flex flex-col justify-center transform -rotate-3 mt-4 sm:mt-8 max-w-[140px] sm:max-w-none">
              <span className="text-2xl sm:text-3xl font-black">{stats.totalCategories || '9+'}</span>
              <span className="text-blue-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1">Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates from MySQL */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Recent Updates & Additions</h2>
          </div>
          <span className="text-xs text-gray-400 font-medium">Real-time database records</span>
        </div>
        
        <div className="overflow-x-auto">
          {updatesLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : updates.length > 0 ? (
            <table className="w-full text-left min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <th className="pb-3 pl-4">Date</th>
                  <th className="pb-3">Update Details</th>
                  <th className="pb-3 text-center">Compatibility</th>
                  <th className="pb-3 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((update: any, idx: number) => (
                  <tr 
                    key={update.id} 
                    onClick={() => update.modelId && setSelectedModelId(update.modelId)}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                  >
                    <td className="py-4 pl-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{update.date}</td>
                    <td className="py-4 font-medium text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      <div className="flex items-center space-x-2">
                        <span>{update.title}</span>
                        {idx < 2 && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] sm:text-xs font-bold rounded-full uppercase tracking-wider shrink-0">
                            New
                          </span>
                        )}
                        {update.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                        {update.compatCount || 1}+ Models
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ChevronRight className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">
              No recent updates found.
            </div>
          )}
        </div>
      </div>

      <AdComponent 
        slotKey="home_mid" 
        previewGradient="from-indigo-600/10 via-blue-600/5 to-emerald-600/10"
        previewName="AdSlot: Home Mid-Page Divider"
        previewDescription="Premium banner ad breaking up long vertical scrolls between the Recent Updates table and All Categories grid."
      />

      {/* All Categories Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product Categories</h2>
            <p className="text-xs text-gray-500 mt-1">Browse mobile repair spare parts and compatibility hierarchies</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
            {categories.length} Categories
          </span>
        </div>
        
        {categoriesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat: any, idx: number) => {
              const Icon = getCategoryIcon(cat.name, idx);
              // Route to types if type_first, else to brands
              const isTypeFirst = cat.navigationType === 'type_first' || cat.slug === 'tempered-glass' || cat.name?.toLowerCase().includes('tempered');
              const targetRoute = isTypeFirst 
                ? `/category/${cat.id}/types` 
                : `/category/${cat.id}/brands`;

              return (
                <Link 
                  to={targetRoute}
                  key={cat.id} 
                  className="relative p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-gray-900 transition-all duration-200 group hover:shadow-xl hover:-translate-y-1 flex items-start space-x-4 text-gray-800 dark:text-gray-100"
                >
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {cat._count?.models || 0} Models
                      {cat.types && cat.types.length > 0 && ` • ${cat.types.length} Types`}
                    </p>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 mt-2 font-semibold flex items-center">
                      {cat.navigationType === 'type_first' ? 'Select Type' : 'Select Brand'}
                      <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <div className="text-gray-300 dark:text-gray-700 font-bold text-xs">
                    {idx + 1}.
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats from Database */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">100%</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Verified Data</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalModels || 0}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Total Models</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalCategories || 0}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Categories</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalCompatibilities || 0}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Compatibility Pairs</p>
        </div>
      </div>

      {/* Advanced Global Search Modal */}
      <AdvancedSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Model Compatibility Details Modal */}
      <ModelDetailsModal modelId={selectedModelId} onClose={() => setSelectedModelId(null)} />
    </div>
  );
}

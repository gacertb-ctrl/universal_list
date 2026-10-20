import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getModels, getBrandById, getCategoryById, getCategoryTypes } from '../../services/api';
import { ChevronLeft, Search, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { AdComponent } from '../../components/ui/AdComponent';
import { ModelDetailsModal } from '../../components/catalog/ModelDetailsModal';

export function CatalogModelsPage() {
  const { categoryId, brandId, typeId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models', categoryId, brandId, typeId, verifiedOnly],
    queryFn: () => getModels({ 
      categoryId: categoryId || undefined, 
      brandId: brandId || undefined, 
      typeId: typeId || undefined,
      isVerified: verifiedOnly ? 'true' : undefined,
      limit: 100 
    })
  });

  const { data: brandData } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => getBrandById(brandId!),
    enabled: !!brandId,
  });

  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => getCategoryById(categoryId!),
    enabled: !!categoryId,
  });

  const { data: typesData } = useQuery({
    queryKey: ['category-types', categoryId],
    queryFn: () => getCategoryTypes(categoryId!),
    enabled: !!categoryId && !!typeId,
  });

  const brand = brandData?.data;
  const category = categoryData?.data;
  const types = typesData?.data || [];
  const selectedType = types.find((t: any) => String(t.id) === String(typeId));

  const brandName = brand ? brand.name : '';
  const categoryName = category ? category.name : 'Mobile Parts';
  const typeName = selectedType ? selectedType.name : '';

  const models = modelsData?.data || [];

  const filteredModels = models.filter((model: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchName = model.name.toLowerCase().includes(searchLower);
    const matchAlias = model.aliases?.some((a: any) => a.aliasName.toLowerCase().includes(searchLower));
    const matchCompat = model.compatibilityLists?.some((c: any) => c.compatibleWith.toLowerCase().includes(searchLower));
    return matchName || matchAlias || matchCompat;
  });

  const formatCompatibilityString = (model: any) => {
    const parts = [model.name];
    if (model.compatibilityLists && model.compatibilityLists.length > 0) {
      parts.push(...model.compatibilityLists.map((c: any) => c.compatibleWith));
    }
    const uniqueParts = Array.from(new Set(parts));
    return uniqueParts.join(' = ');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-0.5 flex-wrap">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-700 dark:text-gray-300">{categoryName}</span>
              {typeName && (
                <>
                  <span>/</span>
                  <span className="text-gray-700 dark:text-gray-300">{typeName}</span>
                </>
              )}
              {brandName && (
                <>
                  <span>/</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{brandName}</span>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
              <span>{brandName ? `${brandName} ` : ''}{categoryName} {typeName ? `(${typeName}) ` : ''}Models</span>
              <span className="text-xs px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                {models.length} Records
              </span>
            </h1>
          </div>
        </div>
        
        {/* Search & Filter Controls */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search model or alias..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 shadow-sm"
            />
          </div>

          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              verifiedOnly 
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-emerald-400'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verified Only</span>
          </button>
        </div>
      </div>

      {/* Model Listings */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        {modelsLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredModels.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredModels.map((model: any, index: number) => {
              const compString = formatCompatibilityString(model);
              const isAdIndex = index === 3;
              const hasType = !!model.categoryType;

              return (
                <div key={model.id} className="flex flex-col">
                  <div 
                    onClick={() => setSelectedModelId(model.id)}
                    className="p-4 sm:p-5 flex items-center hover:bg-blue-50/50 dark:hover:bg-blue-900/15 transition-colors cursor-pointer group"
                  >
                    <div className="mr-3 sm:mr-4 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 pr-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="text-gray-400 font-normal text-xs">{index + 1}.</span>
                          <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {compString}
                          </span>
                          {model.isVerified && (
                            <span className="inline-flex items-center text-emerald-500" title="Verified compatibility">
                              <CheckCircle className="w-4 h-4 ml-1" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 self-start sm:self-auto shrink-0">
                          {hasType && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
                              {model.categoryType.name}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                            {model.compatibilityLists?.length || 0} Equivalent
                          </span>
                        </div>
                      </div>

                      {model.notes && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {model.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Non-intrusive In-Feed Banner after 4th item */}
                  {isAdIndex && (
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                      <AdComponent 
                        slotKey="in_list"
                        previewGradient="from-indigo-600/5 via-purple-600/10 to-blue-600/5"
                        previewName="Sponsored: Repair Lab Replacement Stock"
                        previewDescription="Fast dispatch on original connector flexes, middle frames, and camera lenses for certified workshops."
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-gray-500">
              No models found matching "{searchQuery}".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setVerifiedOnly(false); }}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Model Compatibility Details Modal */}
      <ModelDetailsModal 
        modelId={selectedModelId} 
        onClose={() => setSelectedModelId(null)} 
      />
    </div>
  );
}

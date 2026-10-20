import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategoryTypes, getCategoryById } from '../../services/api';
import { ChevronLeft, Shield, Layers, Search, ArrowRight, Sparkles } from 'lucide-react';
import { AdComponent } from '../../components/ui/AdComponent';

export function CatalogTypesPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => getCategoryById(categoryId!),
    enabled: !!categoryId,
  });

  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['category-types', categoryId],
    queryFn: () => getCategoryTypes(categoryId!),
    enabled: !!categoryId,
  });

  const category = categoryData?.data;
  const types = typesData?.data || [];

  // Auto-redirect to brands if category is brand_first or has no types
  useEffect(() => {
    if (category && (category.navigationType === 'brand_first' || (types.length === 0 && !typesLoading))) {
      navigate(`/category/${categoryId}/brands`, { replace: true });
    }
  }, [category, categoryId, types.length, typesLoading, navigate]);

  const filteredTypes = types.filter((t: any) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-0.5">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-800 dark:text-gray-200 font-semibold">{category?.name || 'Category'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Select {category?.name || 'Tempered'} Type
            </h1>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Normal or Edge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 shadow-sm"
          />
        </div>
      </div>

      {/* Info Callout Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Technician Compatibility Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Choose Tempered Glass Profile
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Flat display models use <strong>Normal Tempered</strong> (2.5D, 9D, 11D, Full Glue). Curved and edge-to-edge screens require <strong>Edge Tempered</strong> (UV glue, 3D hot-bending). Select your profile to view matching models.
          </p>
        </div>
      </div>

      {/* Types Grid */}
      {typesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTypes.map((type: any) => {
            const isEdge = type.slug === 'edge';
            return (
              <Link
                key={type.id}
                to={`/category/${categoryId}/type/${type.id}/models`}
                className={`relative p-6 sm:p-8 rounded-3xl border transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between ${
                  isEdge
                    ? 'bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900/40 border-purple-500/30 hover:border-purple-500/60'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-500/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3.5 rounded-2xl ${
                      isEdge
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    }`}>
                      {isEdge ? <Layers className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {type._count?.models || 0} Models
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {type.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    {type.description || (isEdge ? '3D Curved, UV Gel, and hot bending edge-to-edge screen protectors' : '2.5D, 9D, 11D Full Glue flat screen tempered glasses')}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center group-hover:translate-x-1 transition-transform">
                    <span>Browse {type.name} Models</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </span>

                  <span className="text-xs font-semibold text-gray-400">
                    Step 2 of 3
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Ad Placement */}
      <AdComponent
        slotKey="home_mid"
        previewGradient="from-blue-600/10 via-purple-600/5 to-indigo-600/10"
        previewName="Sponsored: Premium High-Alumina Tempered Glass Batches"
        previewDescription="Direct factory pricing on 0.33mm High-Alumina flat and UV curved tempered glass sheets for repair workshops."
      />
    </div>
  );
}

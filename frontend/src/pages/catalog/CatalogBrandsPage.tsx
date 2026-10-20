import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategoryBrands, getCategoryById, getCategoryTypes } from '../../services/api';
import { ChevronLeft, Search, ShieldCheck, RefreshCw, Users, ThumbsUp, ArrowRight } from 'lucide-react';
import { CachedImage } from '../../components/ui/CachedImage';
import { AdComponent } from '../../components/ui/AdComponent';

export function CatalogBrandsPage() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const typeId = searchParams.get('typeId') || undefined;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ['category-brands', categoryId, typeId],
    queryFn: () => getCategoryBrands(categoryId!, typeId),
    enabled: !!categoryId,
  });

  const category = categoryData?.data;
  const types = typesData?.data || [];
  const selectedType = types.find((t: any) => String(t.id) === String(typeId));
  const brands = brandsData?.data || [];

  // Enforce Tempered workflow: If category is type_first and no typeId selected, route to types selection
  useEffect(() => {
    if (category && (category.navigationType === 'type_first' || category.slug === 'tempered-glass' || category.name?.toLowerCase().includes('tempered')) && !typeId) {
      navigate(`/category/${categoryId}/types`, { replace: true });
    }
  }, [category, categoryId, typeId, navigate]);

  const filteredBrands = brands.filter((brand: any) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Dynamic Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-0.5">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <span>/</span>
              {category?.navigationType === 'type_first' ? (
                <Link to={`/category/${categoryId}/types`} className="hover:text-blue-600 transition-colors">
                  {category?.name || 'Category'}
                </Link>
              ) : (
                <span className="text-gray-800 dark:text-gray-200 font-semibold">{category?.name || 'Category'}</span>
              )}
              {selectedType && (
                <>
                  <span>/</span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">{selectedType.name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Select Brand for {category?.name || 'Category'} {selectedType ? `(${selectedType.name})` : ''}
            </h1>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search manufacturer brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 shadow-sm"
          />
        </div>
      </div>

      {/* Brands Grid */}
      {brandsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredBrands.map((brand: any) => {
            const modelsRoute = typeId
              ? `/category/${categoryId}/type/${typeId}/brand/${brand.id}/models`
              : `/category/${categoryId}/brand/${brand.id}/models`;

            return (
              <Link
                key={brand.id}
                to={modelsRoute}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-3 hover:shadow-xl hover:border-blue-500/60 dark:hover:border-blue-500/50 transition-all duration-200 group hover:-translate-y-1 text-center"
              >
                <div className="h-12 flex items-center justify-center">
                  <CachedImage
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="max-h-10 max-w-[100px] object-contain group-hover:scale-105 transition-transform"
                    fallback={
                      <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 uppercase tracking-tighter">
                        {brand.name}
                      </span>
                    }
                  />
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    {brand.modelCount || 0} Models Available
                  </p>
                </div>

                <span className="text-[10px] text-gray-400 font-semibold inline-flex items-center group-hover:text-blue-500 pt-1">
                  <span>View Models</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-b border-gray-200 dark:border-gray-800 text-center">
        <div className="flex flex-col items-center">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">100%<br />Verified Data</span>
        </div>
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-blue-500 mb-2" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Database<br />Backed</span>
        </div>
        <div className="flex flex-col items-center">
          <Users className="w-8 h-8 text-indigo-500 mb-2" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Technician<br />Tested</span>
        </div>
        <div className="flex flex-col items-center">
          <ThumbsUp className="w-8 h-8 text-purple-500 mb-2" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Fast Pinout<br />Matching</span>
        </div>
      </div>

      <AdComponent
        slotKey="home_mid"
        previewGradient="from-indigo-600/10 via-blue-600/5 to-purple-600/10"
        previewName="Sponsored: Direct Wholesale LCD/OLED Supplier"
        previewDescription="Specialized supplier of Vivo, Redmi, and Samsung touch folders and charging sub-boards with replacement warranty."
      />
    </div>
  );
}

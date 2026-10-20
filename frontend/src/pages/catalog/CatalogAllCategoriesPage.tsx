import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../services/api';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Battery, 
  Layers, 
  Monitor, 
  Cpu, 
  Box, 
  Zap, 
  Shield,
  MoreHorizontal
} from 'lucide-react';

export function CatalogAllCategoriesPage() {
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const categories = categoriesData?.data || [];

  const getCategoryIcon = (name: string, index: number) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tempered') || lowerName.includes('glass')) return Shield;
    if (lowerName.includes('touch') || lowerName.includes('oca')) return Layers;
    if (lowerName.includes('display') || lowerName.includes('combo') || lowerName.includes('folder')) return Monitor;
    if (lowerName.includes('connector')) return Cpu;
    if (lowerName.includes('frame')) return Smartphone;
    if (lowerName.includes('back')) return Box;
    if (lowerName.includes('battery')) return Battery;
    if (lowerName.includes('power') || lowerName.includes('volume') || lowerName.includes('flex')) return Zap;
    if (lowerName.includes('charging') || lowerName.includes('board')) return Zap;
    
    const icons = [Monitor, Battery, Layers, Cpu, Box, Smartphone, Zap, Shield];
    return icons[index % icons.length];
  };

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 dark:bg-[#020617]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">All Compatibility Categories</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse mobile compatibility list by category</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        {categoriesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat: any, idx: number) => {
              const Icon = getCategoryIcon(cat.name, idx);
              const isTypeFirst = cat.navigationType === 'type_first' || cat.slug === 'tempered-glass' || cat.name?.toLowerCase().includes('tempered');
              const targetRoute = isTypeFirst 
                ? `/category/${cat.id}/types` 
                : `/category/${cat.id}/brands`;

              return (
                <Link 
                  to={targetRoute}
                  key={cat.id} 
                  className="relative p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1 transition-all duration-300 group hover:shadow-lg flex items-start space-x-4 text-gray-800 dark:text-gray-100"
                >
                  <div className="p-3 rounded-xl shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight mb-1">{cat.name}</h3>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {cat._count?.models ?? (cat.models?.length || 0)} Models
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 text-gray-300 dark:text-gray-600">
                    <span className="text-xs font-bold text-gray-400">{idx + 1}.</span>
                  </div>
                </Link>
              );
            })}
            
            <div className="p-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex items-start space-x-4">
              <div className="p-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 shrink-0">
                <MoreHorizontal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-1">Coming Soon</h3>
                <p className="text-xs font-medium text-gray-400">Stay Tuned</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

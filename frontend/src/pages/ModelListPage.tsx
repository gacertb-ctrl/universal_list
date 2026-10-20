import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Edit2, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getModels, getBrands, getCategories, createModel, updateModel, deleteModel } from '../services/api';
import { GlassCard } from '../components/ui/GlassCard';

export function ModelListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterBrandId, setFilterBrandId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Add/Edit Form State
  const [modelName, setModelName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [aliases, setAliases] = useState('');
  const [compatibilities, setCompatibilities] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Sync URL search queries to state
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  // Queries
  const { data: modelsData, isLoading, isError } = useQuery({
    queryKey: ['models', page, searchTerm, filterBrandId, filterCategoryId],
    queryFn: () => getModels({ 
      page, 
      search: searchTerm,
      brandId: filterBrandId || undefined,
      categoryId: filterCategoryId || undefined,
      limit: 10
    }),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const brands = brandsData?.data || [];
  const categories = categoriesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create model');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update model');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete model');
    }
  });

  const resetForm = () => {
    setEditingModel(null);
    setModelName('');
    setBrandId('');
    setCategoryId('');
    setAliases('');
    setCompatibilities('');
    setIsVerified(true);
  };

  const handleOpenAddModal = () => {
    resetForm();
    if (brands.length > 0) setBrandId(brands[0].id.toString());
    if (categories.length > 0) setCategoryId(categories[0].id.toString());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (model: any) => {
    setEditingModel(model);
    setModelName(model.name);
    setBrandId(model.brandId.toString());
    setCategoryId(model.categoryId.toString());
    setIsVerified(model.isVerified);
    
    // Join array fields to string representation for editing
    const aliasStr = model.aliases?.map((a: any) => a.aliasName).join(', ') || '';
    setAliases(aliasStr);
    
    const compatStr = model.compatibilityLists?.map((c: any) => c.compatibleWith).join(', ') || '';
    setCompatibilities(compatStr);
    
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) return alert('Model name is required');
    if (!brandId) return alert('Please select a brand');
    if (!categoryId) return alert('Please select a category');

    const payload = {
      name: modelName.trim(),
      brandId,
      categoryId,
      isVerified,
      aliases: aliases.split(',').map(a => a.trim()).filter(Boolean),
      compatibilityLists: compatibilities.split(',').map(c => ({
        compatibleWith: c.trim(),
        connectorType: 'Standard',
        type: 'Display'
      })).filter(c => c.compatibleWith.length > 0)
    };

    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleClearFilters = () => {
    setFilterBrandId('');
    setFilterCategoryId('');
    setIsFilterOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mobile Models</h1>
          <p className="text-gray-500 mt-1">Manage models, parts, and their compatibility.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-all font-semibold text-sm cursor-pointer ${
              filterBrandId || filterCategoryId ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--color-border)]/20'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter {(filterBrandId || filterCategoryId) && '•'}</span>
          </button>
          
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-lg shadow-[var(--color-primary)]/30 font-semibold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-white/5 dark:bg-black/10">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Brand</label>
                <select
                  value={filterBrandId}
                  onChange={(e) => {
                    setFilterBrandId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] select-arrow"
                >
                  <option value="" className="bg-[#0f172a]">All Brands</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id.toString()} className="bg-[#0f172a]">{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Category</label>
                <select
                  value={filterCategoryId}
                  onChange={(e) => {
                    setFilterCategoryId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] select-arrow"
                >
                  <option value="" className="bg-[#0f172a]">All Categories</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id.toString()} className="bg-[#0f172a]">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClearFilters}
                  className="w-full py-2 border border-[var(--color-border)] rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Data */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center space-x-3 bg-white/5 dark:bg-black/20">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search models by name, brand..."
            className="bg-transparent border-none outline-none w-full text-sm text-[var(--color-foreground)] placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-sm font-medium text-gray-500 bg-white/5 dark:bg-black/10">
                <th className="py-4 px-6">Model Name</th>
                <th className="py-4 px-6">Brand</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Compatibilities</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-red-500">
                    Failed to load models. Please check your connection.
                  </td>
                </tr>
              ) : modelsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No models found.
                  </td>
                </tr>
              ) : (
                modelsData?.data?.map((model: any, index: number) => {
                  const aliasesStr = model.aliases?.map((a: any) => a.aliasName).join(', ') || '';
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      key={model.id} 
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/20 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--color-foreground)]">{model.name}</span>
                          {aliasesStr && (
                            <span className="text-xs text-gray-500 font-medium mt-0.5">Aliases: {aliasesStr}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          {model.brand?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-semibold whitespace-nowrap">
                          {model.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {model.compatibilityLists?.slice(0, 2).map((comp: any) => (
                            <span key={comp.id} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-medium">
                              {comp.compatibleWith}
                            </span>
                          ))}
                          {model.compatibilityLists?.length > 2 && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-semibold text-gray-500">
                              +{model.compatibilityLists.length - 2} more
                            </span>
                          )}
                          {(!model.compatibilityLists || model.compatibilityLists.length === 0) && (
                            <span className="text-xs text-gray-500 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {model.isVerified ? (
                          <span className="inline-flex items-center space-x-1.5 text-xs text-green-500 font-bold bg-green-500/10 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenEditModal(model)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-full transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(model)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm text-gray-500 bg-white/5 dark:bg-black/10">
          <span>Showing Page {page} of {modelsData?.pagination?.totalPages || 1} ({modelsData?.pagination?.total || 0} entries)</span>
          <div className="flex space-x-1">
            <button 
              className="px-3 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs font-bold"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <button 
              className="px-3 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs font-bold"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (modelsData?.pagination?.totalPages || 1)}
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 my-8 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold">
              {editingModel ? 'Edit Mobile Model' : 'Add New Mobile Model'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Model Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Vivo Y200 5G"
                  className="w-full px-4 py-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Brand</label>
                  <select
                    required
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] select-arrow"
                  >
                    {brands.map((b: any) => (
                      <option key={b.id} value={b.id.toString()} className="bg-[#0f172a]">{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] select-arrow"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id.toString()} className="bg-[#0f172a]">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Aliases (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Y200, T3 Match (comma-separated)"
                  className="w-full px-4 py-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Compatible Models (Optional)</label>
                <textarea 
                  placeholder="e.g. Vivo T3, Vivo Y300, IQOO Z6 5G (comma-separated)"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm resize-none"
                  value={compatibilities}
                  onChange={(e) => setCompatibilities(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox"
                  id="isVerified"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-transparent"
                />
                <label htmlFor="isVerified" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Mark as Verified (Approved compatibility list)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--color-border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-[var(--color-primary)]/20 disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Model'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <h3 className="text-xl font-bold text-red-500">Delete Model</h3>
            <p className="text-sm text-gray-400">
              Are you sure you want to delete <span className="font-bold text-white">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--color-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Model'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

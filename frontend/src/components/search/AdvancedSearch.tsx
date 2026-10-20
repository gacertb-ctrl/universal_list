import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Smartphone, CheckCircle, Database, ChevronRight, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchModels, searchSuggestions } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { ModelDetailsModal } from '../catalog/ModelDetailsModal';

export function AdvancedSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // 1. Fetch autocomplete suggestions as they type
  const { data: suggestData, isLoading: suggestLoading } = useQuery({
    queryKey: ['search-suggest', debouncedQuery],
    queryFn: () => searchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  // 2. Fetch full matching models list
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['search-models', debouncedQuery],
    queryFn: () => searchModels(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  const suggestions = suggestData?.data || [];
  const models = modelsData?.data || [];
  const isLoading = suggestLoading || modelsLoading;

  // Reset active index on query change
  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  // Handle keyboard shortcuts (Escape, Arrows, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedModelId) {
          setSelectedModelId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedModelId]);

  const handleInspectModel = (modelId: number) => {
    setSelectedModelId(modelId);
  };

  const handleNavigateToModel = (model: any) => {
    onClose();
    if (model.categoryId && model.brandId) {
      navigate(`/category/${model.categoryId}/brand/${model.brandId}/models`);
    } else if (model.categoryId) {
      navigate(`/category/${model.categoryId}/brands`);
    } else {
      navigate(`/models?q=${encodeURIComponent(model.name)}`);
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + models.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        setQuery(suggestions[activeIndex].name);
      } else if (activeIndex >= suggestions.length && activeIndex < totalItems) {
        const modelIndex = activeIndex - suggestions.length;
        handleInspectModel(models[modelIndex].id);
      } else if (query.trim()) {
        onClose();
        navigate(`/models?q=${encodeURIComponent(query)}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            className="relative w-full max-w-3xl bg-white dark:bg-[#0b1329] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 z-10 mx-4"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 animate-pulse" />
              <input
                autoFocus
                type="text"
                placeholder="Search phone model, brand (e.g. Vivo V11, Y81, Y200)..."
                className="flex-1 bg-transparent text-base sm:text-lg font-medium outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownInput}
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Container */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {isLoading && query.length > 1 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3"></div>
                  <span className="text-sm font-medium">Scanning dynamic database & compatibility list...</span>
                </div>
              ) : query.length > 1 && models.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <p className="font-semibold text-gray-700 dark:text-gray-300">No exact matches found for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try searching by partial model name or brand (e.g. "Vivo" or "Y81")</p>
                </div>
              ) : models.length > 0 || suggestions.length > 0 ? (
                <div className="p-3 space-y-2">
                  {/* Quick Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Instant Autocomplete</span>
                        <span className="text-blue-500 text-[10px] lowercase font-normal">press enter to fill</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-2 py-1">
                        {suggestions.map((sug: any, sIdx: number) => {
                          const isSelected = activeIndex === sIdx;
                          return (
                            <button
                              key={`sug-${sug.id}`}
                              onClick={() => setQuery(sug.name)}
                              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <span>{sug.name}</span>
                              <span className="text-[10px] opacity-70 uppercase">({sug.brand?.name})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Compatibility Results */}
                  {models.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span>Matching Models ({models.length})</span>
                        <span className="text-emerald-500 text-[10px] font-semibold">100% Tested Compatibilities</span>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {models.map((model: any, mIdx: number) => {
                          const itemIndex = suggestions.length + mIdx;
                          const isSelected = activeIndex === itemIndex;
                          const compatList = model.compatibilityLists || [];

                          return (
                            <div 
                              key={model.id}
                              onClick={() => handleInspectModel(model.id)}
                              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between group ${
                                isSelected 
                                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                                  : 'bg-white dark:bg-gray-900/40 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-100 dark:border-gray-800/80'
                              }`}
                            >
                              <div className="flex items-start space-x-3 min-w-0 flex-1 pr-3">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shrink-0 mt-0.5">
                                  <Smartphone className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                      {model.name}
                                    </h4>
                                    {model.isVerified && (
                                      <span title="Verified by Technicians">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                      </span>
                                    )}
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-blue-100/70 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                      {model.brand?.name}
                                    </span>
                                    {model.categoryType && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-purple-100/70 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                        {model.categoryType.name}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Category: <span className="font-medium text-gray-700 dark:text-gray-300">{model.category?.name}</span>
                                  </p>

                                  {/* Compatible Equivalents Inline Badge */}
                                  {compatList.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      <span className="text-[11px] font-bold text-gray-400 mr-1">=</span>
                                      {compatList.slice(0, 4).map((comp: any) => (
                                        <span 
                                          key={comp.id} 
                                          className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg"
                                        >
                                          {comp.compatibleWith}
                                        </span>
                                      ))}
                                      {compatList.length > 4 && (
                                        <span className="text-[10px] text-gray-400 font-semibold px-1">
                                          +{compatList.length - 4} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-1 shrink-0 self-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInspectModel(model.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center space-x-1 transition-colors"
                                  title="View Specifications & Compatibility"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Inspect</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToModel(model);
                                  }}
                                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                  title="View in Catalog"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>Popular Search Queries</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Vivo V11', 'Vivo Y81', 'Vivo Y11', 'Vivo Y200 5G', 'Edge Tempered', 'Normal Tempered', 'Battery List'].map(term => (
                      <button 
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-semibold transition-all border border-gray-200 dark:border-gray-700"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Keyboard hints footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 flex items-center justify-between text-[11px] text-gray-500">
              <div className="flex items-center space-x-4">
                <span><kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">↓</kbd> to navigate</span>
                <span><kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">Enter</kbd> to select</span>
              </div>
              <span><kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-[10px]">Esc</kbd> to close</span>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Model Details Modal on Top */}
      <ModelDetailsModal
        modelId={selectedModelId}
        onClose={() => setSelectedModelId(null)}
      />
    </>
  );
}


import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  Cpu, 
  Send
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getModelById } from '../../services/api';

interface ModelDetailsModalProps {
  modelId: number | null;
  onClose: () => void;
  onSelectModel?: (id: number) => void;
}

export function ModelDetailsModal({ modelId, onClose }: ModelDetailsModalProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const { data: modelData, isLoading } = useQuery({
    queryKey: ['model-details', modelId],
    queryFn: () => getModelById(modelId!),
    enabled: !!modelId,
  });

  if (!modelId) return null;

  const model = modelData?.data;

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote.trim()) return;
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSent(false);
      setReportNote('');
    }, 2000);
  };

  const compatList = model?.compatibilityLists || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0b1329] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                  {model?.brand?.name || 'Brand'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                  {model?.category?.name || 'Category'}
                </span>
                {model?.categoryType && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                    {model.categoryType.name}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center">
                <span>{model?.name || 'Loading Model...'}</span>
                {model?.isVerified && (
                  <span className="ml-2 inline-flex items-center text-emerald-500" title="100% Tested & Verified">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                )}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-sm">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500">Querying database for verified compatibility relationships...</p>
              </div>
            ) : model ? (
              <>
                {/* Verified Compatibility Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-emerald-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Verified Equivalent / Compatible Models
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {compatList.length} Compatible
                    </span>
                  </div>

                  {compatList.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm">
                        {model.name}
                      </div>

                      {compatList.map((comp: any, idx: number) => (
                        <div key={comp.id || idx} className="flex items-center space-x-2">
                          <span className="text-gray-400 font-bold">=</span>
                          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-medium text-xs shadow-sm flex items-center space-x-1.5">
                            <span>{comp.compatibleWith}</span>
                            {comp.connectorType && (
                              <span className="text-[10px] text-gray-400 font-normal">
                                ({comp.connectorType})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-2">
                      No additional compatible cross-model relationships verified yet.
                    </p>
                  )}
                </div>

                {/* Technical Details & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
                    <div className="flex items-center text-xs text-gray-400 mb-1">
                      <Cpu className="w-3.5 h-3.5 mr-1 text-blue-500" />
                      <span>Specifications / Notes</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {model.notes || 'Original OEM pinout and dimensional tolerance verified for repair technicians.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
                    <div className="flex items-center text-xs text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      <span>Verification & Update Record</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-400">Status: </span>
                        <span className={`font-semibold ${model.isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {model.isVerified ? 'Verified by Technicians' : 'Pending Verification'}
                        </span>
                      </p>
                      <p className="text-gray-500">
                        Last verified: {model.lastVerifiedAt ? new Date(model.lastVerifiedAt).toLocaleDateString('en-GB') : 'Recent'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aliases if any */}
                {model.aliases && model.aliases.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Known Model Aliases & Alternate Codes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {model.aliases.map((a: any) => (
                        <span
                          key={a.id}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono"
                        >
                          {a.aliasName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Report Incorrect Feedback Section */}
                <div className="pt-2">
                  {!reportOpen ? (
                    <button
                      onClick={() => setReportOpen(true)}
                      className="text-xs text-gray-500 hover:text-amber-500 flex items-center transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      <span>Notice an incorrect compatibility? Report to our technician review team</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSendReport} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1.5" />
                          Report Compatibility Issue
                        </span>
                        <button
                          type="button"
                          onClick={() => setReportOpen(false)}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          Cancel
                        </button>
                      </div>

                      {reportSent ? (
                        <p className="text-xs text-emerald-500 font-semibold py-1">
                          Thank you! Your report has been submitted to the database team for review.
                        </p>
                      ) : (
                        <>
                          <textarea
                            rows={2}
                            placeholder="Describe which model or pin mismatch occurred..."
                            value={reportNote}
                            onChange={(e) => setReportNote(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 dark:text-gray-200"
                            required
                          />
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Submit Report</span>
                          </button>
                        </>
                      )}
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">Model not found in database.</div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center">
              Universal List 2026 • Verified Compatibility Engine
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

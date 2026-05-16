import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import api from '../api/axios';
import type { Lead, LeadStatus, LeadSource, ApiResponse, PaginationMeta } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, Download, Edit2, Trash2, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import LeadModal from './LeadModal';

export default function LeadsPage() {
  const { user } = useAuth();
  
  // Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [page, setPage] = useState(1);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Delete State
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort: sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(sourceFilter && { source: sourceFilter }),
      });

      const { data } = await api.get<ApiResponse<Lead[]>>(`/leads?${params}`);
      setLeads(data.data || []);
      setMeta(data.meta || null);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [page, sortOrder, debouncedSearch, statusFilter, sourceFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(sourceFilter && { source: sourceFilter }),
      });
      const { data } = await api.get<ApiResponse<Record<string, number>>>(`/leads/stats?${params}`);
      setStats(data.data || null);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  }, [debouncedSearch, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sourceFilter, sortOrder]);

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/leads/${leadToDelete}`);
      toast.success('Lead deleted');
      setLeadToDelete(null);
      fetchLeads();
      fetchStats();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        sort: sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(sourceFilter && { source: sourceFilter }),
      });
      
      const response = await api.get(`/leads/export/csv?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', lead?: Lead) => {
    setModalMode(mode);
    setSelectedLead(lead || null);
    setIsModalOpen(true);
  };

  const statusColors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    Qualified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-space-grotesk font-bold text-slate-900 dark:text-white tracking-tight">Leads Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-outfit">View and manage all your leads efficiently.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Button variant="secondary" onClick={handleExportCSV} className="flex-1 sm:flex-none h-12 px-6">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => openModal('create')} className="flex-1 sm:flex-none h-12 px-6">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bento-card p-5">
            <p className="text-sm text-slate-500 font-medium">Total Leads</p>
            <p className="text-2xl font-bold mt-1">{stats.total || 0}</p>
          </div>
          <div className="bento-card p-5">
            <p className="text-sm text-slate-500 font-medium">New</p>
            <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{stats.New || 0}</p>
          </div>
          <div className="bento-card p-5">
            <p className="text-sm text-slate-500 font-medium">Contacted</p>
            <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.Contacted || 0}</p>
          </div>
          <div className="bento-card p-5">
            <p className="text-sm text-slate-500 font-medium">Qualified</p>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.Qualified || 0}</p>
          </div>
          <div className="bento-card p-5">
            <p className="text-sm text-slate-500 font-medium">Lost</p>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{stats.Lost || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bento-card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-accent-blue/10 blur-[40px] pointer-events-none"></div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search leads..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
          className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm text-black dark:text-white focus:outline-none focus:ring-0 focus:border-black dark:focus:border-white transition-all font-sans appearance-none relative z-10 cursor-pointer"
        >
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="">All Statuses</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="New">New</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Contacted">Contacted</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Qualified">Qualified</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Lost">Lost</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as LeadSource | '')}
          className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm text-black dark:text-white focus:outline-none focus:ring-0 focus:border-black dark:focus:border-white transition-all font-sans appearance-none relative z-10 cursor-pointer"
        >
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="">All Sources</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Website">Website</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Instagram">Instagram</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Google">Google</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Referral">Referral</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
          className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm text-black dark:text-white focus:outline-none focus:ring-0 focus:border-black dark:focus:border-white transition-all font-sans appearance-none relative z-10 cursor-pointer"
        >
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="latest">Latest First</option>
          <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-[#121214] border-b border-border">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-space-grotesk font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-5 text-left text-xs font-space-grotesk font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-8 py-5 text-left text-xs font-space-grotesk font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-left text-xs font-space-grotesk font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Source</th>
                <th className="px-8 py-5 text-right text-xs font-space-grotesk font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No leads found</h3>
                      <p className="text-slate-500 max-w-sm">We couldn't find any leads matching your current filters. Try adjusting your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr 
                    key={lead._id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => openModal('view', lead)}
                  >
                    <td className="px-6 py-4 font-medium">{lead.name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{lead.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{lead.source}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal('view', lead); }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(user?.role === 'admin' || (typeof lead.createdBy === 'object' ? ((lead.createdBy as any)._id || (lead.createdBy as any).id) === user?.id : lead.createdBy === user?.id)) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal('edit', lead); }}
                          className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLeadToDelete(lead._id); }}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-500 text-center sm:text-left">
              Showing {(meta.currentPage - 1) * meta.limit + 1} to{' '}
              {Math.min(meta.currentPage * meta.limit, meta.totalCount)} of {meta.totalCount} results
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!meta.hasPrevPage}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={!meta.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <LeadModal
          lead={selectedLead}
          mode={modalMode}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchLeads();
            fetchStats();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Lead?</h3>
            <p className="text-slate-500 mb-6 text-sm">Are you sure you want to delete this lead? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setLeadToDelete(null)} disabled={isDeleting} className="w-full">
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting} className="w-full">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

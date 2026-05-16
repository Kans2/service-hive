import { useState, useEffect } from 'react';
import type { Lead, LeadStatus, LeadSource } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { X, Mail, Globe, Calendar, User as UserIcon } from 'lucide-react';

interface LeadModalProps {
  lead: Lead | null;
  mode: 'create' | 'edit' | 'view';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadModal({ lead, mode, isOpen, onClose, onSuccess }: LeadModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [source, setSource] = useState<LeadSource>('Website');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setEmail(lead.email);
      setStatus(lead.status);
      setSource(lead.source);
    } else {
      setName('');
      setEmail('');
      setStatus('New');
      setSource('Website');
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }
    
    setIsLoading(true);
    setFieldErrors({});

    try {
      const payload = { name, email, status, source };
      
      if (mode === 'edit' && lead) {
        await api.put(`/leads/${lead._id}`, payload);
        toast.success('Lead updated successfully');
      } else {
        await api.post('/leads', payload);
        toast.success('Lead created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string, errors?: {field: string, message: string}[] } } };
      
      if (axiosErr.response?.data?.errors) {
        const errors: Record<string, string> = {};
        axiosErr.response.data.errors.forEach(err => {
          errors[err.field] = err.message;
        });
        setFieldErrors(errors);
      }
      
      const msg = axiosErr.response?.data?.message || (error instanceof Error ? error.message : 'Failed to save lead');
      if (!axiosErr.response?.data?.errors) {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    Qualified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bento-card relative overflow-hidden group">
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-slate-500/10 dark:bg-slate-400/10 rounded-full blur-[40px] group-hover:bg-slate-500/20 transition-all duration-500 pointer-events-none"></div>
        
        <div className="absolute top-4 right-4 z-20">
          <button type="button" onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-border">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center mb-6 pt-10 px-6 relative z-10">
          <h2 className="text-3xl font-space-grotesk font-bold text-slate-900 dark:text-white tracking-tight">
            {mode === 'view' ? 'Lead Profile' : mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-outfit">
            {mode === 'view' ? 'Reviewing prospect details' : mode === 'edit' ? 'Update prospect information' : 'Enter details for a new prospect'}
          </p>
        </div>

        {mode === 'view' ? (
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900"></div>
              
              <div className="w-20 h-20 bg-white dark:bg-[#121214] rounded-full p-1 shadow-sm border border-border z-10 mb-3">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Lead')}&background=random&color=fff&size=128&bold=true`} 
                  alt={name} 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              
              <div className="z-10">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white font-space-grotesk">{name}</h4>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-sm shadow-sm border border-border/50">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${email}`} className="hover:text-primary-600 transition-colors font-medium">{email}</a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-border">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Current Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusColors[status]}`}>
                  {status}
                </span>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-border">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Lead Source</p>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-sm">
                  <Globe className="w-4 h-4 text-slate-400" />
                  {source}
                </div>
              </div>
            </div>

            {lead && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-border flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-border">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Created On</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                    {formatDate(lead.createdAt)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="w-full">
                See Leads List
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5 relative z-10">
            <Input
              label="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
            />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white shadow-sm focus:outline-none focus:ring-0 focus:border-black dark:focus:border-white transition-all font-sans cursor-pointer"
              >
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="New">New</option>
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Contacted">Contacted</option>
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Qualified">Qualified</option>
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Lost">Lost</option>
              </select>
              {fieldErrors.status && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.status}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white shadow-sm focus:outline-none focus:ring-0 focus:border-black dark:focus:border-white transition-all font-sans cursor-pointer"
              >
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Website">Website</option>
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Instagram">Instagram</option>
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Google">Google</option>
                <option className="bg-white dark:bg-zinc-900 text-black dark:text-white" value="Referral">Referral</option>
              </select>
              {fieldErrors.source && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.source}</p>}
            </div>

            <div className="flex justify-between gap-3 pt-6">
              <Button type="button" variant="ghost" onClick={onClose} className="px-6">
                See Leads List
              </Button>
              <Button type="submit" isLoading={isLoading} className="flex-1">
                {mode === 'edit' ? 'Save Changes' : 'Create Lead'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

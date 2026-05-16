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
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">
            {mode === 'view' ? 'Lead Details' : mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'view' ? (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 dark:bg-[#121214] p-5 rounded-xl border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white font-space-grotesk">{name}</h4>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                    <a href={`mailto:${email}`} className="text-sm hover:text-primary-600 transition-colors">{email}</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                Close Details
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
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
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              >
                <option value="Website">Website</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
              </select>
              {fieldErrors.source && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.source}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {mode === 'edit' ? 'Save Changes' : 'Create Lead'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

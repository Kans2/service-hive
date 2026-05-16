import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { ApiResponse, User } from '../types';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'sales'>('sales');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', {
        name,
        email,
        password,
        role,
      });

      if (data.data) {
        login(data.data.token, data.data.user);
        toast.success('Registration successful!');
        navigate('/');
      }
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full bento-card p-10 relative overflow-hidden group">
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-accent-blue/20 rounded-full blur-[40px] group-hover:bg-accent-blue/30 transition-all duration-500"></div>
        <div className="text-center mb-10 relative z-10">
          <h2 className="text-4xl font-space-grotesk font-bold text-slate-900 dark:text-white tracking-tight">Create Account</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-outfit">Join the SmartLeads platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          
          <div className="space-y-1.5 relative z-10">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-outfit">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'sales')}
              className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black dark:text-white font-outfit appearance-none"
            >
              <option value="sales">Sales User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Button type="submit" className="w-full mt-4 h-12 text-base relative z-10" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400 relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-accent-blue transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

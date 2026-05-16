import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { ApiResponse, User } from '../types';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
        email,
        password,
      });

      if (data.data) {
        login(data.data.token, data.data.user);
        toast.success('Logged in successfully!');
        navigate('/');
      }
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bento-card p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary-500/20 rounded-full blur-[40px] group-hover:bg-primary-500/30 transition-all duration-500"></div>
        <div className="text-center mb-10 relative z-10">
          <h2 className="text-4xl font-space-grotesk font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-outfit">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" className="w-full mt-2 h-12 text-base" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400 relative z-10">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-accent-blue transition-colors">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

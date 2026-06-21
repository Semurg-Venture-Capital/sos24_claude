'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SosMark } from '@/components/SosMark';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { phone });
      setStep('otp');
    } catch {
      setError('Не удалось отправить код. Проверьте номер.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; role: string }>('/auth/admin/login', { phone, code: otp });
      if (data.role !== 'ADMIN' && data.role !== 'SUPPORT') {
        setError('Этот аккаунт не имеет доступа к панели.');
        return;
      }
      localStorage.setItem('sos24_admin_token', data.accessToken);
      localStorage.setItem('sos24_admin_role', data.role);
      // Операторы поддержки попадают сразу в чаты.
      router.push(data.role === 'SUPPORT' ? '/support' : '/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg === 'Not an admin account' ? 'Аккаунт не является администратором.' : 'Неверный код.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <SosMark size={30} />
          <span className="text-xl font-semibold text-[#151515] tracking-tight">SOS24 Admin</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] p-8">
          {step === 'phone' ? (
            <>
              <h1 className="text-lg font-semibold text-[#151515] mb-1">Вход в систему</h1>
              <p className="text-sm text-[#9a9a9a] mb-6">Введите номер телефона администратора</p>
              <form onSubmit={handlePhone} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#5f5e5e]">Телефон</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123-45-67"
                    className="h-10 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm text-[#151515] placeholder:text-[#c0c0c0] outline-none focus:border-[#e61428] transition-colors"
                    required
                  />
                </div>
                {error && <p className="text-xs text-[#e61428] bg-[rgba(230,20,40,0.06)] rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="h-10 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-60 cursor-pointer" style={{ background: '#e61428' }}>
                  {loading ? 'Отправляем...' : 'Получить код'}
                </button>
              </form>
              {process.env.NODE_ENV !== 'production' && (
                <p className="text-xs text-[#c0c0c0] text-center mt-5">Dev: +998993286330 / 6330</p>
              )}
            </>
          ) : (
            <>
              <button onClick={() => { setStep('phone'); setError(''); }} className="flex items-center gap-1.5 text-xs text-[#9a9a9a] hover:text-[#5f5e5e] mb-4 transition-colors">
                ← Назад
              </button>
              <h1 className="text-lg font-semibold text-[#151515] mb-1">Введите код</h1>
              <p className="text-sm text-[#9a9a9a] mb-6">Код отправлен на <span className="text-[#151515] font-medium">{phone}</span></p>
              <form onSubmit={handleOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#5f5e5e]">OTP-код</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Код из SMS"
                    maxLength={6}
                    className="h-10 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm text-[#151515] placeholder:text-[#c0c0c0] outline-none focus:border-[#e61428] transition-colors tracking-widest text-center font-mono"
                    required
                  />
                </div>
                {error && <p className="text-xs text-[#e61428] bg-[rgba(230,20,40,0.06)] rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="h-10 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-60 cursor-pointer" style={{ background: '#e61428' }}>
                  {loading ? 'Проверяем...' : 'Войти'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
      const { data } = await api.post<{ accessToken: string; role: string; kind: 'INSURER' | 'SERVICE' | null }>(
        '/auth/partner/login',
        { phone, code: otp },
      );
      localStorage.setItem('sos24_partner_token', data.accessToken);
      localStorage.setItem('sos24_partner_role', data.role);
      if (data.kind) localStorage.setItem('sos24_partner_kind', data.kind);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg === 'Not a partner account') setError('Этот аккаунт не является партнёром.');
      else if (msg?.includes('not linked')) setError('Аккаунт не привязан к компании или точке. Обратитесь к администратору.');
      else setError('Неверный код.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <SosMark size={30} />
          <span className="text-xl font-semibold text-[#151515] tracking-tight">SOS24 Partner</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] p-8">
          {step === 'phone' ? (
            <>
              <h1 className="text-lg font-semibold text-[#151515] mb-1">Вход в кабинет</h1>
              <p className="text-sm text-[#9a9a9a] mb-6">Введите номер телефона партнёра</p>
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

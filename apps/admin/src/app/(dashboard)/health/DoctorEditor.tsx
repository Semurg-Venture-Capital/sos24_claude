'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { healthApi, useClinics, useInvalidateHealth, type DoctorAdmin, type DoctorInput } from '@/lib/health';

const num = (s: string): number | undefined => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
};

export function DoctorEditor({ doctor, onClose }: { doctor: DoctorAdmin | null; onClose: () => void }) {
  const isNew = doctor == null;
  const { data: clinics = [] } = useClinics();
  const invalidate = useInvalidateHealth();

  const [fullName, setFullName] = useState(doctor?.fullName ?? '');
  const [specialty, setSpecialty] = useState(doctor?.specialty ?? '');
  const [phone, setPhone] = useState(doctor?.phone ?? '');
  const [bookingEnabled, setBookingEnabled] = useState(doctor?.bookingEnabled ?? false);
  const [partnerId, setPartnerId] = useState(doctor?.partnerId ?? '');
  const [clinicName, setClinicName] = useState(doctor?.partnerId ? '' : (doctor?.clinicName ?? ''));
  const [city, setCity] = useState(doctor?.city ?? '');
  const [experienceY, setExperienceY] = useState(doctor?.experienceY?.toString() ?? '');
  const [bio, setBio] = useState(doctor?.bio ?? '');
  const [pricePrimary, setPricePrimary] = useState(doctor?.pricePrimary?.toString() ?? '');
  const [priceRepeat, setPriceRepeat] = useState(doctor?.priceRepeat?.toString() ?? '');
  const [verified, setVerified] = useState(doctor?.verified ?? true);
  const [active, setActive] = useState(doctor?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!fullName.trim() || !specialty.trim()) {
      setError('Укажите ФИО и специальность');
      return;
    }
    if (!bookingEnabled && !phone.trim()) {
      setError('Для режима «Позвонить» укажите телефон');
      return;
    }
    setSaving(true);
    setError('');
    const data: DoctorInput = {
      fullName: fullName.trim(),
      specialty: specialty.trim(),
      phone: phone.trim() || undefined,
      bookingEnabled,
      partnerId: partnerId || null,
      clinicName: clinicName.trim() || undefined,
      city: city.trim() || undefined,
      experienceY: num(experienceY),
      bio: bio.trim() || undefined,
      pricePrimary: num(pricePrimary),
      priceRepeat: num(priceRepeat),
      verified,
      active,
    };
    try {
      if (isNew) await healthApi.createDoctor(data);
      else await healthApi.updateDoctor(doctor!.id, data);
      invalidate();
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full h-10 px-3 rounded-xl bg-white border border-[rgba(20,20,40,0.1)] text-sm outline-none focus:border-[rgba(20,20,40,0.3)]';
  const label = 'text-xs font-medium text-[#5f5e5e] mb-1 block';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-[rgba(20,20,40,0.06)] sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-[#151515]">{isNew ? 'Новый врач' : 'Изменить врача'}</h2>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#151515] p-1"><X size={18} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <span className={label}>ФИО *</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Дилшод Рахимов" className={field} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <span className={label}>Специальность *</span>
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="ЛОР" className={field} />
            </div>
            <div className="w-28">
              <span className={label}>Стаж, лет</span>
              <input value={experienceY} onChange={(e) => setExperienceY(e.target.value)} inputMode="numeric" placeholder="12" className={field} />
            </div>
          </div>
          {/* Режим взаимодействия */}
          <div>
            <span className={label}>Режим</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setBookingEnabled(false)} className={`flex-1 h-10 rounded-xl border text-sm ${!bookingEnabled ? 'bg-[#151515] text-white border-[#151515]' : 'bg-white text-[#5f5e5e] border-[rgba(20,20,40,0.1)]'}`}>Позвонить</button>
              <button type="button" onClick={() => setBookingEnabled(true)} className={`flex-1 h-10 rounded-xl border text-sm ${bookingEnabled ? 'bg-[#151515] text-white border-[#151515]' : 'bg-white text-[#5f5e5e] border-[rgba(20,20,40,0.1)]'}`}>Запись</button>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <span className={label}>Телефон{!bookingEnabled ? ' *' : ''}</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 234-56-78" className={field} />
            </div>
            <div className="w-40">
              <span className={label}>Город</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ташкент" className={field} />
            </div>
          </div>
          <div>
            <span className={label}>Клиника (партнёр)</span>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={field}>
              <option value="">Без клиники (частный)</option>
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {!partnerId ? (
            <div>
              <span className={label}>Место работы (если без клиники-партнёра)</span>
              <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Клиника «…» / кабинет" className={field} />
            </div>
          ) : null}
          <div className="flex gap-3">
            <div className="flex-1">
              <span className={label}>Первичный приём, сум</span>
              <input value={pricePrimary} onChange={(e) => setPricePrimary(e.target.value)} inputMode="numeric" placeholder="180000" className={field} />
            </div>
            <div className="flex-1">
              <span className={label}>Повторный приём, сум</span>
              <input value={priceRepeat} onChange={(e) => setPriceRepeat(e.target.value)} inputMode="numeric" placeholder="120000" className={field} />
            </div>
          </div>
          <div>
            <span className={label}>О враче</span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Кандидат медицинских наук…" className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(20,20,40,0.1)] text-sm outline-none resize-none focus:border-[rgba(20,20,40,0.3)]" />
          </div>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 text-sm text-[#151515] cursor-pointer">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="accent-[#e61428]" /> Партнёр SOS24 (verified)
            </label>
            <label className="flex items-center gap-2 text-sm text-[#151515] cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-[#e61428]" /> Активен
            </label>
          </div>

          {error && <p className="text-sm text-[#e61428]">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[rgba(20,20,40,0.06)] sticky bottom-0 bg-white">
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm text-[#5f5e5e] hover:bg-[#f0f0f2]">Отмена</button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-xl bg-[#e61428] text-white text-sm hover:bg-[#c01020] disabled:opacity-50">
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

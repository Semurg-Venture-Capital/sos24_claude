'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

type AdjusterStatus = 'NEW' | 'ACCEPTED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED';
type IncidentType = 'ACCIDENT' | 'DAMAGE' | 'THEFT';

const INCIDENT_LABELS: Record<IncidentType, string> = {
  ACCIDENT: 'ДТП', DAMAGE: 'Повреждение', THEFT: 'Угон',
};
const STATUS_LABELS: Record<AdjusterStatus, string> = {
  NEW: 'Новая', ACCEPTED: 'Принята', EN_ROUTE: 'В пути', COMPLETED: 'Завершена', CANCELLED: 'Отменена',
};

const DOT_COLORS: Partial<Record<AdjusterStatus, string>> = {
  NEW: '#568cff',
  ACCEPTED: '#f5c850',
  EN_ROUTE: '#e61428',
};

interface AdjusterItem {
  id: string;
  status: AdjusterStatus;
  incidentType: IncidentType;
  address: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  user: { name: string | null; surname: string | null; phone: string | null };
}

function makeIcon(color: string) {
  return L.divIcon({
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

interface Props {
  items: AdjusterItem[];
  onSelect: (item: AdjusterItem) => void;
}

export default function MapView({ items, onSelect }: Props) {
  const withCoords = items.filter((i) => i.lat != null && i.lng != null);
  const center: [number, number] = withCoords.length > 0
    ? [withCoords[0].lat!, withCoords[0].lng!]
    : [41.2995, 69.2401]; // Ташкент

  return (
    <div className="rounded-2xl overflow-hidden border border-[rgba(20,20,40,0.06)]" style={{ height: '520px' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((item) => {
          const color = DOT_COLORS[item.status] ?? '#9a9a9a';
          const fullName = [item.user?.surname, item.user?.name].filter(Boolean).join(' ') || '—';
          return (
            <Marker
              key={item.id}
              position={[item.lat!, item.lng!]}
              icon={makeIcon(color)}
            >
              <Popup>
                <div className="text-xs" style={{ minWidth: 160 }}>
                  <p className="font-semibold text-sm mb-1">{INCIDENT_LABELS[item.incidentType]}</p>
                  <p className="text-gray-500 mb-0.5">{fullName}</p>
                  <p className="text-gray-500 mb-1">{item.address}</p>
                  <p className="font-medium" style={{ color }}>
                    {STATUS_LABELS[item.status]}
                  </p>
                  <button
                    onClick={() => onSelect(item)}
                    className="mt-2 text-[#e61428] text-xs font-semibold hover:underline"
                  >
                    Открыть детали →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-[#9a9a9a] pointer-events-none">
          Нет заявок с координатами
        </div>
      )}
    </div>
  );
}

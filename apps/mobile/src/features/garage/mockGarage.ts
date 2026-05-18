// Mock-данные гаража. Расширим за счёт MOCK_CARS из purchase/store + поля
// из спецификации M3.2. На этапе D подключим /me/vehicles + NAPP-обогащение.

export interface MockVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  type: 'car' | 'suv' | 'truck' | 'motorcycle';
  engineCC: number;
  powerHP: number;
  hasActivePolicy: boolean;
  activePolicyType?: 'ОСАГО' | 'КАСКО';
}

export const MOCK_VEHICLES: MockVehicle[] = [
  {
    id: 'c1',
    plate: '01 A 123 BB',
    brand: 'Chevrolet',
    model: 'Cobalt',
    year: 2021,
    color: 'Белый',
    vin: 'KL1J2A0006M999812',
    type: 'car',
    engineCC: 1500,
    powerHP: 105,
    hasActivePolicy: true,
    activePolicyType: 'КАСКО',
  },
  {
    id: 'c2',
    plate: '10 R 555 AC',
    brand: 'Hyundai',
    model: 'Sonata',
    year: 2019,
    color: 'Чёрный',
    vin: 'KMHE34LBAFA117451',
    type: 'car',
    engineCC: 2000,
    powerHP: 150,
    hasActivePolicy: true,
    activePolicyType: 'ОСАГО',
  },
];

export const VEHICLE_TYPE_LABELS: Record<MockVehicle['type'], string> = {
  car: 'Легковой',
  suv: 'Внедорожник',
  truck: 'Грузовой',
  motorcycle: 'Мотоцикл',
};

export function getVehicleById(id: string): MockVehicle | undefined {
  return MOCK_VEHICLES.find((v) => v.id === id);
}

// Имитация запроса NAPP по гос. номеру — возвращает данные с задержкой.
export async function nappLookup(plate: string): Promise<Partial<MockVehicle> | null> {
  await new Promise((r) => setTimeout(r, 800));
  const normalized = plate.replace(/\s+/g, ' ').toUpperCase();
  if (normalized.startsWith('01 A')) {
    return {
      brand: 'Chevrolet',
      model: 'Cobalt',
      year: 2021,
      color: 'Белый',
      vin: 'KL1J2A0006M999812',
      type: 'car',
      engineCC: 1500,
      powerHP: 105,
    };
  }
  if (normalized.startsWith('10 R')) {
    return {
      brand: 'Hyundai',
      model: 'Sonata',
      year: 2019,
      color: 'Чёрный',
      vin: 'KMHE34LBAFA117451',
      type: 'car',
      engineCC: 2000,
      powerHP: 150,
    };
  }
  return null;
}

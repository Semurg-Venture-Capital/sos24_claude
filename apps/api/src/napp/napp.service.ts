import { Injectable } from '@nestjs/common';

// MOCK NAPP-сервис: пока государственная база авто не доступна (см. Q2.1 в QUESTIONS.md),
// возвращаем псевдо-данные deterministically по hash(plate). Когда NAPP подключим
// реально — заменим внутренности метода, контракт останется.

export interface NappVehicleData {
  plate: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  power: string;
  vin: string;
  color: string;
}

const POOL: Array<Omit<NappVehicleData, 'plate'>> = [
  { brand: 'Chevrolet', model: 'Cobalt', year: 2021, engine: '1.5 л', power: '105 л.с.', vin: 'KL1JF6862MB123456', color: 'белый' },
  { brand: 'Chevrolet', model: 'Lacetti', year: 2018, engine: '1.5 л', power: '109 л.с.', vin: 'KL1NF35Z18K456789', color: 'серебристый' },
  { brand: 'Chevrolet', model: 'Spark', year: 2019, engine: '1.0 л', power: '68 л.с.', vin: 'KL8MM5GA9JC789012', color: 'красный' },
  { brand: 'Chevrolet', model: 'Captiva', year: 2020, engine: '2.4 л', power: '167 л.с.', vin: 'KL3CD2DA2LB345678', color: 'чёрный' },
  { brand: 'Hyundai', model: 'Sonata', year: 2019, engine: '2.0 л', power: '150 л.с.', vin: 'KMHE241ABKA654321', color: 'графит' },
  { brand: 'Hyundai', model: 'Tucson', year: 2022, engine: '2.0 л', power: '155 л.с.', vin: 'KMHJ381AANU222333', color: 'серый' },
  { brand: 'Kia', model: 'K5', year: 2021, engine: '2.5 л', power: '180 л.с.', vin: 'KNALD4AJ7M5444555', color: 'синий' },
  { brand: 'Toyota', model: 'Camry', year: 2020, engine: '2.5 л', power: '181 л.с.', vin: 'JTNB11HK7L3666777', color: 'белый' },
];

function hashCode(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

@Injectable()
export class NappService {
  /**
   * Имитирует поиск авто в NAPP по гос. номеру.
   * Возвращает детерминированно одно из заготовленных авто.
   */
  lookupVehicle(plate: string): NappVehicleData {
    const normalized = plate.trim().toUpperCase();
    const idx = hashCode(normalized) % POOL.length;
    return { plate: normalized, ...POOL[idx] };
  }
}

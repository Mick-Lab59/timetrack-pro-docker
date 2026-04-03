import { 
  addDays, 
  isSameDay, 
  lastDayOfMonth, 
  getMonth, 
  getDate, 
  isSunday, 
  subDays 
} from 'date-fns'

export interface CalendarEvent {
  date: Date;
  label: string;
  type: 'holiday' | 'season' | 'dst' | 'feast';
}

function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getFrenchHolidays(year: number): CalendarEvent[] {
  const easter = getEaster(year);
  return [
    { date: new Date(year, 0, 1), label: "Jour de l'An", type: 'holiday' },
    { date: addDays(easter, 1), label: "Lundi de Pâques", type: 'holiday' },
    { date: new Date(year, 4, 1), label: "Fête du Travail", type: 'holiday' },
    { date: new Date(year, 4, 8), label: "Victoire 1945", type: 'holiday' },
    { date: addDays(easter, 39), label: "Ascension", type: 'holiday' },
    { date: addDays(easter, 50), label: "Lundi de Pentecôte", type: 'holiday' },
    { date: new Date(year, 6, 14), label: "Fête Nationale", type: 'holiday' },
    { date: new Date(year, 7, 15), label: "Assomption", type: 'holiday' },
    { date: new Date(year, 10, 1), label: "Toussaint", type: 'holiday' },
    { date: new Date(year, 10, 11), label: "Armistice 1918", type: 'holiday' },
    { date: new Date(year, 11, 25), label: "Noël", type: 'holiday' },
  ];
}

export function getSeason(date: Date): string | null {
  const m = getMonth(date) + 1;
  const d = getDate(date);
  if (m === 3 && d === 20) return "Printemps 🌷";
  if (m === 6 && d === 21) return "Été ☀️";
  if (m === 9 && d === 22) return "Automne 🍂";
  if (m === 12 && d === 21) return "Hiver ❄️";
  return null;
}

export function getDSTChange(date: Date): string | null {
  const m = getMonth(date) + 1;
  if (m === 3 || m === 10) {
    const lastDay = lastDayOfMonth(date);
    let lastSunday = lastDay;
    while (!isSunday(lastSunday)) lastSunday = subDays(lastSunday, 1);
    if (isSameDay(date, lastSunday)) return m === 3 ? "Heure d'été (+1h) 🕒" : "Heure d'hiver (-1h) 🕒";
  }
  return null;
}

export function getFeast(date: Date): string | null {
  const m = getMonth(date) + 1;
  const d = getDate(date);
  const feasts: Record<string, string> = {
    '1-1': 'Jour de l\'An', '2-2': 'Chandeleur', '14-2': 'St Valentin', '1-5': 'St Joseph', '21-6': 'Fête de la musique',
    '14-7': 'Fête Nationale', '31-10': 'Halloween', '11-11': 'St Martin', '6-12': 'St Nicolas', '24-12': 'Réveillon Noël', '31-12': 'Réveillon St Sylvestre',
  };
  return feasts[`${d}-${m}`] || null;
}

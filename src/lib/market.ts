// Simulated market data provider.
// Prices are deterministic functions of (symbol, time) so the server (authoritative
// fills) and the browser (display) always agree. To plug in a real provider later,
// replace `getQuote` / `getHistory` behind a server function — keep the same shapes.

export type Asset = {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  base: number; // reference price in INR
  vol: number; // relative volatility
  drift: number; // yearly drift
  volume: number; // avg daily volume
  about: string;
};

export const ASSETS: Asset[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", industry: "Oil & Gas Refining", base: 2920, vol: 1, drift: 0.12, volume: 6_200_000, about: "India's largest conglomerate spanning energy, petrochemicals, retail and digital services." },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "Technology", industry: "IT Services", base: 4110, vol: 0.8, drift: 0.1, volume: 2_100_000, about: "Global IT services, consulting and business solutions company." },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Financials", industry: "Private Banks", base: 1680, vol: 0.85, drift: 0.11, volume: 14_000_000, about: "One of India's largest private sector banks by assets." },
  { symbol: "INFY", name: "Infosys", sector: "Technology", industry: "IT Services", base: 1850, vol: 0.95, drift: 0.09, volume: 7_400_000, about: "Digital services and consulting company serving clients in 50+ countries." },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Financials", industry: "Private Banks", base: 1240, vol: 0.9, drift: 0.14, volume: 12_500_000, about: "Large private sector bank offering retail, corporate and treasury services." },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", industry: "Telecom Services", base: 1560, vol: 0.9, drift: 0.16, volume: 5_300_000, about: "Telecom operator with mobile, broadband and enterprise services across Asia and Africa." },
  { symbol: "ITC", name: "ITC Ltd", sector: "Consumer Staples", industry: "Tobacco & FMCG", base: 470, vol: 0.7, drift: 0.08, volume: 13_000_000, about: "Diversified company across FMCG, hotels, paperboards and agri-business." },
  { symbol: "SBIN", name: "State Bank of India", sector: "Financials", industry: "Public Banks", base: 820, vol: 1.1, drift: 0.12, volume: 16_000_000, about: "India's largest public sector bank." },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Industrials", industry: "Engineering & Construction", base: 3620, vol: 1, drift: 0.13, volume: 2_300_000, about: "Engineering, construction and technology conglomerate." },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "Consumer Staples", industry: "Personal & Household Products", base: 2480, vol: 0.6, drift: 0.06, volume: 1_800_000, about: "FMCG company with brands across home care, beauty and foods." },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Financials", industry: "Consumer Finance", base: 7150, vol: 1.3, drift: 0.12, volume: 1_400_000, about: "Non-bank lender focused on consumer, SME and commercial lending." },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Materials", industry: "Paints", base: 2850, vol: 0.85, drift: 0.05, volume: 1_200_000, about: "India's largest paint and coatings company." },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Consumer Discretionary", industry: "Automobiles", base: 12400, vol: 0.95, drift: 0.1, volume: 600_000, about: "India's largest passenger car manufacturer." },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Healthcare", industry: "Pharmaceuticals", base: 1720, vol: 0.9, drift: 0.13, volume: 3_100_000, about: "Specialty generics pharmaceutical company with global presence." },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer Discretionary", industry: "Jewellery & Watches", base: 3480, vol: 1, drift: 0.11, volume: 1_100_000, about: "Lifestyle company known for jewellery, watches and eyewear." },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Consumer Discretionary", industry: "Automobiles", base: 980, vol: 1.4, drift: 0.1, volume: 15_000_000, about: "Automaker spanning commercial vehicles, passenger cars, EVs and Jaguar Land Rover." },
  { symbol: "WIPRO", name: "Wipro", sector: "Technology", industry: "IT Services", base: 540, vol: 1, drift: 0.06, volume: 8_200_000, about: "IT, consulting and business process services company." },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", sector: "Industrials", industry: "Ports & Logistics", base: 1380, vol: 1.6, drift: 0.12, volume: 4_000_000, about: "India's largest private multi-port operator." },
  { symbol: "NTPC", name: "NTPC Ltd", sector: "Utilities", industry: "Power Generation", base: 365, vol: 0.9, drift: 0.12, volume: 18_000_000, about: "India's largest power generation utility." },
  { symbol: "POWERGRID", name: "Power Grid Corp", sector: "Utilities", industry: "Power Transmission", base: 320, vol: 0.7, drift: 0.09, volume: 11_000_000, about: "State-owned electric power transmission company." },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", sector: "Healthcare", industry: "Pharmaceuticals", base: 6200, vol: 0.9, drift: 0.08, volume: 500_000, about: "Pharmaceutical company making APIs, generics and biosimilars." },
  { symbol: "ETERNAL", name: "Eternal (Zomato)", sector: "Consumer Discretionary", industry: "Internet & Delivery", base: 245, vol: 1.8, drift: 0.2, volume: 40_000_000, about: "Food delivery and quick-commerce platform company." },
  { symbol: "NESTLEIND", name: "Nestlé India", sector: "Consumer Staples", industry: "Packaged Foods", base: 2450, vol: 0.55, drift: 0.07, volume: 900_000, about: "Packaged foods and beverages maker." },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: "Materials", industry: "Cement", base: 11300, vol: 0.9, drift: 0.1, volume: 400_000, about: "India's largest cement manufacturer." },
];

export const INDEX: Asset = {
  symbol: "QUEST50",
  name: "Quest 50 Index (simulated)",
  sector: "Index",
  industry: "Benchmark",
  base: 24500,
  vol: 0.6,
  drift: 0.11,
  volume: 0,
  about: "Simulated broad-market benchmark used for comparisons.",
};

const BY_SYMBOL = new Map([...ASSETS, INDEX].map((a) => [a.symbol, a]));
export const getAsset = (symbol: string) => BY_SYMBOL.get(symbol.toUpperCase());

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const EPOCH = Date.UTC(2026, 0, 1);
const PERIODS_MIN = [17, 190, 2880, 15840, 67680, 263000];
const AMPS = [0.0025, 0.006, 0.018, 0.035, 0.06, 0.08];

export function priceAt(symbol: string, t: number): number {
  const a = getAsset(symbol);
  if (!a) return 0;
  const minutes = (t - EPOCH) / 60000;
  const days = minutes / 1440;
  let x = a.drift * (days / 365);
  for (let i = 0; i < PERIODS_MIN.length; i++) {
    const phase = hash(a.symbol + i) * Math.PI * 2;
    x += AMPS[i] * a.vol * Math.sin((2 * Math.PI * minutes) / PERIODS_MIN[i] + phase);
  }
  x += (hash(a.symbol + Math.floor(minutes)) - 0.5) * 0.002 * a.vol;
  const p = a.base * Math.exp(x);
  return Math.round(p * 100) / 100;
}

export type Quote = {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
};

export function getQuote(symbol: string, now = Date.now()): Quote {
  const a = getAsset(symbol)!;
  const price = priceAt(symbol, now);
  const dayStart = now - ((now + 5.5 * 3600000) % 86400000); // IST midnight
  const prevClose = priceAt(symbol, dayStart - 60000);
  let hi = price;
  let lo = price;
  for (let t = dayStart; t < now; t += 15 * 60000) {
    const p = priceAt(symbol, t);
    hi = Math.max(hi, p);
    lo = Math.min(lo, p);
  }
  const frac = (now - dayStart) / 86400000;
  const volume = Math.round(a.volume * frac * (0.8 + hash(a.symbol + Math.floor(now / 86400000)) * 0.5));
  const change = price - prevClose;
  return { symbol: a.symbol, price, prevClose, change, changePct: (change / prevClose) * 100, dayHigh: hi, dayLow: lo, volume };
}

export const RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as const;
export type Range = (typeof RANGES)[number];
export const RANGE_MS: Record<Range, number> = {
  "1D": 86400000,
  "1W": 7 * 86400000,
  "1M": 30 * 86400000,
  "3M": 91 * 86400000,
  "6M": 182 * 86400000,
  "1Y": 365 * 86400000,
  ALL: 3 * 365 * 86400000,
};

export function getHistory(symbol: string, range: Range, now = Date.now(), points = 120) {
  const span = RANGE_MS[range];
  const step = span / points;
  const out: { t: number; price: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const t = now - span + i * step;
    out.push({ t, price: priceAt(symbol, t) });
  }
  return out;
}

export function searchAssets(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return ASSETS;
  return ASSETS.filter((a) =>
    [a.symbol, a.name, a.sector, a.industry].some((f) => f.toLowerCase().includes(s)),
  );
}

export const SECTORS = Array.from(new Set(ASSETS.map((a) => a.sector))).sort();

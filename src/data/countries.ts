/*
  Países para o seletor do WhatsApp: código ISO de 2 letras e código de discagem.
  Os nomes vêm do navegador (Intl.DisplayNames) no idioma da página.
*/

export const dialCodes: Record<string, string> = {
  AD: '376', AE: '971', AF: '93', AG: '1', AI: '1', AL: '355', AM: '374', AO: '244', AR: '54', AS: '1', AT: '43',
  AU: '61', AW: '297', AX: '358', AZ: '994', BA: '387', BB: '1', BD: '880', BE: '32', BF: '226', BG: '359', BH: '973',
  BI: '257', BJ: '229', BL: '590', BM: '1', BN: '673', BO: '591', BQ: '599', BR: '55', BS: '1', BT: '975', BW: '267',
  BY: '375', BZ: '501', CA: '1', CD: '243', CF: '236', CG: '242', CH: '41', CI: '225', CK: '682', CL: '56', CM: '237',
  CN: '86', CO: '57', CR: '506', CU: '53', CV: '238', CW: '599', CY: '357', CZ: '420', DE: '49', DJ: '253', DK: '45',
  DM: '1', DO: '1', DZ: '213', EC: '593', EE: '372', EG: '20', EH: '212', ER: '291', ES: '34', ET: '251', FI: '358',
  FJ: '679', FK: '500', FM: '691', FO: '298', FR: '33', GA: '241', GB: '44', GD: '1', GE: '995', GF: '594', GG: '44',
  GH: '233', GI: '350', GL: '299', GM: '220', GN: '224', GP: '590', GQ: '240', GR: '30', GT: '502', GU: '1', GW: '245',
  GY: '592', HK: '852', HN: '504', HR: '385', HT: '509', HU: '36', ID: '62', IE: '353', IL: '972', IM: '44', IN: '91',
  IQ: '964', IR: '98', IS: '354', IT: '39', JE: '44', JM: '1', JO: '962', JP: '81', KE: '254', KG: '996', KH: '855',
  KI: '686', KM: '269', KN: '1', KP: '850', KR: '82', KW: '965', KY: '1', KZ: '7', LA: '856', LB: '961', LC: '1',
  LI: '423', LK: '94', LR: '231', LS: '266', LT: '370', LU: '352', LV: '371', LY: '218', MA: '212', MC: '377', MD: '373',
  ME: '382', MF: '590', MG: '261', MH: '692', MK: '389', ML: '223', MM: '95', MN: '976', MO: '853', MP: '1', MQ: '596',
  MR: '222', MS: '1', MT: '356', MU: '230', MV: '960', MW: '265', MX: '52', MY: '60', MZ: '258', NA: '264', NC: '687',
  NE: '227', NG: '234', NI: '505', NL: '31', NO: '47', NP: '977', NR: '674', NU: '683', NZ: '64', OM: '968', PA: '507',
  PE: '51', PF: '689', PG: '675', PH: '63', PK: '92', PL: '48', PM: '508', PR: '1', PS: '970', PT: '351', PW: '680',
  PY: '595', QA: '974', RE: '262', RO: '40', RS: '381', RU: '7', RW: '250', SA: '966', SB: '677', SC: '248', SD: '249',
  SE: '46', SG: '65', SH: '290', SI: '386', SK: '421', SL: '232', SM: '378', SN: '221', SO: '252', SR: '597', SS: '211',
  ST: '239', SV: '503', SX: '1', SY: '963', SZ: '268', TC: '1', TD: '235', TG: '228', TH: '66', TJ: '992', TK: '690',
  TL: '670', TM: '993', TN: '216', TO: '676', TR: '90', TT: '1', TV: '688', TW: '886', TZ: '255', UA: '380', UG: '256',
  US: '1', UY: '598', UZ: '998', VA: '39', VC: '1', VE: '58', VG: '1', VI: '1', VN: '84', VU: '678', WF: '681', WS: '685',
  XK: '383', YE: '967', YT: '262', ZA: '27', ZM: '260', ZW: '263',
};

/** Tamanho do número nacional (sem o código do país), para os países mais comuns. Outros: 6 a 14 dígitos. */
const lengths: Record<string, [number, number, RegExp?]> = {
  PT: [9, 9, /^[29]/],
  BR: [10, 11],
  ES: [9, 9, /^[6-9]/],
  US: [10, 10],
  CA: [10, 10],
  GB: [10, 10],
  FR: [9, 9],
  IT: [9, 11],
  DE: [7, 12],
  CH: [9, 9],
  NL: [9, 9],
  BE: [8, 9],
  IE: [7, 9],
  LU: [6, 11],
  AO: [9, 9],
  MZ: [8, 9],
  CV: [7, 7],
  MX: [10, 10],
  AR: [10, 11],
  CL: [9, 9],
  CO: [10, 10],
  PE: [9, 9],
  UY: [8, 8],
  AE: [8, 9],
  AU: [9, 9],
};

/** Países que usam o euro (moeda padrão do faturamento). */
export const euroCountries = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
  'AD', 'MC', 'SM', 'VA', 'ME', 'XK',
]);

export function currencyFor(country: string): 'EUR' | 'USD' | 'BRL' {
  if (country === 'BR') return 'BRL';
  if (euroCountries.has(country)) return 'EUR';
  return 'USD';
}

/** Normaliza e valida um número. Devolve o formato internacional (+351912345678) ou null. */
export function normalizePhone(country: string, raw: string): string | null {
  const dial = dialCodes[country];
  if (!dial) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
    if (!digits.startsWith(dial)) return null;
    digits = digits.slice(dial.length);
  }
  digits = digits.replace(/\D/g, '');
  // Prefixo nacional (0) antes do número, comum no Reino Unido, Alemanha, França...
  if (country !== 'IT' && digits.startsWith('0')) digits = digits.slice(1);
  const [min, max, start] = lengths[country] ?? [6, 14];
  if (digits.length < min || digits.length > max) return null;
  if (start && !start.test(digits)) return null;
  return `+${dial}${digits}`;
}

/** Bandeira a partir do código ISO (símbolos regionais do Unicode). */
export function flag(country: string): string {
  return country.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/** Türkçe haber metni için token/phrase tabanlı eşleştirme — substring false positive önleme. */

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[''`]/g, "'").trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .replace(/[.,'"`?!:;()\-–—/\\]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function containsToken(text: string, token: string): boolean {
  const needle = normalizeText(token);
  return tokenize(text).some((word) => word === needle || word.startsWith(`${needle}'`));
}

export function containsPhrase(text: string, phrase: string): boolean {
  return normalizeText(text).includes(normalizeText(phrase));
}

const WIN_VERB_TOKENS = new Set([
  'kazandı',
  'kazanan',
  'kazanmak',
  'kazanıyor',
  'kazancını',
  'kazanç',
  'kazanıldı',
  'kazanır',
  'kazanacak',
  'kazanması',
]);

export function isWinVerbToken(token: string): boolean {
  return WIN_VERB_TOKENS.has(normalizeText(token));
}

/** Trafik/uçak kazası vb. — `kazandı` gibi başarı fiilleri hariç. */
export function containsAccidentSignal(text: string): boolean {
  const tokens = tokenize(text);
  const accidentWordTokens = ['kaza', 'kazası', 'kazada', 'kazadan', 'kazasına'];
  if (tokens.some((tok) => accidentWordTokens.includes(tok))) {
    return true;
  }

  const accidentPhrases = [
    'trafik kazası',
    'trafik kazas',
    'kaza yaptı',
    'kaza sonucu',
    'uçak kaz',
    'helikopter kaz',
    'tren kaz',
  ];
  return accidentPhrases.some((phrase) => containsPhrase(text, phrase));
}

export function containsSportContext(text: string): boolean {
  const normalized = normalizeText(text);

  const sportPhrases = ['formula 1', 'formül 1', 'grand prix', 'f1 '];
  if (sportPhrases.some((p) => normalized.includes(p))) {
    return true;
  }

  const sportTokens = [
    'futbol',
    'basketbol',
    'yarış',
    'yarışı',
    'pilot',
    'etap',
    'şampiyona',
    'maç',
    'maçı',
    'gol',
    'transfer',
    'lig',
    'müsabaka',
    'voleybol',
    'tenis',
    'ralli',
  ];
  if (sportTokens.some((t) => containsToken(text, t))) {
    return true;
  }

  return tokensIncludeWinVerb(text) && sportTokens.some((t) => containsToken(text, t));
}

function tokensIncludeWinVerb(text: string): boolean {
  return tokenize(text).some(isWinVerbToken);
}

export function containsEarthquakeSignal(text: string): boolean {
  return (
    containsToken(text, 'deprem') ||
    containsToken(text, 'sarsıntı') ||
    containsPhrase(text, 'deprem meydana')
  );
}

export function containsHarmCasualtyToken(text: string): boolean {
  const harmTokens = ['öldü', 'ölü', 'ölüm', 'yaralı', 'yaralandı', 'vefat', 'hayatını'];
  if (harmTokens.some((t) => containsToken(text, t))) {
    return true;
  }
  return containsPhrase(text, 'can kaybı') || containsPhrase(text, 'can kaybi');
}

/** Gerçek afet/ kaza sinyali — spor bağlamında yalnızca ağır zarar varsa. */
export function containsDisasterAlertSignal(text: string): boolean {
  const sport = containsSportContext(text);
  const undeniable =
    containsEarthquakeSignal(text) ||
    containsToken(text, 'yangın') ||
    containsToken(text, 'sel') ||
    containsToken(text, 'afet') ||
    containsToken(text, 'patlama') ||
    containsToken(text, 'tahliye') ||
    containsAccidentSignal(text) ||
    containsHarmCasualtyToken(text);

  if (sport && !undeniable) {
    return false;
  }
  if (sport && undeniable && !containsEarthquakeSignal(text) && !containsAccidentSignal(text) && !containsHarmCasualtyToken(text)) {
    return false;
  }

  return undeniable;
}

/** Kritik afet şiddeti — `Büyük Britanyalı` veya `büyüklüğünde` içindeki `ölü` false positive değil. */
export function containsCriticalDisasterSeverity(text: string): boolean {
  if (containsHarmCasualtyToken(text)) {
    return true;
  }

  if (containsEarthquakeSignal(text) && /\d+[,.]?\d*\s*büyüklüğünde/i.test(text)) {
    return true;
  }

  const hasDisasterType =
    containsEarthquakeSignal(text) ||
    containsToken(text, 'sel') ||
    containsToken(text, 'yangın') ||
    containsAccidentSignal(text);

  if (containsToken(text, 'şiddetli') && hasDisasterType) {
    return true;
  }

  if (containsToken(text, 'büyük') && hasDisasterType) {
    return true;
  }

  return false;
}

/** Çevre sinyali — `Balıkesir` içindeki `balık` substring eşleşmesi yok. */
export function containsEnvironmentSignal(text: string): boolean {
  if (
    containsToken(text, 'çevre') ||
    containsToken(text, 'kirlilik') ||
    containsToken(text, 'atık') ||
    containsToken(text, 'zehirlenme') ||
    containsToken(text, 'balık') ||
    containsToken(text, 'balıkçı')
  ) {
    return true;
  }

  if (containsPhrase(text, 'deniz kirlili') || containsToken(text, 'denizde')) {
    return true;
  }

  return containsToken(text, 'dere');
}

export function containsHumanitarianSignal(text: string): boolean {
  return (
    containsPhrase(text, 'insani yardım') ||
    containsPhrase(text, 'arama kurtarma') ||
    (containsToken(text, 'yardım') && containsToken(text, 'ekip'))
  );
}

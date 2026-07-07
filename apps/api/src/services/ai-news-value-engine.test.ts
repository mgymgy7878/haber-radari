import { describe, it, expect } from 'vitest';
import { AiNewsValueEngine, AiNewsValueDecision, NewsValueInput } from './ai-news-value-engine';

describe('AiNewsValueEngine', () => {
  it('should block DISABLED and NEEDS_REVIEW legal modes', () => {
    const input: NewsValueInput = {
      title: 'Very important news',
      sourceName: 'Some Source',
      category: 'Afet',
      legalMode: 'DISABLED',
      authorityTier: 'STANDARD'
    };
    const result = AiNewsValueEngine.evaluate(input);
    expect(result.decision).toBe(AiNewsValueDecision.HIDE_LEGAL_BLOCKED);
    expect(result.reasonCode).toBe('LEGAL_BLOCKED_DISABLED');
  });

  it('should block unlicensed agencies', () => {
    const input: NewsValueInput = {
      title: 'Standard news',
      sourceName: 'DHA',
      category: 'Genel',
      legalMode: 'ENABLED',
      authorityTier: 'STANDARD',
      hasLicensedContent: false
    };
    const result = AiNewsValueEngine.evaluate(input);
    expect(result.decision).toBe(AiNewsValueDecision.HIDE_LEGAL_BLOCKED);
    expect(result.reasonCode).toBe('LEGAL_BLOCKED_UNLICENSED_AGENCY');
  });

  it('should allow licensed agencies to be scored', () => {
    const input: NewsValueInput = {
      title: 'Standard news',
      sourceName: 'DHA',
      category: 'Genel',
      legalMode: 'ENABLED',
      authorityTier: 'STANDARD',
      hasLicensedContent: true
    };
    const result = AiNewsValueEngine.evaluate(input);
    expect(result.decision).not.toBe(AiNewsValueDecision.HIDE_LEGAL_BLOCKED);
  });

  it('should override personal interest and noise limits for global critical news', () => {
    const input: NewsValueInput = {
      title: 'AFAD Son Dakika Deprem M5.5',
      sourceName: 'AFAD',
      category: 'Afet',
      legalMode: 'ENABLED',
      authorityTier: 'OFFICIAL_PUBLIC_SOURCE'
    };
    const result = AiNewsValueEngine.evaluate(input);
    // AFAD (40) + Afet (40) + Keyword "Deprem M>=5" (20) = 100
    expect(result.newsValueScore).toBeGreaterThanOrEqual(85);
    expect(result.decision).toBe(AiNewsValueDecision.SHOW_MAIN);
    expect(result.reasonCode).toBe('SHOW_MAIN_GLOBAL_CRITICAL');
  });

  it('should hide clickbait despite normal news value', () => {
    const input: NewsValueInput = {
      title: 'Teknoloji devinin sırrı görenleri şaşırtıyor',
      sourceName: 'Tech Blog',
      category: 'Teknoloji', // +20
      legalMode: 'ENABLED',
      authorityTier: 'STANDARD'
    };
    const result = AiNewsValueEngine.evaluate(input);
    // Noise keyword "görenleri şaşırt" adds 40
    expect(result.noiseScore).toBe(40);
    expect(result.decision).toBe(AiNewsValueDecision.HIDE_LOW_VALUE); // wait, it's 40, not >50
  });

  it('should hide heavy clickbait', () => {
    const input: NewsValueInput = {
      title: 'Bunu görenleri şaşırttı mi oldu?',
      sourceName: 'Tech Blog',
      category: 'Teknoloji', 
      legalMode: 'ENABLED',
      authorityTier: 'STANDARD'
    };
    const result = AiNewsValueEngine.evaluate(input);
    expect(result.noiseScore).toBeGreaterThan(50);
    expect(result.decision).toBe(AiNewsValueDecision.HIDE_CLICKBAIT);
  });

  it('should elevate news via personalPriorityBoost', () => {
    const input: NewsValueInput = {
      title: 'Yeni model tanıtıldı',
      sourceName: 'Tech Source',
      category: 'Teknoloji', // +20
      legalMode: 'ENABLED',
      authorityTier: 'REPUTABLE', // +20
      personalPriorityBoost: 30 // user really likes tech
    };
    const result = AiNewsValueEngine.evaluate(input);
    // Base news value: 40. Boost: 30. Personalized: 70.
    // 70 falls in 40-74 range -> SHOW_MONITORING
    expect(result.personalizedScore).toBe(70);
    expect(result.decision).toBe(AiNewsValueDecision.SHOW_MONITORING);
  });

  it('should elevate news to SHOW_MAIN with personalPriorityBoost', () => {
    const input: NewsValueInput = {
      title: 'Faiz kararı açıklandı',
      sourceName: 'Tech Source',
      category: 'Ekonomi', // +30
      legalMode: 'ENABLED',
      authorityTier: 'REPUTABLE', // +20
      personalPriorityBoost: 30 // user really likes economy
    };
    // keywords: "kararı", "açıklandı", "faiz" = 20 max
    // total base: 30 + 20 + 20 = 70.
    // personalized: 70 + 30 = 100 (cap)
    const result = AiNewsValueEngine.evaluate(input);
    expect(result.personalizedScore).toBeGreaterThanOrEqual(75);
    expect(result.decision).toBe(AiNewsValueDecision.SHOW_MAIN);
    expect(result.reasonCode).toBe('SHOW_MAIN_PERSONALIZED');
  });

  it('should exempt OFFICIAL_PUBLIC_SOURCE from noise limits if newsValueScore is high', () => {
    const input: NewsValueInput = {
      title: 'TCMB faiz kararı açıklandı şoke eden mi oldu?', // weird clickbaity title
      sourceName: 'TCMB',
      category: 'Ekonomi',
      legalMode: 'ENABLED',
      authorityTier: 'OFFICIAL_PUBLIC_SOURCE'
    };
    // Official (40) + Ekonomi (30) + keywords (20) = 90
    // Noise > 50 (mi oldu? + şoke eden = 90)
    const result = AiNewsValueEngine.evaluate(input);
    expect(result.noiseScore).toBeGreaterThan(50);
    expect(result.decision).toBe(AiNewsValueDecision.SHOW_MAIN);
    expect(result.reasonCode).toBe('SHOW_MAIN_OFFICIAL_OVERRIDE'); // since 90 >= 85 and official override
  });

  it('should not exempt OFFICIAL_PUBLIC_SOURCE if news value is low and noise is high', () => {
    const input: NewsValueInput = {
      title: 'Deprem mi oldu?',
      sourceName: 'Some Official Org',
      category: 'Genel',
      legalMode: 'ENABLED',
      authorityTier: 'OFFICIAL_PUBLIC_SOURCE'
    };
    // Official (40) + Genel (0) + mi oldu? (+50 noise)
    const result = AiNewsValueEngine.evaluate(input);
    expect(result.noiseScore).toBe(50); 
    // noise is exactly 50, not >50
    // newsValue is 40 -> SHOW_MONITORING
    expect(result.decision).toBe(AiNewsValueDecision.SHOW_MONITORING);
  });
});

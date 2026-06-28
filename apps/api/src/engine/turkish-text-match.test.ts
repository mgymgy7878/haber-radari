import { describe, it, expect } from 'vitest';
import {
  containsAccidentSignal,
  containsCriticalDisasterSeverity,
  containsDisasterAlertSignal,
  containsEnvironmentSignal,
  containsSportContext,
  isWinVerbToken,
} from './turkish-text-match.js';
import { resolveFeedCategory } from './feed-category.js';
import { ContentType, PublishGate, PublishDecision } from './publish-gate.js';
import { Cluster } from './cluster-engine.js';
import { RawArticle } from '../models/raw-article.js';

describe('turkish-text-match', () => {
  it('kazandı must NOT match accident keyword kaza', () => {
    const title =
      "Formula 1'de sezonun 8. etabı Avusturya Grand Prix'sini George Russell kazandı";
    expect(containsAccidentSignal(title)).toBe(false);
    expect(isWinVerbToken('kazandı')).toBe(true);
  });

  it('kazanan, kazanmak, kazanıyor must not match accident', () => {
    expect(containsAccidentSignal('Takım maçı kazanan oldu')).toBe(false);
    expect(containsAccidentSignal('Şampiyonluk için kazanmak zorunda')).toBe(false);
    expect(containsAccidentSignal('Liderlikte kazanıyor')).toBe(false);
  });

  it('trafik kazası and kaza yaptı still match accident', () => {
    expect(containsAccidentSignal('Ankara yolunda trafik kazası meydana geldi')).toBe(true);
    expect(containsAccidentSignal('Sürücü kaza yaptı')).toBe(true);
  });

  it('Formula 1 kazandı is sport context, not disaster alert', () => {
    const text =
      "Formula 1'de sezonun 8. etabı Avusturya Grand Prix'sini George Russell kazandı. Mercedes'in Büyük Britanyalı pilotu.";
    expect(containsSportContext(text)).toBe(true);
    expect(containsDisasterAlertSignal(text)).toBe(false);
    expect(containsCriticalDisasterSeverity(text)).toBe(false);
  });

  it('Balıkesir deprem must not match environment via balık substring', () => {
    const text = "Balıkesir'de 4 büyüklüğünde deprem meydana geldi";
    expect(containsEnvironmentSignal(text)).toBe(false);
    expect(containsDisasterAlertSignal(text)).toBe(true);
    expect(containsCriticalDisasterSeverity(text)).toBe(true);
  });

  it('büyüklüğünde must not trigger casualty via ölü substring', () => {
    expect(containsCriticalDisasterSeverity('4 büyüklüğünde genel bilgi')).toBe(false);
  });
});

describe('resolveFeedCategory', () => {
  it('Formula 1 resolves to motor sports category', () => {
    const text =
      "Formula 1'de sezonun 8. etabı Avusturya Grand Prix'sini George Russell kazandı";
    expect(resolveFeedCategory(text, ContentType.SPORTS, 'Güncel')).toBe('Spor / Motor sporları');
  });

  it('Balıkesir deprem resolves to Afet / Deprem', () => {
    const text = "Balıkesir'de 4 büyüklüğünde deprem meydana geldi";
    expect(resolveFeedCategory(text, ContentType.DISASTER_ALERT, 'Manşet')).toBe('Afet / Deprem');
  });
});

describe('PublishGate classification fixes', () => {
  const gate = new PublishGate();

  const mockArticle = (id: string, sourceName: string, title: string, desc: string): RawArticle => ({
    id,
    sourceId: sourceName.toLowerCase(),
    sourceName,
    sourceUrl: `http://${sourceName.toLowerCase()}`,
    originalUrl: `http://${sourceName.toLowerCase()}/${id}`,
    originalTitle: title,
    shortDescription: desc,
    publishedAt: Date.now(),
    fetchedAt: Date.now(),
    categoryHint: 'Güncel',
    language: 'tr',
    country: 'TR',
  });

  it('Formula 1 single-source must NOT publish as critical disaster', () => {
    const cluster: Cluster = {
      id: 'f1',
      articles: [
        mockArticle(
          '1',
          'AA',
          "Formula 1'de sezonun 8. etabı Avusturya Grand Prix'sini George Russell kazandı",
          "Mercedes'in Büyük Britanyalı pilotu George Russell kazandı.",
        ),
      ],
      mainCategory: 'Güncel',
      earliestPublishedAt: Date.now(),
    };

    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.SPORTS);
    expect(result.decision).not.toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.reason).not.toBe('Ana akışa alınma nedeni: Tek kaynaklı ama kritik olay bildirimi');
  });

  it('Balıkesir deprem single-source can remain critical publish', () => {
    const cluster: Cluster = {
      id: 'eq',
      articles: [
        mockArticle(
          '2',
          'AA',
          "Balıkesir'de 4 büyüklüğünde deprem",
          "Balıkesir'de saat 15.56'da 4 büyüklüğünde deprem meydana geldi.",
        ),
      ],
      mainCategory: 'Manşet',
      earliestPublishedAt: Date.now(),
    };

    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.DISASTER_ALERT);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.reason).toBe('Ana akışa alınma nedeni: Tek kaynaklı ama kritik olay bildirimi');
  });
});

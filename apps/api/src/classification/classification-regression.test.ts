import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  containsAccidentSignal,
  containsCriticalDisasterSeverity,
  containsDisasterAlertSignal,
  containsEarthquakeSignal,
  containsEnvironmentSignal,
  containsSportContext,
} from '../engine/turkish-text-match.js';
import { resolveFeedCategory } from '../engine/feed-category.js';
import {
  ContentType,
  PublishDecision,
  PublishGate,
} from '../engine/publish-gate.js';
import type { Cluster } from '../engine/cluster-engine.js';
import type { RawArticle } from '../models/raw-article.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, 'fixtures', 'classification-regression-cases.json');

interface TextMatchExpectations {
  containsAccidentSignal?: boolean;
  containsSportContext?: boolean;
  containsDisasterAlertSignal?: boolean;
  containsCriticalDisasterSeverity?: boolean;
  containsEnvironmentSignal?: boolean;
  containsEarthquakeSignal?: boolean;
}

interface CategoryExpectations {
  fallbackCategory: string;
  expectedCategory: string;
}

interface PublishGateExpectations {
  contentType?: keyof typeof ContentType;
  decision?: keyof typeof PublishDecision;
  decisionNot?: keyof typeof PublishDecision;
  reason?: string;
  reasonNot?: string;
}

interface RegressionCase {
  id: string;
  label: string;
  title: string;
  summary?: string;
  textMatch?: TextMatchExpectations;
  category?: CategoryExpectations;
  publishGate?: PublishGateExpectations;
}

interface FixtureFile {
  version: string;
  cases: RegressionCase[];
}

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as FixtureFile;
const gate = new PublishGate();

function combinedText(testCase: RegressionCase): string {
  return `${testCase.title} ${testCase.summary ?? ''}`.trim();
}

function mockArticle(id: string, title: string, desc: string): RawArticle {
  return {
    id,
    sourceId: 'aa',
    sourceName: 'Anadolu Ajansı',
    sourceUrl: 'http://aa',
    originalUrl: `http://aa/${id}`,
    originalTitle: title,
    shortDescription: desc,
    publishedAt: Date.now(),
    fetchedAt: Date.now(),
    categoryHint: 'Güncel',
    language: 'tr',
    country: 'TR',
  };
}

function clusterFromCase(testCase: RegressionCase): Cluster {
  return {
    id: testCase.id,
    articles: [mockArticle('1', testCase.title, testCase.summary ?? '')],
    mainCategory: testCase.category?.fallbackCategory ?? 'Güncel',
    earliestPublishedAt: Date.now(),
  };
}

function assertTextMatch(testCase: RegressionCase): void {
  const text = combinedText(testCase);
  const expected = testCase.textMatch;
  if (!expected) return;

  if (expected.containsAccidentSignal !== undefined) {
    expect(containsAccidentSignal(text), testCase.id).toBe(expected.containsAccidentSignal);
  }
  if (expected.containsSportContext !== undefined) {
    expect(containsSportContext(text), testCase.id).toBe(expected.containsSportContext);
  }
  if (expected.containsDisasterAlertSignal !== undefined) {
    expect(containsDisasterAlertSignal(text), testCase.id).toBe(expected.containsDisasterAlertSignal);
  }
  if (expected.containsCriticalDisasterSeverity !== undefined) {
    expect(containsCriticalDisasterSeverity(text), testCase.id).toBe(
      expected.containsCriticalDisasterSeverity,
    );
  }
  if (expected.containsEnvironmentSignal !== undefined) {
    expect(containsEnvironmentSignal(text), testCase.id).toBe(expected.containsEnvironmentSignal);
  }
  if (expected.containsEarthquakeSignal !== undefined) {
    expect(containsEarthquakeSignal(text), testCase.id).toBe(expected.containsEarthquakeSignal);
  }
}

function assertCategory(testCase: RegressionCase): void {
  if (!testCase.category) return;

  const text = combinedText(testCase);
  const evaluation = gate.evaluate(clusterFromCase(testCase));
  const category = resolveFeedCategory(
    text.toLowerCase(),
    evaluation.contentType,
    testCase.category.fallbackCategory,
  );

  expect(category, testCase.id).toBe(testCase.category.expectedCategory);
}

function assertPublishGate(testCase: RegressionCase): void {
  if (!testCase.publishGate) return;

  const result = gate.evaluate(clusterFromCase(testCase));
  const expected = testCase.publishGate;

  if (expected.contentType !== undefined) {
    expect(result.contentType, testCase.id).toBe(ContentType[expected.contentType]);
  }
  if (expected.decision !== undefined) {
    expect(result.decision, testCase.id).toBe(PublishDecision[expected.decision]);
  }
  if (expected.decisionNot !== undefined) {
    expect(result.decision, testCase.id).not.toBe(PublishDecision[expected.decisionNot]);
  }
  if (expected.reason !== undefined) {
    expect(result.reason, testCase.id).toBe(expected.reason);
  }
  if (expected.reasonNot !== undefined) {
    expect(result.reason, testCase.id).not.toBe(expected.reasonNot);
  }
}

describe(`classification regression fixture pack ${fixture.version}`, () => {
  expect(fixture.cases.length).toBeGreaterThanOrEqual(11);

  for (const testCase of fixture.cases) {
    describe(testCase.id, () => {
      it(testCase.label, () => {
        assertTextMatch(testCase);
        assertCategory(testCase);
        assertPublishGate(testCase);
      });
    });
  }
});

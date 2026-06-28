import type { Cluster } from '../engine/cluster-engine.js';
import { uniqueSourceCount } from '../engine/cluster-engine.js';
import {
  ContentType,
  PublishDecision,
  type PublishResult,
  TopicQuality,
} from '../engine/publish-gate.js';
import type { SourceScoreShadowPayload } from './source-score-types.js';
import {
  buildSourceSignalFromShadow,
  containsBannedPhrase,
  type SourceSignalPayload,
} from './source-signal-mapper.js';

export type SourceSignalDryRunAction =
  | 'noAction'
  | 'wouldBlockCritical'
  | 'wouldDemoteMain'
  | 'insufficientSignal';

export interface SourceSignalPublishDryRunDecision {
  clusterId: string;
  actualPublishDecision: string;
  dryRunAction: SourceSignalDryRunAction;
  wouldBlockCritical: boolean;
  wouldDemoteMain: boolean;
  dryRunOnly: true;
  reasons: string[];
  sourceSignalBand?: string;
  uniqueSourceCount: number;
}

export interface SourceSignalPublishDryRunPayload {
  version: 'v0';
  readOnly: true;
  disclaimer: string;
  evaluatedCount: number;
  wouldBlockCount: number;
  wouldDemoteCount: number;
  decisions: SourceSignalPublishDryRunDecision[];
}

export const DRY_RUN_DISCLAIMER =
  'Dry-run yalnızca simülasyon; gerçek publish kararını değiştirmez. Mutlak doğruluk iddiası değildir.';

function isCriticalClaim(evaluation: PublishResult): boolean {
  return (
    evaluation.topicQuality === TopicQuality.CRITICAL ||
    evaluation.importance === 'CRITICAL' ||
    evaluation.importance === 'HIGH' ||
    evaluation.contentType === ContentType.DISASTER_ALERT
  );
}

function isUnknownSourceSignal(signal: SourceSignalPayload): boolean {
  return (
    signal.scoreBand === 'UNKNOWN' ||
    signal.scoreBand === 'LOW' ||
    signal.tierLabel.toLowerCase().includes('bilinmeyen') ||
    signal.tierLabel.toLowerCase().includes('düşük güven')
  );
}

function isOfficialOrHighSignal(signal: SourceSignalPayload): boolean {
  return (
    signal.scoreBand === 'HIGH' ||
    signal.tierLabel.toLowerCase().includes('resmi') ||
    signal.tierLabel.toLowerCase().includes('ajans') ||
    signal.tierLabel.toLowerCase().includes('bilinen medya')
  );
}

function hasMetadataGap(signal: SourceSignalPayload): boolean {
  return signal.reasons.some((r) => r.toLowerCase().includes('metadata'));
}

function hasMultiSourceConfirmation(
  signal: SourceSignalPayload,
  uniqueSources: number,
): boolean {
  return (
    uniqueSources >= 2 ||
    signal.reasons.some((r) => r.toLowerCase().includes('birden fazla kaynak'))
  );
}

export function evaluateSourceSignalPublishDryRun(params: {
  clusterId: string;
  evaluation: PublishResult;
  sourceSignal: SourceSignalPayload | null;
  uniqueSourceCount: number;
}): SourceSignalPublishDryRunDecision {
  const { clusterId, evaluation, sourceSignal, uniqueSourceCount: sources } = params;
  const reasons: string[] = ['dryRunOnly: gerçek publish değiştirilmedi'];

  if (!sourceSignal) {
    reasons.push('insufficientSignal: kaynak sinyali yok — dry-run noAction');
    return {
      clusterId,
      actualPublishDecision: evaluation.decision,
      dryRunAction: 'insufficientSignal',
      wouldBlockCritical: false,
      wouldDemoteMain: false,
      dryRunOnly: true,
      reasons,
      uniqueSourceCount: sources,
    };
  }

  for (const reason of sourceSignal.reasons) {
    if (containsBannedPhrase(reason)) {
      reasons.push('dry-run: güvensiz ifade filtrelendi');
    }
  }

  if (
    isOfficialOrHighSignal(sourceSignal) &&
    hasMultiSourceConfirmation(sourceSignal, sources)
  ) {
    reasons.push('noAction: resmi/yüksek profil + çoklu kaynak teyidi');
    return {
      clusterId,
      actualPublishDecision: evaluation.decision,
      dryRunAction: 'noAction',
      wouldBlockCritical: false,
      wouldDemoteMain: false,
      dryRunOnly: true,
      reasons,
      sourceSignalBand: sourceSignal.scoreBand,
      uniqueSourceCount: sources,
    };
  }

  if (
    isUnknownSourceSignal(sourceSignal) &&
    sources === 1 &&
    isCriticalClaim(evaluation)
  ) {
    reasons.push(
      'wouldBlockCritical: bilinmeyen/düşük profil + tek kaynak + kritik iddia sinyali',
    );
    return {
      clusterId,
      actualPublishDecision: evaluation.decision,
      dryRunAction: 'wouldBlockCritical',
      wouldBlockCritical: true,
      wouldDemoteMain: false,
      dryRunOnly: true,
      reasons,
      sourceSignalBand: sourceSignal.scoreBand,
      uniqueSourceCount: sources,
    };
  }

  if (
    (sourceSignal.scoreBand === 'LOW' || sourceSignal.scoreBand === 'UNKNOWN') &&
    hasMetadataGap(sourceSignal) &&
    sources === 1 &&
    evaluation.decision === PublishDecision.PUBLISH_MAIN
  ) {
    reasons.push(
      'wouldDemoteMain: düşük sinyal + metadata eksikliği + tek kaynak — ana akıştan çıkarılırdı',
    );
    return {
      clusterId,
      actualPublishDecision: evaluation.decision,
      dryRunAction: 'wouldDemoteMain',
      wouldBlockCritical: false,
      wouldDemoteMain: true,
      dryRunOnly: true,
      reasons,
      sourceSignalBand: sourceSignal.scoreBand,
      uniqueSourceCount: sources,
    };
  }

  reasons.push('noAction: dry-run kuralı tetiklenmedi');
  return {
    clusterId,
    actualPublishDecision: evaluation.decision,
    dryRunAction: 'noAction',
    wouldBlockCritical: false,
    wouldDemoteMain: false,
    dryRunOnly: true,
    reasons,
    sourceSignalBand: sourceSignal.scoreBand,
    uniqueSourceCount: sources,
  };
}

export function buildSourceSignalPublishDryRun(params: {
  clusters: Cluster[];
  clusterEvaluations: Map<string, PublishResult>;
  itemsByClusterId: Map<string, { sourceSignal?: SourceSignalPayload | null }>;
  shadow: SourceScoreShadowPayload | null | undefined;
  leadArticleIdsByCluster: Map<string, string>;
}): SourceSignalPublishDryRunPayload {
  const decisions: SourceSignalPublishDryRunDecision[] = [];

  for (const cluster of params.clusters) {
    const evaluation = params.clusterEvaluations.get(cluster.id);
    if (!evaluation) continue;

    const item = params.itemsByClusterId.get(cluster.id);
    const leadArticleId = params.leadArticleIdsByCluster.get(cluster.id);
    const sourceSignal =
      item?.sourceSignal ??
      buildSourceSignalFromShadow(params.shadow, cluster.id, leadArticleId);

    const decision = evaluateSourceSignalPublishDryRun({
      clusterId: cluster.id,
      evaluation,
      sourceSignal,
      uniqueSourceCount: uniqueSourceCount(cluster.articles),
    });
    decisions.push(decision);
  }

  const wouldBlockCount = decisions.filter((d) => d.wouldBlockCritical).length;
  const wouldDemoteCount = decisions.filter((d) => d.wouldDemoteMain).length;

  return {
    version: 'v0',
    readOnly: true,
    disclaimer: DRY_RUN_DISCLAIMER,
    evaluatedCount: decisions.length,
    wouldBlockCount,
    wouldDemoteCount,
    decisions,
  };
}

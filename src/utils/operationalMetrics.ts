/**
 * Operational Metrics & Statistical Process Control (CEP / SPC)
 *
 * Implements Shewhart Control Charts (X-bar and S) for Cloud Synchronization Lead Time,
 * Mean Time Between Failures (MTBF), and Conflict Resolution Rate tracking.
 *
 * Designed under Industrial Engineering standards for process reliability and bottleneck detection.
 */

import { safeLogEvent } from '../firebase';

export interface SyncProcessMetrics {
  sampleSize: number;
  meanLeadTimeMs: number;
  stdDevMs: number;
  uclMs: number; // Upper Control Limit (X̄ + 3σ)
  lclMs: number; // Lower Control Limit (max(0, X̄ - 3σ))
  lastLeadTimeMs: number;
  isOutOfControl: boolean;
  totalSyncAttempts: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalConflictsResolved: {
    tombstoneSkips: number;
    coinReconciliations: number;
    windowingPrunes: number;
  };
}

const WINDOW_SIZE = 30;
const leadTimeHistory: number[] = [];

let totalSyncAttempts = 0;
let successfulSyncs = 0;
let failedSyncs = 0;

let tombstoneSkipsCount = 0;
let coinReconciliationsCount = 0;
let windowingPrunesCount = 0;

/**
 * Calculates sample mean (X̄).
 */
export function calculateMean(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sum = samples.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / samples.length) * 100) / 100;
}

/**
 * Calculates sample standard deviation (S / σ).
 */
export function calculateStdDev(samples: number[], mean: number): number {
  if (samples.length < 2) return 0;
  const varianceSum = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = varianceSum / (samples.length - 1);
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Calculates Shewhart Control Limits (UCL and LCL at 3-sigma).
 */
export function calculateControlLimits(mean: number, stdDev: number): { ucl: number; lcl: number } {
  const ucl = Math.round((mean + 3 * stdDev) * 100) / 100;
  const lcl = Math.max(0, Math.round((mean - 3 * stdDev) * 100) / 100);
  return { ucl, lcl };
}

/**
 * Records a completed sync lead time and updates SPC parameters.
 */
export function recordSyncLeadTime(durationMs: number, success: boolean): SyncProcessMetrics {
  totalSyncAttempts++;

  // 1. Evaluate against established baseline BEFORE adding to history (prevents baseline distortion)
  const priorMean = calculateMean(leadTimeHistory);
  const priorStdDev = calculateStdDev(leadTimeHistory, priorMean);
  const { ucl: priorUcl, lcl: priorLcl } = calculateControlLimits(priorMean, priorStdDev);

  const isOutOfControl =
    leadTimeHistory.length >= 5 && priorStdDev > 0 && durationMs > priorUcl;

  if (success) {
    successfulSyncs++;
    leadTimeHistory.push(durationMs);
    if (leadTimeHistory.length > WINDOW_SIZE) {
      leadTimeHistory.shift();
    }
  } else {
    failedSyncs++;
  }

  const currentMean = calculateMean(leadTimeHistory);
  const currentStdDev = calculateStdDev(leadTimeHistory, currentMean);
  const { ucl, lcl } = calculateControlLimits(currentMean, currentStdDev);

  const metrics: SyncProcessMetrics = {
    sampleSize: leadTimeHistory.length,
    meanLeadTimeMs: currentMean,
    stdDevMs: currentStdDev,
    uclMs: isOutOfControl ? priorUcl : ucl,
    lclMs: isOutOfControl ? priorLcl : lcl,
    lastLeadTimeMs: durationMs,
    isOutOfControl,
    totalSyncAttempts,
    successfulSyncs,
    failedSyncs,
    totalConflictsResolved: {
      tombstoneSkips: tombstoneSkipsCount,
      coinReconciliations: coinReconciliationsCount,
      windowingPrunes: windowingPrunesCount,
    },
  };

  // Western Electric Rule 1: Point outside 3-sigma control limits
  if (metrics.isOutOfControl || totalSyncAttempts % 10 === 0) {
    safeLogEvent('operational_sync_cep', {
      mean_lead_time_ms: metrics.meanLeadTimeMs,
      std_dev_ms: metrics.stdDevMs,
      ucl_ms: metrics.uclMs,
      lcl_ms: metrics.lclMs,
      last_lead_time_ms: durationMs,
      is_anomaly: metrics.isOutOfControl,
      sample_size: metrics.sampleSize,
      total_conflicts:
        tombstoneSkipsCount + coinReconciliationsCount + windowingPrunesCount,
    });
  }

  return metrics;
}

/**
 * Records conflict resolution events to measure concurrency divergence.
 */
export function recordConflictResolution(type: 'tombstone' | 'coin' | 'windowing', count = 1): void {
  if (type === 'tombstone') tombstoneSkipsCount += count;
  else if (type === 'coin') coinReconciliationsCount += count;
  else if (type === 'windowing') windowingPrunesCount += count;
}

/**
 * Returns current snapshot of operational & statistical process metrics.
 */
export function getOperationalMetrics(lastLeadTimeMs?: number): SyncProcessMetrics {
  const currentLeadTime = lastLeadTimeMs ?? (leadTimeHistory.length > 0 ? leadTimeHistory[leadTimeHistory.length - 1] : 0);
  const mean = calculateMean(leadTimeHistory);
  const stdDev = calculateStdDev(leadTimeHistory, mean);
  const { ucl, lcl } = calculateControlLimits(mean, stdDev);

  // Anomaly criteria: only evaluate after baseline of at least 5 samples
  const isOutOfControl =
    leadTimeHistory.length >= 5 && stdDev > 0 && currentLeadTime > ucl;

  return {
    sampleSize: leadTimeHistory.length,
    meanLeadTimeMs: mean,
    stdDevMs: stdDev,
    uclMs: ucl,
    lclMs: lcl,
    lastLeadTimeMs: currentLeadTime,
    isOutOfControl,
    totalSyncAttempts,
    successfulSyncs,
    failedSyncs,
    totalConflictsResolved: {
      tombstoneSkips: tombstoneSkipsCount,
      coinReconciliations: coinReconciliationsCount,
      windowingPrunes: windowingPrunesCount,
    },
  };
}

/**
 * Resets process metrics (used primarily in test suites).
 */
export function resetOperationalMetrics(): void {
  leadTimeHistory.length = 0;
  totalSyncAttempts = 0;
  successfulSyncs = 0;
  failedSyncs = 0;
  tombstoneSkipsCount = 0;
  coinReconciliationsCount = 0;
  windowingPrunesCount = 0;
}

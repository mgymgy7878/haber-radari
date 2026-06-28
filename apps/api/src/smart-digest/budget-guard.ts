import fs from 'fs/promises';
import path from 'path';
import { BudgetDayStats } from './types.js';

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export class SmartDigestBudgetGuard {
  constructor(
    private readonly budgetDir: string,
    private readonly dailyLimit: number
  ) {}

  private filePath(date: string): string {
    return path.join(this.budgetDir, `${date}.json`);
  }

  private async readDay(date: string): Promise<BudgetDayStats> {
    try {
      const raw = await fs.readFile(this.filePath(date), 'utf8');
      return JSON.parse(raw) as BudgetDayStats;
    } catch {
      return {
        date,
        externalCalls: 0,
        cacheHits: 0,
        failures: 0,
        budgetDenied: 0,
      };
    }
  }

  private async writeDay(stats: BudgetDayStats): Promise<void> {
    await fs.mkdir(this.budgetDir, { recursive: true });
    await fs.writeFile(this.filePath(stats.date), JSON.stringify(stats, null, 2), 'utf8');
  }

  async getTodayStats(): Promise<BudgetDayStats> {
    return this.readDay(todayKey());
  }

  async canMakeExternalCall(): Promise<{ allowed: boolean; reason?: string }> {
    const stats = await this.getTodayStats();
    if (stats.externalCalls >= this.dailyLimit) {
      return { allowed: false, reason: 'BUDGET_EXCEEDED' };
    }
    return { allowed: true };
  }

  async recordExternalCall(): Promise<void> {
    const date = todayKey();
    const stats = await this.readDay(date);
    stats.externalCalls += 1;
    await this.writeDay(stats);
  }

  async recordCacheHit(): Promise<void> {
    const date = todayKey();
    const stats = await this.readDay(date);
    stats.cacheHits += 1;
    await this.writeDay(stats);
  }

  async recordFailure(): Promise<void> {
    const date = todayKey();
    const stats = await this.readDay(date);
    stats.failures += 1;
    await this.writeDay(stats);
  }

  async recordBudgetDenied(): Promise<void> {
    const date = todayKey();
    const stats = await this.readDay(date);
    stats.budgetDenied += 1;
    await this.writeDay(stats);
  }

  async resetToday(): Promise<void> {
    await this.writeDay({
      date: todayKey(),
      externalCalls: 0,
      cacheHits: 0,
      failures: 0,
      budgetDenied: 0,
    });
  }
}

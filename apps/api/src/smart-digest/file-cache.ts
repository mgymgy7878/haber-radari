import fs from 'fs/promises';
import path from 'path';
import { SmartDigestCacheEntry } from './types.js';

export class SmartDigestFileCache {
  constructor(
    private readonly cacheDir: string,
    private readonly ttlMs: number
  ) {}

  private filePath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}.json`);
  }

  async ensureDir(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async get(cacheKey: string): Promise<SmartDigestCacheEntry | null> {
    try {
      const raw = await fs.readFile(this.filePath(cacheKey), 'utf8');
      const entry = JSON.parse(raw) as SmartDigestCacheEntry;
      if (Date.now() > Date.parse(entry.expiresAt)) {
        await this.delete(cacheKey);
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }

  async set(cacheKey: string, digest: SmartDigestCacheEntry['digest']): Promise<SmartDigestCacheEntry> {
    await this.ensureDir();
    const now = Date.now();
    const entry: SmartDigestCacheEntry = {
      cacheKey,
      digest,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.ttlMs).toISOString(),
    };
    await fs.writeFile(this.filePath(cacheKey), JSON.stringify(entry, null, 2), 'utf8');
    return entry;
  }

  async delete(cacheKey: string): Promise<void> {
    try {
      await fs.unlink(this.filePath(cacheKey));
    } catch {
      // ignore missing file
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files
          .filter((f) => f.endsWith('.json'))
          .map((f) => fs.unlink(path.join(this.cacheDir, f)))
      );
    } catch {
      // ignore missing dir
    }
  }
}

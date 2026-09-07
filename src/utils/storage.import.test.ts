import { describe, it, expect, beforeEach } from 'vitest';
import { importDataDetailed, exportData, EXPORT_SCHEMA_VERSION } from './storage';

describe('importDataDetailed', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips its own export', () => {
    const result = importDataDetailed(exportData());
    expect(result.ok).toBe(true);
    expect(result.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(result.restored).toContain('userStats');
  });

  it('stamps the export with an app name and schema version', () => {
    const parsed = JSON.parse(exportData());
    expect(parsed.app).toBe('keyperfect');
    expect(parsed.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(typeof parsed.appVersion).toBe('string');
  });

  it('rejects an empty file', () => {
    expect(importDataDetailed('')).toMatchObject({ ok: false, code: 'empty' });
    expect(importDataDetailed('   ')).toMatchObject({ ok: false, code: 'empty' });
  });

  it('rejects a file that is not JSON', () => {
    expect(importDataDetailed('not json at all')).toMatchObject({ ok: false, code: 'not_json' });
  });

  it('rejects JSON that is not an object', () => {
    // These used to import "successfully" while restoring nothing.
    expect(importDataDetailed('[]')).toMatchObject({ ok: false, code: 'not_an_object' });
    expect(importDataDetailed('"hello"')).toMatchObject({ ok: false, code: 'not_an_object' });
    expect(importDataDetailed('null')).toMatchObject({ ok: false, code: 'not_an_object' });
  });

  it('rejects an object with no KeyPerfect data in it', () => {
    expect(importDataDetailed('{}')).toMatchObject({ ok: false, code: 'no_recognised_data' });
    expect(importDataDetailed(JSON.stringify({ unrelated: 1 }))).toMatchObject({
      ok: false,
      code: 'no_recognised_data',
    });
  });

  it("rejects another app's backup", () => {
    const result = importDataDetailed(JSON.stringify({ app: 'someotherapp', userStats: {} }));
    expect(result).toMatchObject({ ok: false, code: 'foreign_file' });
    expect(result.message).toContain('someotherapp');
  });

  it('refuses a backup written by a newer format than this build reads', () => {
    const result = importDataDetailed(
      JSON.stringify({ app: 'keyperfect', schemaVersion: EXPORT_SCHEMA_VERSION + 1, userStats: {} }),
    );
    expect(result).toMatchObject({ ok: false, code: 'too_new' });
    expect(result.message).toMatch(/newer version/i);
  });

  it('accepts a pre-versioning backup as format 1', () => {
    // Files exported before versioning carry no schemaVersion but the same fields.
    const legacy = JSON.stringify({ userStats: { totalXP: 42 }, achievements: ['first_steps'] });
    const result = importDataDetailed(legacy);
    expect(result.ok).toBe(true);
    expect(result.schemaVersion).toBe(1);
    expect(result.restored).toEqual(['userStats', 'achievements']);
  });

  it('writes nothing when validation fails', () => {
    localStorage.setItem('keyperfect_user_stats', JSON.stringify({ totalXP: 7 }));
    importDataDetailed('{}');
    expect(JSON.parse(localStorage.getItem('keyperfect_user_stats')!).totalXP).toBe(7);
  });
});

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Adapter } from 'oidc-provider';

let db: Database<sqlite3.Database, sqlite3.Statement>;

(async () => {
  db = await open({
    filename: './oidc.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS oidc (
      id TEXT PRIMARY KEY,
      payload TEXT,
      expiresAt INTEGER
    );
  `);
})();

export class SQLiteAdapter implements Adapter {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async upsert(id: string, payload: any, expiresIn: number) {
    const expiresAt = Date.now() + expiresIn * 1000;
    await db.run(
      'INSERT OR REPLACE INTO oidc (id, payload, expiresAt) VALUES (?, ?, ?)',
      id,
      JSON.stringify(payload),
      expiresAt
    );
  }

  async find(id: string) {
    const row = await db.get('SELECT payload FROM oidc WHERE id = ?', id);
    return row ? JSON.parse(row.payload) : undefined;
  }

  async findByUserCode(userCode: string) {
    const row = await db.get('SELECT payload FROM oidc WHERE json_extract(payload, "$.userCode") = ?', userCode);
    return row ? JSON.parse(row.payload) : undefined;
  }

  async findByUid(uid: string) {
    const row = await db.get('SELECT payload FROM oidc WHERE json_extract(payload, "$.uid") = ?', uid);
    return row ? JSON.parse(row.payload) : undefined;
  }

  async destroy(id: string) {
    await db.run('DELETE FROM oidc WHERE id = ?', id);
  }

  async revokeByGrantId(grantId: string) {
    await db.run('DELETE FROM oidc WHERE json_extract(payload, "$.grantId") = ?', grantId);
  }

  async consume(id: string) {
    await db.run('UPDATE oidc SET payload = json_set(payload, "$.consumed", ?) WHERE id = ?', Date.now(), id);
  }
}

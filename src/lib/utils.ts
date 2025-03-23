import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import initSqlJs from 'sql.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DatabaseResult = {
  db: any;
  error?: string;
};

type KeyValuePair = {
  key: string;
  value: string | number;
};

export async function initDB(arrayBuffer: ArrayBuffer): Promise<DatabaseResult> {
  try {
    const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
    const db = new SQL.Database(new Uint8Array(arrayBuffer));
    return { db };
  } catch (error) {
    return { db: null, error: 'Failed to initialize database' };
  }
}

export function validateStorageTable(db: any): string | null {
  try {
    const result = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='LocalStorage'
    `);

    if (result.length === 0) return 'Missing LocalStorage table';

    const columns = db.exec('PRAGMA table_info(LocalStorage)');
    const hasKey = columns[0].values.some((col: any[]) => col[1] === 'key');
    const hasValue = columns[0].values.some((col: any[]) => col[1] === 'value');

    if (!hasKey && !hasValue) return 'Invalid table schema: Missing both "key" and "value" columns';
    if (!hasKey) return 'Invalid table schema: Missing "key" column';
    if (!hasValue) return 'Invalid table schema: Missing "value" column';
    return null;
  } catch (error) {
    return 'Error validating database. Is it actually a Wuwa DB?';
  }
}

export function getStorageEntries(db: any): KeyValuePair[] {
  const result = db.exec('SELECT Key, Value FROM LocalStorage');
  return result[0]?.values.map(([key, value]: [string, string]) => ({
    key,
    value: isNaN(Number(value)) ? value : Number(value)
  })) || [];
}

export function updateKeyValue(db: any, key: string, value: string | number) {
  db.exec(`UPDATE LocalStorage SET Value = '${value}' WHERE Key = '${key}'`);
}

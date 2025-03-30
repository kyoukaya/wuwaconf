import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import initSqlJs, { Database } from 'sql.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type DatabaseResult = Result<Database, string>

type KeyValuePair = {
  key: string;
  value: string;
};

export async function initDB(arrayBuffer: ArrayBuffer): Promise<DatabaseResult> {
  try {
    const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
    const db = new SQL.Database(new Uint8Array(arrayBuffer));
    return { ok: true, value: db };
  } catch (error) {
    return { ok: false, error: 'Failed to initialize database' };
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
    value: value,
  })) || [];
}

export function updateKeyValue(db: Database, key: string, value: string | number) {
  db.exec('UPDATE LocalStorage SET Value = ? WHERE Key = ?', [value, key]);
}

export function createFpsTrigger(db: Database, fps: number = 120) {
  // Remove the trigger if it exists
  db.exec("DROP TRIGGER IF EXISTS prevent_custom_frame_rate_update");

  // Create the trigger to prevent updates to the CustomFrameRate value
  const triggerSql = `
    CREATE TRIGGER prevent_custom_frame_rate_update
    AFTER UPDATE OF value ON LocalStorage
    WHEN NEW.key = 'CustomFrameRate'
    BEGIN
      UPDATE LocalStorage
      SET value = ${fps}
      WHERE key = 'CustomFrameRate';
    END;
  `;
  db.exec(triggerSql);
}

export function updateMenuDataAndPlayMenuInfo(db: Database) {
  const menuData = '{"___MetaType___":"___Map___","Content":[[1,42],[2,72],[3,0],[4,45],[5,0],[6,0],[7,-1],[10,3],[11,3],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,1],[52,2],[53,0],[54,3],[55,2],[56,2],[57,1],[58,1],[59,1],[61,0],[62,0],[63,1],[64,1],[65,0],[66,0],[69,54],[70,56],[79,2],[87,1],[88,0],[89,69],[90,69],[91,76],[92,74],[93,0],[99,100],[100,100],[101,0],[102,0],[103,1],[104,50],[105,0],[106,0.3],[107,0],[112,0],[113,0],[114,0],[115,0],[116,0],[117,0],[118,0],[119,0],[120,0],[121,1],[122,1],[123,0],[130,0],[131,0],[132,1],[135,1],[133,0]]}';
  const playMenuInfo = '{"1":45,"2":72,"3":0,"4":45,"5":0,"6":0,"7":-1,"10":3,"11":3,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0,"51":1,"52":2,"53":0,"54":3,"55":2,"56":2,"57":1,"58":1,"59":1,"61":0,"62":0,"63":1,"64":1,"65":0,"66":0,"69":54,"70":56,"79":2,"87":1,"88":0,"89":50,"90":51,"91":86,"92":87,"93":0,"99":100,"100":100,"101":0,"102":0,"103":1,"104":50,"105":0,"106":0.3,"107":0,"112":0,"113":0,"114":0,"115":0,"116":0,"117":0,"118":0,"119":0,"120":0,"121":1,"122":1,"123":0,"130":0,"131":0,"132":1}';

const updateOrInsertData = (db: Database, key: string, data: string) => {
  const dataExists = db.exec('SELECT 1 FROM LocalStorage WHERE Key = ?', [key]);
  if (dataExists.length > 0 && dataExists[0].values.length > 0) {
    db.exec('UPDATE LocalStorage SET Value = ? WHERE Key = ?', [data, key]);
  } else {
    db.exec('INSERT INTO LocalStorage (Key, Value) VALUES (?, ?)', [key, data]);
  }
};

updateOrInsertData(db, 'MenuData', menuData);
updateOrInsertData(db, 'PlayMenuInfo', playMenuInfo);
}

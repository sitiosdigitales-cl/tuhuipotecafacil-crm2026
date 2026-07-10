// Cliente MySQL para hosting cPanel
// Configurar DATABASE_URL en .env con credenciales de cPanel

import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL no configurada");
    }
    pool = mysql.createPool({
      uri: url,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query(sql: string, params?: any[]) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params || []);
  return rows as any[];
}

export async function queryOne(sql: string, params?: any[]) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function insert(table: string, data: Record<string, any>) {
  const pool = getPool();
  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data).map(() => "?").join(", ");
  const values = Object.values(data);
  const [result] = await pool.execute(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values) as any;
  return { id: result.insertId, ...data };
}

export async function update(table: string, id: string, data: Record<string, any>) {
  const pool = getPool();
  const setClause = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = [...Object.values(data), id];
  await pool.execute(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
}

export async function remove(table: string, id: string) {
  const pool = getPool();
  await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export function isConnected(): boolean {
  return pool !== null;
}

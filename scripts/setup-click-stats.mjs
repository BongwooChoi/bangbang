import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
const url = process.env.STATS_DATABASE_URL;
if (!url) throw new Error('STATS_DATABASE_URL is required');
const sql = neon(url);
const schema = await readFile(new URL('./click-stats-schema.sql', import.meta.url), 'utf8');
await sql.transaction(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => sql.query(s)));
console.log('Click statistics schema ready (idempotent; existing counts preserved).');

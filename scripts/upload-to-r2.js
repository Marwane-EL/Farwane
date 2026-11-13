/**
 * scripts/upload-to-r2.js
 *
 * Script autonome (0 dépendance externe) pour uploader tout le dossier ./memes_optimized/
 * vers un bucket Cloudflare R2 via l'API S3 standard (AWS Signature V4), avec l'en-tête
 * Cache-Control: public, max-age=31536000, immutable, puis générer le script SQL
 * migrate-to-r2.sql pour mettre à jour Supabase en 1 clic.
 *
 * Variables à ajouter dans .env (ou .env.local) :
 *   R2_ACCOUNT_ID=ton_account_id_cloudflare
 *   R2_ACCESS_KEY_ID=ta_cle_access_r2
 *   R2_SECRET_ACCESS_KEY=ta_cle_secrete_r2
 *   R2_BUCKET_NAME=medias-farwane
 *   R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Charger .env et .env.local
function loadEnvFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'medias-farwane';
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

const MIME_MAP = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function hmac(key, string) {
  return crypto.createHmac('sha256', key).update(string, 'utf8').digest();
}

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function encodeRfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function uploadObjectToR2(key, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const encodedKey = key.split('/').map(encodeRfc3986).join('/');
    const canonicalUri = `/${encodeRfc3986(BUCKET_NAME)}/${encodedKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';

    const payloadHash = sha256Hex(buffer);
    const cacheControl = 'public, max-age=31536000, immutable';

    const canonicalHeaders =
      `cache-control:${cacheControl}\n` +
      `content-length:${buffer.length}\n` +
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = 'cache-control;content-length;content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
      'PUT',
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(Buffer.from(canonicalRequest, 'utf8')),
    ].join('\n');

    const kDate = hmac('AWS4' + SECRET_ACCESS_KEY, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

    const authorizationHeader =
      `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request(
      {
        hostname: host,
        port: 443,
        path: canonicalUri,
        method: 'PUT',
        headers: {
          'Host': host,
          'Cache-Control': cacheControl,
          'Content-Type': contentType,
          'Content-Length': buffer.length,
          'x-amz-content-sha256': payloadHash,
          'x-amz-date': amzDate,
          'Authorization': authorizationHeader,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function walkFiles(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkFiles(fullPath, baseDir));
    } else if (!entry.name.endsWith('.tmp.mp4')) {
      const relKey = path.relative(baseDir, fullPath).split(path.sep).join('/');
      results.push({ fullPath, key: relKey });
    }
  }
  return results;
}

function generateMigrationSql(r2PublicUrl) {
  const cleanUrl = r2PublicUrl || 'https://pub-VOTRE_ID_R2.r2.dev';
  const sql = `-- ==============================================================================
-- Migration Supabase Storage -> Cloudflare R2 (0€ Egress / Bande passante illimitée)
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- ==============================================================================

-- Remplace toutes les URLs du bucket Supabase 'medias-farwane' par celles de Cloudflare R2
UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(
    regexp_replace(
      elem,
      '^https://[a-z0-9]+\\.supabase\\.co/storage/v1/object/public/medias-farwane/',
      '${cleanUrl}/'
    )
  )
  FROM jsonb_array_elements_text(memes) AS elem
)
WHERE memes::text LIKE '%supabase.co/storage/v1/object/public/medias-farwane/%';

-- Vérification des nouvelles URLs
SELECT id, name, jsonb_array_length(memes) AS total_memes, memes->0 AS sample_url
FROM meme_packs;
`;

  const sqlPath = path.join(__dirname, '..', 'migrate-to-r2.sql');
  fs.writeFileSync(sqlPath, sql, 'utf-8');
  return sqlPath;
}

async function main() {
  const sqlPath = generateMigrationSql(PUBLIC_URL);
  console.log(`📝 Script SQL généré : ${sqlPath}`);

  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    console.log('\n⚠️  Variables Cloudflare R2 non configurées dans .env :');
    console.log('   R2_ACCOUNT_ID=...');
    console.log('   R2_ACCESS_KEY_ID=...');
    console.log('   R2_SECRET_ACCESS_KEY=...');
    console.log('   R2_BUCKET_NAME=medias-farwane');
    console.log('   R2_PUBLIC_URL=https://pub-xxxx.r2.dev\n');
    console.log('👉 Ajoute ces variables dans .env puis relance : node scripts/upload-to-r2.js');
    return;
  }

  const sourceDir = path.join(__dirname, '..', 'memes_optimized');
  const files = walkFiles(sourceDir);

  if (files.length === 0) {
    console.log('❌ Aucun fichier trouvé dans ./memes_optimized/. Lance d\'abord : node scripts/optimize-videos.js');
    return;
  }

  console.log(`\n🚀 Upload de ${files.length} fichiers optimisés vers Cloudflare R2 (bucket: ${BUCKET_NAME})...\n`);

  let uploaded = 0;
  let idx = 0;
  const concurrency = 6;

  async function worker() {
    while (idx < files.length) {
      const current = files[idx++];
      const buffer = fs.readFileSync(current.fullPath);
      const contentType = getContentType(current.fullPath);
      try {
        await uploadObjectToR2(current.key, buffer, contentType);
        uploaded++;
        process.stdout.write(`\r  [${uploaded}/${files.length}] Uploadé : ${current.key.slice(0, 45).padEnd(45)}`);
      } catch (err) {
        console.error(`\n❌ Erreur upload sur ${current.key}:`, err.message);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()));

  console.log('\n\n======================================================');
  console.log(`🎉 ${uploaded}/${files.length} fichiers uploadés sur Cloudflare R2 !`);
  console.log(`📄 Exécute maintenant le contenu de migrate-to-r2.sql dans Supabase SQL Editor.`);
  console.log('======================================================\n');
}

main().catch(console.error);


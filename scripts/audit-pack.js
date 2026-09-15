// Script d'audit des mèmes du pack Farwane
// Détecte les vidéos H.265 (incompatibles Chrome/PC), les URLs mortes et les médias valides.

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ccqqtalmhmbslyajgmmm.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcXF0YWxtaG1ic2x5YWpnbW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTkxODEsImV4cCI6MjA4ODQ5NTE4MX0.Qnt8GMwY2YM4mwQlcXSs62-_RM57BGzG9qbyLeSEQIE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function fetchBytes(urlStr, start, end) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const reqLib = parsed.protocol === 'http:' ? http : https;
      const headers = {};
      if (typeof start === 'number') {
        headers['Range'] = `bytes=${start}-${typeof end === 'number' ? end : ''}`;
      }
      const req = reqLib.get(urlStr, { headers, timeout: 8000 }, (res) => {
        // Redirections
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchBytes(res.headers.location, start, end));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            buffer: Buffer.concat(chunks),
          });
        });
      });
      req.on('timeout', () => { req.destroy(); resolve({ statusCode: 408 }); });
      req.on('error', (err) => resolve({ statusCode: 0, error: err.message }));
    } catch (e) {
      resolve({ statusCode: 0, error: e.message });
    }
  });
}

async function auditUrl(url) {
  const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url);

  // Pour les images / gifs
  if (!isVideo) {
    const res = await fetchBytes(url, 0, 1024);
    if (res.statusCode === 200 || res.statusCode === 206) {
      return { url, type: 'image', status: 'ok', codec: 'image/gif' };
    }
    return { url, type: 'image', status: 'error', error: `HTTP ${res.statusCode}` };
  }

  // Pour les vidéos (MP4 / MOV / WebM)
  // 1. Lire les premiers 64KB
  const headRes = await fetchBytes(url, 0, 65535);
  if (headRes.statusCode !== 200 && headRes.statusCode !== 206) {
    return { url, type: 'video', status: 'error', error: `HTTP ${headRes.statusCode}` };
  }

  const headBuf = headRes.buffer || Buffer.alloc(0);

  // Vérifier les codecs dans le head
  if (headBuf.includes(Buffer.from('hvc1')) || headBuf.includes(Buffer.from('hev1'))) {
    return { url, type: 'video', status: 'hevc', codec: 'H.265 (HEVC) [Incompatible Web]' };
  }
  if (headBuf.includes(Buffer.from('avc1'))) {
    return { url, type: 'video', status: 'ok', codec: 'H.264 (AVC) [Compatible]' };
  }
  if (headBuf.includes(Buffer.from('vp08')) || headBuf.includes(Buffer.from('vp09')) || headBuf.includes(Buffer.from('av01'))) {
    return { url, type: 'video', status: 'ok', codec: 'VP8/VP9/AV1 [Compatible]' };
  }

  // 2. Si non trouvé dans le head, chercher la taille totale pour inspecter la fin (moov at end)
  let totalSize = 0;
  const contentRange = headRes.headers && headRes.headers['content-range'];
  if (contentRange) {
    const parts = contentRange.split('/');
    if (parts[1]) totalSize = parseInt(parts[1], 10);
  } else if (headRes.headers && headRes.headers['content-length']) {
    totalSize = parseInt(headRes.headers['content-length'], 10);
  }

  if (totalSize > 65536) {
    const tailStart = Math.max(0, totalSize - 131072); // Derniers 128KB
    const tailRes = await fetchBytes(url, tailStart, totalSize - 1);
    const tailBuf = tailRes.buffer || Buffer.alloc(0);

    if (tailBuf.includes(Buffer.from('hvc1')) || tailBuf.includes(Buffer.from('hev1'))) {
      return { url, type: 'video', status: 'hevc', codec: 'H.265 (HEVC) [Incompatible Web]' };
    }
    if (tailBuf.includes(Buffer.from('avc1'))) {
      return { url, type: 'video', status: 'ok', codec: 'H.264 (AVC) [Compatible]' };
    }
  }

  // Par défaut si pas formellement identifié comme H.265 mais lisible
  return { url, type: 'video', status: 'ok', codec: 'Autre / H.264 présumé' };
}

// File d'attente concurrente pour aller vite
async function runPool(items, fn, concurrency = 10) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      const res = await fn(items[i], i);
      results[i] = res;
      process.stdout.write(`\r🔍 Analyse en cours : ${index}/${items.length} (${Math.round((index / items.length) * 100)}%)`);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  console.log('\n');
  return results;
}

async function main() {
  console.log('🚀 Chargement du pack "Memes par défaut" depuis Supabase...');
  const { data, error } = await supabase
    .from('meme_packs')
    .select('id, name, memes')
    .eq('id', '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b')
    .single();

  if (error || !data) {
    console.error('❌ Impossible de charger le pack :', error);
    process.exit(1);
  }

  const memes = data.memes || [];
  console.log(`📦 Pack : "${data.name}" — ${memes.length} mèmes à auditer\n`);

  const audited = await runPool(memes, auditUrl, 12);

  const ok = audited.filter(a => a.status === 'ok');
  const hevc = audited.filter(a => a.status === 'hevc');
  const broken = audited.filter(a => a.status === 'error');

  console.log('====================================================');
  console.log('📊 RÉSULTAT DE L\'AUDIT :');
  console.log(`  ✅ Compatibles (H.264 / GIF / Images) : ${ok.length}`);
  console.log(`  ⚠️  Incompatibles H.265 / HEVC (écran noir) : ${hevc.length}`);
  console.log(`  ❌ Liens cassés / Erreurs HTTP : ${broken.length}`);
  console.log('====================================================\n');

  if (hevc.length > 0) {
    console.log(`⚠️  VIDÉOS H.265 (À CONVERTIR OU RETIRER) [${hevc.length}] :`);
    hevc.forEach((h, i) => {
      const filename = decodeURIComponent(h.url.split('/').pop().split('?')[0]);
      console.log(`  ${i + 1}. ${filename}`);
      console.log(`     URL: ${h.url}`);
    });
    console.log('');
  }

  if (broken.length > 0) {
    console.log(`❌ URLS CASSÉES [${broken.length}] :`);
    broken.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.url} (${b.error})`);
    });
    console.log('');
  }

  // Sauvegarder un rapport JSON et un script SQL de nettoyage
  const report = {
    total: memes.length,
    compatibleCount: ok.length,
    hevcCount: hevc.length,
    brokenCount: broken.length,
    hevcList: hevc.map(h => h.url),
    brokenList: broken.map(b => b.url),
    compatibleList: ok.map(o => o.url),
  };

  fs.writeFileSync('audit-report.json', JSON.stringify(report, null, 2), 'utf-8');
  console.log('💾 Rapport complet enregistré dans : audit-report.json');

  // Générer un script SQL pour nettoyer le pack en 1 clic si l'utilisateur le souhaite
  if (hevc.length > 0 || broken.length > 0) {
    const badUrls = [...hevc.map(h => h.url), ...broken.map(b => b.url)];
    const sqlContent = `-- Script de nettoyage pour retirer les ${badUrls.length} mèmes incompatibles / cassés
-- Pack : ${data.name}
UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(memes) elem
  WHERE elem NOT IN (
${badUrls.map(u => `    '${u}'`).join(',\n')}
  )
)
WHERE id = '${data.id}';

-- Vérification après nettoyage
SELECT name, jsonb_array_length(memes) AS total_memes
FROM meme_packs
WHERE id = '${data.id}';
`;
    fs.writeFileSync('clean-incompatible-memes.sql', sqlContent, 'utf-8');
    console.log('🧹 Script SQL de nettoyage généré dans : clean-incompatible-memes.sql\n');
  }
}

main().catch(console.error);

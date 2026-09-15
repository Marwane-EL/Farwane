const https = require('https');
const fs = require('fs');

const url = 'https://ccqqtalmhmbslyajgmmm.supabase.co/rest/v1/meme_packs?select=*';
const options = {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcXF0YWxtaG1ic2x5YWpnbW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTkxODEsImV4cCI6MjA4ODQ5NTE4MX0.Qnt8GMwY2YM4mwQlcXSs62-_RM57BGzG9qbyLeSEQIE'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const packs = JSON.parse(data);
      let sql = '-- Seed data for meme_packs (synchronized from production)\n\n';
      for (const p of packs) {
        const memesJson = JSON.stringify(p.memes).split("'").join("''");
        const name = p.name.split("'").join("''");
        sql += `INSERT INTO meme_packs (id, name, memes, is_default, created_at)\nVALUES ('${p.id}', '${name}', '${memesJson}'::jsonb, ${p.is_default}, '${p.created_at || new Date().toISOString()}')\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, memes = EXCLUDED.memes, is_default = EXCLUDED.is_default;\n\n`;
      }
      fs.writeFileSync('supabase/seed.sql', sql, 'utf8');
      console.log(`Successfully wrote ${packs.length} packs to supabase/seed.sql`);
    } catch (err) {
      console.error('Error parsing response:', err, data);
    }
  });
}).on('error', err => console.error(err));

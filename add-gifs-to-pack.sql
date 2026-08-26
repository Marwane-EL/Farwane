-- ============================================
-- Ajouter les GIFs Tenor au pack "All Star Meme"
-- Execute this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- ============================================

-- This query appends the new Tenor URLs to the existing memes array
-- of the pack whose name contains 'all star' (case-insensitive)

UPDATE meme_packs
SET memes = memes || '[
  "https://tenor.com/view/dbz-gif-9017557420484298822",
  "https://tenor.com/view/rain-gif-13928146079595427949",
  "https://tenor.com/view/thekairi78-gif-19877427",
  "https://tenor.com/view/gamemixtreize-gif-6269784835656072759",
  "https://tenor.com/view/fortnite-tk78-gif-20174245",
  "https://tenor.com/view/alexis-sk0ma-skoma-gif-18778501",
  "https://tenor.com/view/tk78-gif-26951287",
  "https://tenor.com/view/tk78-bop-gif-17572729247078311804",
  "https://tenor.com/view/pompusinho-corneille-rabou-tk78-gif-3340780834015239882",
  "https://tenor.com/view/tk78-en-voiture-gif-21633637",
  "https://tenor.com/view/tk-78-tk78-thekairi78-laugh-laughing-gif-14352428416288924976",
  "https://tenor.com/view/tk78-harissa-meme-thekairi-tk-gif-15584203853683199862",
  "https://tenor.com/view/tk78-thekairi78-oeil-jp-jean-pormanove-gif-1509769240913118459",
  "https://tenor.com/view/tinkering-tony-stark-tony-stark-jarvis-gif-24567852",
  "https://tenor.com/view/jarvis-gif-8292242768056353320",
  "https://tenor.com/view/flight-flight-reacts-ftc-gif-10344871754903558430",
  "https://tenor.com/view/lol-rdj-juggtok-giftok-tonystark-facials-gif-3958302751287261929",
  "https://tenor.com/view/ishowspeed-jet-flying-gif-12241076576232404117",
  "https://tenor.com/view/flight-tweak-flight-tongue-fast-gif-15986476078687713201",
  "https://tenor.com/view/ishowspeed-ishowspeed-meme-driving-ishowspeed-driving-speed-gif-8241911503535454340",
  "https://tenor.com/view/ishowspeed-speed-i-show-speed-speed-stream-speed-thinking-gif-4948168091398377042",
  "https://tenor.com/view/tyuyos-ishowspeed-ishowspeed-meme-speed-speed-meme-gif-17616160487069326613",
  "https://tenor.com/view/ishowspeed-desert-speed-idiot-mario-bros-wii-gif-4579521032062283911",
  "https://tenor.com/view/ishowspeed-holding-laughter-ishowspeed-ishowspeed-early-stream-ishowspeed-clenching-ishowspeed-cheeks-gif-17758351366359844229",
  "https://tenor.com/view/ishowspeed-speed-fortnite-early-stream-reunion-gif-143982391907906686"
]'::jsonb
WHERE id = '1824f44d-4290-4ebc-b503-4875917fb329';

-- Verify the update worked:
SELECT name, jsonb_array_length(memes) as total_memes
FROM meme_packs
WHERE id = '1824f44d-4290-4ebc-b503-4875917fb329';

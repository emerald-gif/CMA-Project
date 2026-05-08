// ================================================================
// server.js — Creative Money Africa Quiz Backend
// ================================================================

const express = require('express');
const path    = require('path');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// ================================================================
// 🔑  EMAILOCTOPUS CREDENTIALS
// Paste the two values the email specialist sent you right here.
// ================================================================
const EO_API_KEY = 'YOUR_EMAILOCTOPUS_API_KEY_HERE';  // ← REPLACE THIS
const EO_LIST_ID = 'YOUR_LIST_ID_HERE';               // ← REPLACE THIS


// ================================================================
// 📝  QUIZ QUESTIONS
//
// HOW TO UPDATE WHEN REAL QUESTIONS ARRIVE:
//   1. Change "text" to the real question.
//   2. Change each option's "label" to the real answer text.
//   3. Set "points" however you want — A, B, or C can be ANY value.
//      There is NO rule that A must be highest. Mix them up freely.
//
// POINT VALUES:
//   - Most questions: max 12  (half = 6,  zero = 0)
//   - Pricing & Digital: max 14 (half = 7, zero = 0)
//   - Total possible = 100
//
// ANTI-ABUSE — points are scattered across A/B/C below so
// picking A on every question does NOT give a high score.
// When you swap in real questions, keep this same scatter pattern.
// ================================================================
const QUESTIONS = [
  {
    pillar: "Intellectual Property",
    key:    "ip",
    text:   "Have you registered the name, logo, or creative work of your business in any form?",
    options: [
      { label: "Yes — formally registered or in process",  points: 12 }, // A = HIGH
      { label: "No, but I know I should",                  points: 6  }, // B = MID
      { label: "No — I haven't thought about it",          points: 0  }  // C = ZERO
    ]
  },
  {
    pillar: "Personal Branding",
    key:    "brand",
    text:   "When someone searches your name online, what do they find?",
    options: [
      { label: "Very little — or something I'm not happy with",            points: 0  }, // A = ZERO  ← scattered
      { label: "A strong, consistent presence across multiple platforms",   points: 12 }, // B = HIGH
      { label: "Some content but nothing cohesive or recent",               points: 6  }  // C = MID
    ]
  },
  {
    pillar: "Pricing & Revenue",
    key:    "pricing",
    text:   "Do you have a written rate card or pricing structure you use consistently?",
    options: [
      { label: "Loosely — I have figures in my head",   points: 7  }, // A = MID   ← scattered
      { label: "No — I price per client or guess",      points: 0  }, // B = ZERO
      { label: "Yes — documented and I follow it",      points: 14 }  // C = HIGH
    ]
  },
  {
    pillar: "Digital Leverage",
    key:    "digital",
    text:   "Are you currently using digital platforms to generate income — not just followers?",
    options: [
      { label: "I use social media but not for direct income",       points: 0  }, // A = ZERO
      { label: "Yes — digital income is a real revenue stream",      points: 14 }, // B = HIGH  ← scattered
      { label: "I have an audience but haven't monetised it yet",    points: 7  }  // C = MID
    ]
  },
  {
    pillar: "Market Access",
    key:    "market",
    text:   "Have you sold your work or services to anyone outside your immediate city or country?",
    options: [
      { label: "I've had enquiries but nothing confirmed outside my area",  points: 6  }, // A = MID  ← scattered
      { label: "No — all my clients are local",                             points: 0  }, // B = ZERO
      { label: "Yes — I have clients or buyers in other regions",           points: 12 }  // C = HIGH
    ]
  },
  {
    pillar: "Distribution Systems",
    key:    "dist",
    text:   "Do you have a way of reaching your audience that you own completely — like an email list?",
    options: [
      { label: "No — I rely entirely on social media platforms",      points: 0  }, // A = ZERO
      { label: "Yes — email list or owned community I actively use",  points: 12 }, // B = HIGH  ← scattered
      { label: "I have some contacts but nothing systematic",         points: 6  }  // C = MID
    ]
  },
  {
    pillar: "Business Structure",
    key:    "structure",
    text:   "Do you have a formal business registration, a separate business account, or a legal business entity?",
    options: [
      { label: "Yes — registered business with separate finances",  points: 12 }, // A = HIGH
      { label: "No — everything runs through personal accounts",    points: 0  }, // B = ZERO  ← scattered
      { label: "Partially — one or the other, not both",           points: 6  }  // C = MID
    ]
  },
  {
    pillar: "Growth Mindset",
    key:    "growth",
    text:   "In the last 90 days, have you invested in your own business education — a course, book, or mentor?",
    options: [
      { label: "No — I've been focused elsewhere",                               points: 0  }, // A = ZERO  ← scattered
      { label: "I consume free content regularly but haven't paid for learning",  points: 6  }, // B = MID
      { label: "Yes — actively investing in my development",                     points: 12 }  // C = HIGH
    ]
  }
];

// Computed automatically — no need to edit these
const PMAX      = {};
QUESTIONS.forEach(q => { PMAX[q.key] = Math.max(...q.options.map(o => o.points)); });
const TOTAL_MAX = QUESTIONS.reduce((sum, q) => sum + PMAX[q.key], 0);


// ================================================================
// 🏆  BAND DEFINITIONS (server-side — never exposed to browser)
// ================================================================
const BANDS = {
  f: {
    key:   'f',
    band:  "The Creative Foundation Builder",
    title: 'Real potential — <span class="gold">a clear starting point.</span>',
    intro: "Your score shows the early structural phase of your creative business. The gaps are clear, the actions specific, and every one is fixable.",
    gap:   "Your most urgent gap is structural: IP protection and pricing confidence. Most creatives at your stage are leaving significant income uncaptured simply because they haven't formalised what they already have.",
    cta:   "Your 30-Day Foundation Plan begins today — starting with IP protection and pricing basics. One action, every day, under 20 minutes.",
    rcc:   "Your Foundation Plan Starts Now."
  },
  g: {
    key:   'g',
    band:  "The Creative Growth Accelerator",
    title: 'Foundations laid — <span class="gold">time to accelerate.</span>',
    intro: "You have the foundations in place and you're generating income. The opportunity now is distribution and digital leverage — moving from direct effort to compounding systems.",
    gap:   "The gap most limiting your revenue right now is digital leverage. You have an audience — but you may not have a system for turning that audience into consistent, scalable income.",
    cta:   "Your 30-Day Growth Plan begins today — starting with distribution systems and digital leverage.",
    rcc:   "Your Growth Plan Starts Now."
  },
  m: {
    key:   'm',
    band:  "The Creative Momentum Builder",
    title: 'Strong foundations — <span class="gold">scale the reach.</span>',
    intro: "Your score places you ahead of most African creatives in structural readiness. The ceiling from here is not effort — it's market access and monetisation sophistication.",
    gap:   "Your top opportunity is market access. You've built the systems — the next move is reaching clients, collaborators, and buyers in markets beyond where you currently operate.",
    cta:   "Your 30-Day Momentum Plan begins today — starting with market access and advanced monetisation.",
    rcc:   "Your Momentum Plan Starts Now."
  },
  l: {
    key:   'l',
    band:  "The Creative Economy Leader",
    title: "You're already ahead — <span class=\"gold\">now lead.</span>",
    intro: "You operate at a level most African creatives aspire to. The opportunity ahead is not fixing gaps — it's deepening authority and helping others find the path you've already walked.",
    gap:   "Your most valuable next move is deepening your strategic positioning and extending your influence into the communities and institutions shaping Africa's creative economy.",
    cta:   "You've unlocked the African Creative Economy Growth Playbook — and an invitation to join our inner community of leaders.",
    rcc:   "You've Unlocked the Playbook."
  }
};

function getBand(score) {
  if (score <= 40) return BANDS.f;
  if (score <= 65) return BANDS.g;
  if (score <= 85) return BANDS.m;
  return BANDS.l;
}


// ================================================================
// 📡  API: GET /api/questions
// Sends question text + option LABELS only. Zero points exposed.
// ================================================================
app.get('/api/questions', (req, res) => {
  const safe = QUESTIONS.map(q => ({
    pillar:  q.pillar,
    key:     q.key,
    text:    q.text,
    options: q.options.map(o => ({ label: o.label })) // NO points here
  }));
  res.json(safe);
});


// ================================================================
// 📡  API: POST /api/submit
// Receives: { name, email, answers: { ip: 0, brand: 1, ... } }
// "answers" values are the option INDEX the user picked (0, 1, or 2)
// Scores server-side, adds to EmailOctopus, returns results.
// ================================================================
app.post('/api/submit', async (req, res) => {
  const { name, email, answers } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  // --- Score server-side ---
  let total = 0;
  const pillars = {};

  QUESTIONS.forEach(q => {
    const idx    = answers?.[q.key];
    const points = (idx !== undefined && q.options[idx]) ? q.options[idx].points : 0;
    total += points;
    pillars[q.key] = {
      label: q.pillar,
      points,
      max: PMAX[q.key],
      pct: Math.round((points / PMAX[q.key]) * 100)
    };
  });

  const band = getBand(total);

  // --- EmailOctopus ---
  try {
    await addToEmailOctopus({ name: name || '', email, bandKey: band.key });
  } catch (err) {
    // Log but don't block user — they still see their result
    console.error('[EmailOctopus]', err.message);
  }

  res.json({
    success:  true,
    score:    total,
    totalMax: TOTAL_MAX,
    band: {
      key:   band.key,
      name:  band.band,
      title: band.title,
      intro: band.intro,
      gap:   band.gap,
      cta:   band.cta,
      rcc:   band.rcc
    },
    pillars
  });
});


// ================================================================
// 📬  EmailOctopus Helper
// ================================================================
function addToEmailOctopus({ name, email, bandKey }) {
  return new Promise((resolve, reject) => {

    const body = JSON.stringify({
      api_key:       EO_API_KEY,
      email_address: email,
      fields:        { FirstName: name },
      tags:          [bandKey],
      status:        'SUBSCRIBED'
    });

    const options = {
      hostname: 'emailoctopus.com',
      path:     `/api/1.6/lists/${EO_LIST_ID}/contacts`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, response => {
      let data = '';
      response.on('data',  chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // MEMBER_EXISTS is fine — they already subscribed before
          if (parsed.error && parsed.error.code !== 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
            reject(new Error(parsed.error.message || 'EmailOctopus API error'));
          } else {
            resolve(parsed);
          }
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}


// ================================================================
// Fallback — serve index.html for all other routes
// ================================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Creative Money Africa running on port ${PORT}`);
});

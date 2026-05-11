// ================================================================
// server.js — Creative Money Africa Quiz Backend
// ⚠️  KEEP THIS FILE PRIVATE — contains API keys and credentials
// ================================================================

const express      = require('express');
const path         = require('path');
const https        = require('https');
const admin        = require('firebase-admin');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// ================================================================
// 🔑  EMAILOCTOPUS CREDENTIALS
// Paste the values the email specialist sent you.
// ================================================================
const EO_API_KEY      = 'eo_b396d4244a43fcaf83f938649f0b505e51dd4c7aa33f75d797b7f17f2e4f8a8a';
const EO_LIST_GENERAL = '2374f062-4875-11f1-bf3a-0768bb586825';
const EO_BAND_LISTS   = {
  f: '2c6edae8-4b18-11f1-b9d2-9d82ddb5816d',  // Foundation Builder  0–40
  g: '97ef2f5c-4b18-11f1-a122-af3dc4a29929',  // Growth Accelerator  41–65
  m: 'a6a117c2-4b18-11f1-b715-9d82ddb5816d',  // Momentum Builder    66–85
  l: 'af54e63c-4b18-11f1-90ad-a176f12a4b7e',  // Economy Leader      86–100
};


// ================================================================
// 🔑  BREVO CREDENTIALS
// ================================================================
const BREVO_API_KEY   = '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';
const BREVO_TEMPLATE  = 2;                                   // Template #2
const BREVO_SENDER    = {
  name:  'Creative Money Africa',
  email: 'noreply@brevosend.com'  // ← replace with your verified domain email later
};


// ================================================================
// 🔥  FIREBASE — initialise once at startup
// ================================================================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   'cma-project-b3549',
    clientEmail: 'firebase-adminsdk-fbsvc@cma-project-b3549.iam.gserviceaccount.com',
    privateKey:  '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCva639QYdE80Rr\nwINPMHN3AF7ELc2dAxTIMvybCV9Z363duEeoZ0c+LyvNc4s2WwSHCAFAUi1bFIIN\nlynfL6Me9veOLDHixuKO6tZ8iILyQCJoQvv0CBv/B47AJ5cV+5mwhJ+wyUZ4rBdQ\nm47HzSztkjOeed50QogEg4QTJw++1GEwLP7fpdWAYcj8LG/UMcQCxi0P2ue4PmTH\nAfDp6+6Ui3LXw0FTiRc49J/Rez5NzdCqbfN5c7GH4Gv5QXTcnN5dMuCoNfGCQ6AG\nHxmAIWz/Eg1r7U87qi7WiGr1v0OV307ke2e6LSMiK9wM2K+RuUVfP75yUbDXkXJo\nxFFshz5FAgMBAAECggEADRU3EfkJ5WDORMoEEQsgRWsL5k4zNEdXTLIOyGJLz/hg\nb3WPtJXVSKQ8fFNmecySex6j9z/ZvZ37MBfKyegz3nqVTm9p3guuuHF3wyxsNbSG\nTGfYgiP7sIrIAPlC6aMM3I8bmNP+E0BkccDURn79H4/ElUhqCJowqkODvWjvoe/1\nvIZHgl1WrSapbbTbKLksucnF0zOZH3NT+WMT4SBzlg8Al7rT+aBgVmmDHpzxAMAr\nPSNxk+5w096DzP/TDmjN7hO7g8/4oBeedXYheKU1wLz3f1Y6PTZGpmS+oiEidiaR\naf/pNi/GbdyXY76MlRIjZPDL3+l7Z5yAou6/blxvOQKBgQDoQ8V3LZfVRM2wWvUw\nYKuv4GOy65R+O0jDFvlPVCM/gpknT3Na+KVRRBvjsizUBffVn7S2m0BtoXIQdFpl\n3CS4hbgQps5AIlUzcWGgjUZtlDKU1mbs1OH47cvP/0moKBrD/p6x3Osbjlzwx+Eh\nKvuEhCw67asufNXxkHUwkNQvmQKBgQDBWNJSl4wiBAQmcAvSfgVNXrVoiBt/z48L\nW5Mwy84sE93cTNtJkgKPHe4kTeroeFpjJiH9v5/4hzT75KpMukRN3PHK4iaHCeQn\n4snc5LsNxWtUD+23ylWr/qKm1RuvqDe2sZL0Q9Yx3RtwpzAhmOs3pzN5AYJC+Yp0\nFO1WMoGfjQKBgFSaWxNOSEAnD8VtXGKC1Ab8dVR2+1//uEFX3PhIbY50w9TN2/cH\nGzC+3mnSPQH+Kohl5C2f35gPdr0HpOX1imqsSp/GItq5ps9WPXl9/Glt0f7lGhiq\ncqV5+QOKugnGkflShfvDvOAMu035gMfUIEnk2zeb2v7T+hpDxGwsVR4BAoGAK7vT\nlysAX5FY/vjJM8udl2qczhA7aCWizYbhPGBdOkskG/imgXWtboHuo/eb8wmGKHcv\nqR33KVgr++41NzXKzXH0n1eYL2NlYEBEONrkFLFbHaCcvL3fsw/d6q65nHoIYCK6\ngtX1VUIWOt0WXgMg8W24jt5wgIXBc5BoPt8dwuECgYBfoWMpearEy58/P+EBA3b9\nThFf5sr/cPI33xmCUGbfqfMrORZsv//wrcVn6pALYW/Mmaq8RXEFsoEqkx+NbLZR\nBSBu8vSdbFuYqkbdEcmplenci4wWbajVLvMW3VXig7BQLBO62gpjJL9GH3mhK4nG\nVCnkFREGTQyTLtcUPZcgUg==\n-----END PRIVATE KEY-----\n'
  })
});

const db = admin.firestore();


// ================================================================
// 📝  QUIZ QUESTIONS
// ================================================================
const QUESTIONS = [
  {
    pillar: "Intellectual Property",
    key:    "ip",
    text:   "Have you registered the name, logo, or creative work of your business in any form?",
    options: [
      { label: "Yes — formally registered or in process",  points: 12 },
      { label: "No, but I know I should",                  points: 6  },
      { label: "No — I haven't thought about it",          points: 0  }
    ]
  },
  {
    pillar: "Personal Branding",
    key:    "brand",
    text:   "When someone searches your name online, what do they find?",
    options: [
      { label: "Very little — or something I'm not happy with",           points: 0  },
      { label: "A strong, consistent presence across multiple platforms",  points: 12 },
      { label: "Some content but nothing cohesive or recent",              points: 6  }
    ]
  },
  {
    pillar: "Pricing & Revenue",
    key:    "pricing",
    text:   "Do you have a written rate card or pricing structure you use consistently?",
    options: [
      { label: "Loosely — I have figures in my head",  points: 7  },
      { label: "No — I price per client or guess",     points: 0  },
      { label: "Yes — documented and I follow it",     points: 14 }
    ]
  },
  {
    pillar: "Digital Leverage",
    key:    "digital",
    text:   "Are you currently using digital platforms to generate income — not just followers?",
    options: [
      { label: "I use social media but not for direct income",     points: 0  },
      { label: "Yes — digital income is a real revenue stream",    points: 14 },
      { label: "I have an audience but haven't monetised it yet",  points: 7  }
    ]
  },
  {
    pillar: "Market Access",
    key:    "market",
    text:   "Have you sold your work or services to anyone outside your immediate city or country?",
    options: [
      { label: "I've had enquiries but nothing confirmed outside my area",  points: 6  },
      { label: "No — all my clients are local",                             points: 0  },
      { label: "Yes — I have clients or buyers in other regions",           points: 12 }
    ]
  },
  {
    pillar: "Distribution Systems",
    key:    "dist",
    text:   "Do you have a way of reaching your audience that you own completely — like an email list?",
    options: [
      { label: "No — I rely entirely on social media platforms",     points: 0  },
      { label: "Yes — email list or owned community I actively use", points: 12 },
      { label: "I have some contacts but nothing systematic",        points: 6  }
    ]
  },
  {
    pillar: "Business Structure",
    key:    "structure",
    text:   "Do you have a formal business registration, a separate business account, or a legal business entity?",
    options: [
      { label: "Yes — registered business with separate finances",  points: 12 },
      { label: "No — everything runs through personal accounts",    points: 0  },
      { label: "Partially — one or the other, not both",            points: 6  }
    ]
  },
  {
    pillar: "Growth Mindset",
    key:    "growth",
    text:   "In the last 90 days, have you invested in your own business education — a course, book, or mentor?",
    options: [
      { label: "No — I've been focused elsewhere",                              points: 0  },
      { label: "I consume free content regularly but haven't paid for learning", points: 6  },
      { label: "Yes — actively investing in my development",                    points: 12 }
    ]
  }
];

const PMAX      = {};
QUESTIONS.forEach(q => { PMAX[q.key] = Math.max(...q.options.map(o => o.points)); });
const TOTAL_MAX = QUESTIONS.reduce((sum, q) => sum + PMAX[q.key], 0);


// ================================================================
// 🏆  BAND DEFINITIONS
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
// 📡  GET /api/questions — labels only, no points
// ================================================================
app.get('/api/questions', (req, res) => {
  const safe = QUESTIONS.map(q => ({
    pillar:  q.pillar,
    key:     q.key,
    text:    q.text,
    options: q.options.map(o => ({ label: o.label }))
  }));
  res.json(safe);
});


// ================================================================
// 📡  POST /api/submit
// Scores, then fires EmailOctopus + Firebase + Brevo in parallel.
// User always gets their result — even if one service fails.
// ================================================================
app.post('/api/submit', async (req, res) => {
  const { name, email, answers } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  // Score server-side
  let total = 0;
  const pillars = {};
  QUESTIONS.forEach(q => {
    const idx    = answers?.[q.key];
    const points = (idx !== undefined && q.options[idx]) ? q.options[idx].points : 0;
    total += points;
    pillars[q.key] = {
      label:  q.pillar,
      points,
      max:    PMAX[q.key],
      pct:    Math.round((points / PMAX[q.key]) * 100)
    };
  });

  const band = getBand(total);

  // Send result to user immediately — don't wait for background tasks
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

  // Run all three services in parallel after response is sent
  // allSettled means one failure won't block the others
  const [eoResult, fbResult, brevoResult] = await Promise.allSettled([
    addToEmailOctopus({ name: name || '', email, bandKey: band.key }),
    saveToFirebase({ name: name || '', email, score: total, band, pillars }),
    sendWelcomeEmail({ name: name || '', email, score: total, bandName: band.band })
  ]);

  if (eoResult.status    === 'rejected') console.error('[EmailOctopus]', eoResult.reason?.message);
  if (fbResult.status    === 'rejected') console.error('[Firebase]',     fbResult.reason?.message);
  if (brevoResult.status === 'rejected') console.error('[Brevo]',        brevoResult.reason?.message);
});


// ================================================================
// 📬  EmailOctopus — band list + general list in parallel
// ================================================================
function addToEmailOctopus({ name, email, bandKey }) {
  function postToList(listId) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        api_key:       EO_API_KEY,
        email_address: email,
        fields:        { FirstName: name },
        status:        'SUBSCRIBED'
      });
      const options = {
        hostname: 'emailoctopus.com',
        path:     `/api/1.6/lists/${listId}/contacts`,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      };
      const req = https.request(options, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error && parsed.error.code !== 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
              reject(new Error(parsed.error.message));
            } else { resolve(parsed); }
          } catch(e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.write(body); req.end();
    });
  }
  return Promise.all([
    postToList(EO_BAND_LISTS[bandKey]),
    postToList(EO_LIST_GENERAL)
  ]);
}


// ================================================================
// 🔥  Firebase — save submission to cma_submissions collection
// ================================================================
async function saveToFirebase({ name, email, score, band, pillars }) {
  await db.collection('cma_submissions').add({
    name,
    email,
    score,
    bandKey:     band.key,
    bandName:    band.band,
    pillars,
    submittedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}


// ================================================================
// ✉️  Brevo — send personalised welcome email via Template #2
// ================================================================
function sendWelcomeEmail({ name, email, score, bandName }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      templateId: BREVO_TEMPLATE,
      to:         [{ email, name }],
      sender:     BREVO_SENDER,
      params: {
        name,
        score,
        band_name: bandName
      }
    });

    const options = {
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'Content-Type':  'application/json',
        'api-key':       BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, response => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.messageId || response.statusCode === 201) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || 'Brevo send failed'));
          }
        } catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body); req.end();
  });
}


// ================================================================
// Fallback
// ================================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CMA Quiz running on port ${PORT}`);
});

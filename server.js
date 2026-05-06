const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const validator = require('validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. SECURITY HEADERS (Helmet)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. RATE LIMITING — 200 per IP / 15 mins
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. GZIP COMPRESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(compression());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. HIDE SERVER FINGERPRINT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.disable('x-powered-by');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. PARSE INCOMING JSON (for email form)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(express.json({ limit: '10kb' })); // max 10kb — blocks oversized payloads

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. EMAIL SANITIZATION ENDPOINT
//    Ready for EmailOctopus integration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/api/subscribe', (req, res) => {
  let { email, name } = req.body;

  // --- Step 1: Check fields exist ---
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // --- Step 2: Strip whitespace & convert to string safely ---
  email = String(email).trim().toLowerCase();
  name  = name ? String(name).trim() : '';

  // --- Step 3: Validate it's a real email format ---
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // --- Step 4: Sanitize — remove any HTML/script tags ---
  email = validator.normalizeEmail(email);
  name  = validator.escape(name); // turns <script> into &lt;script&gt;

  // --- Step 5: Block disposable/temporary emails (basic list) ---
  const blockedDomains = ['mailinator.com', 'trashmail.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com'];
  const emailDomain = email.split('@')[1];
  if (blockedDomains.includes(emailDomain)) {
    return res.status(400).json({ error: 'Please use a real email address.' });
  }

  // --- Step 6: All clean — ready for EmailOctopus ---
  // TODO: Connect EmailOctopus here when ready
  // POST to EmailOctopus API with { email, name }
  console.log(`Clean email received: ${email} | Name: ${name}`);

  return res.status(200).json({ success: true, message: 'You\'re in!' });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. STATIC FILES WITH CACHING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. CATCH-ALL ROUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. GLOBAL ERROR HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).send('Something went wrong. Please try again.');
});

app.listen(PORT, () => {
  console.log(`Creative Money Africa running on port ${PORT}`);
});

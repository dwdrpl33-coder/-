/* ==========================================================================
   המילטון עיצוב — script.js
   Public site rendering, WhatsApp/contact form, and Supabase-backed admin panel.
   ========================================================================== */

/* ---------- CONFIG: fill these in ---------- */
// מספר הוואטסאפ העסקי בפורמט בינלאומי ללא + או 00, לדוגמה "972501234567"
const WHATSAPP_NUMBER = "972552876019";

// כתובת ה-webhook של n8n שמקבל את פניות הטופס
const N8N_WEBHOOK_URL = "https://n8n-production-3818.up.railway.app/webhook/df88f21d-6a5b-4a72-bc00-bf236b8af24c";

// פרטי חיבור ל-Supabase (Project URL + anon/public key)
const SUPABASE_URL = "https://ufqciiyrbwfagnhtnumv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kGt1EGBE1ynB-TzaqZZftA_xNarkDn8";

/* ---------- Supabase client ---------- */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Default (fallback) content ----------
   Used until Supabase responds, and if the connection fails entirely. */
const DEFAULT_CONTENT = {
  hero: {
    title: "בית שמספר\nאת הסיפור שלכם",
    subtitle: "רהיטים בעבודת יד מעץ מלא, בגימור אישי שנשאר לדורות."
  },
  about: {
    title: "מסדנה קטנה בפלורנטין, לבית שלכם",
    text: "המילטון עיצוב נולדה ב-2012 מתוך סדנת נגרות קטנה בשכונת פלורנטין, כשהמייסד עומר המילטון החליט שהוא לא מוכן להתפשר על רהיט שנקנה — רק על רהיט שנוצר.\nכל פריט אצלנו נבנה ביד, מעץ מלא ואיכותי בלבד, ועובר תהליך גימור המשלב מסורת נגרות אירופאית עם קווים נקיים וישראליים. אנחנו לא מייצרים בסדרות — אנחנו מלווים כל לקוח מהסקיצה הראשונה ועד לרגע שהרהיט נכנס הביתה.\nהיום הסטודיו שלנו מעסיק צוות נגרים ומעצבים שחולקים את אותה שאיפה: רהיטים שלא רק נראים טוב, אלא מזדקנים יפה — ונשארים בבית הרבה אחרי שהטרנדים מתחלפים."
  },
  theme: {
    primary: "#6b4f3b",
    secondary: "#b8935f"
  },
  products: [
    { id: "nova", name: 'ספת "נובה" תלת מושבית', price: "7,890", description: "בד בוקלה קרם על מסגרת עץ אלון מלא, רגלי עץ טורנד.", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80" },
    { id: "kidron", name: 'שולחן אוכל "קדרון"', price: "5,450", description: "עץ אלון מלא בגימור שמן טבעי, ל-8 סועדים.", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80" },
    { id: "alon", name: 'כורסת "אלון"', price: "3,200", description: "עור טבעי בגוון קוניאק, מסגרת עץ אלון גלויה.", image: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80" },
    { id: "tavor", name: 'מזנון "טבעון"', price: "4,750", description: "עץ אגוז עם ידיות פליז מוברש, שלוש דלתות.", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80" },
    { id: "yaara", name: 'שולחן קפה "יערה"', price: "1,980", description: "עץ זית מלא ומשטח שיש טבעי.", image: "https://images.unsplash.com/photo-1592229505726-ca121723b8ef?auto=format&fit=crop&w=800&q=80" },
    { id: "choresh", name: 'מיטה זוגית "חורש"', price: "6,300", description: "מסגרת עץ מלא, ראש מיטה מרופד בבד פשתן.", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80" },
    { id: "dafna", name: 'כיסא אוכל "דפנה" (זוג)', price: "2,150", description: "עץ אלון ובד פשתן טבעי, נמכר בזוגות.", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80" },
    { id: "zayit", name: 'ארונית לילה "זית"', price: "1,450", description: "עץ זית מלא בגימור שמן, מגירה אחת.", image: "https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&w=800&q=80" }
  ]
};

/* current in-memory content (overwritten by Supabase on load / after saves) */
let siteContent = JSON.parse(JSON.stringify(DEFAULT_CONTENT));

/* ==========================================================================
   Rendering
   ========================================================================== */
function renderHero(hero) {
  document.getElementById("hero-title").innerHTML = hero.title.replace(/\n/g, "<br>");
  document.getElementById("hero-subtitle").textContent = hero.subtitle;
}

function renderAbout(about) {
  document.getElementById("about-title").textContent = about.title;
  const container = document.getElementById("about-text");
  container.innerHTML = about.text
    .split("\n")
    .filter(p => p.trim().length)
    .map(p => `<p>${p}</p>`)
    .join("");
}

function applyTheme(theme) {
  document.documentElement.style.setProperty("--color-primary", theme.primary);
  document.documentElement.style.setProperty("--color-secondary", theme.secondary);
  // Darker shade for hover states, derived from the primary color
  document.documentElement.style.setProperty("--color-primary-dark", shadeColor(theme.primary, -14));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function renderProducts(products) {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = products.map(p => {
    const active = interestList.includes(p.id);
    return `
    <article class="product-card reveal">
      <div class="product-image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <span class="product-price">₪${escapeHtml(p.price)}</span>
        <button class="btn-interest${active ? " active" : ""}" data-interest-toggle="${escapeHtml(p.id)}">
          ${active ? "✓ ברשימת העניין" : "+ הוספה לרשימת העניין"}
        </button>
      </div>
    </article>
  `;
  }).join("");
  observeReveal();
}

function renderAll(content) {
  renderHero(content.hero);
  renderAbout(content.about);
  applyTheme(content.theme);
  renderProducts(content.products);
}

/* ==========================================================================
   Load content from Supabase (falls back to DEFAULT_CONTENT on any failure)
   ========================================================================== */
async function loadSiteContent() {
  try {
    const { data, error } = await supabaseClient.from("site_content").select("key, value");
    if (error) throw error;
    if (data && data.length) {
      data.forEach(row => {
        if (row.key in siteContent) siteContent[row.key] = row.value;
      });
    }
  } catch (err) {
    console.warn("לא ניתן היה לטעון תוכן מ-Supabase, נעשה שימוש בתוכן ברירת המחדל:", err.message);
  }
  renderAll(siteContent);
  populateAdminForm();
}

/* ==========================================================================
   Scroll reveal animation
   ========================================================================== */
let revealObserver;
function observeReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
  }
  document.querySelectorAll(".reveal:not(.in-view)").forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   Header / mobile nav
   ========================================================================== */
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");
navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => mainNav.classList.remove("open"));
});

/* ==========================================================================
   WhatsApp floating button
   ========================================================================== */
function setupWhatsApp() {
  const message = "היי, אשמח לשמוע פרטים נוספים על הרהיטים של המילטון עיצוב";
  const link = document.getElementById("whatsapp-float");
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* ==========================================================================
   Contact form -> n8n webhook
   ========================================================================== */
const contactForm = document.getElementById("contact-form");
const contactFeedback = document.getElementById("form-feedback");
const contactSubmitBtn = document.getElementById("contact-submit");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("field-name").value.trim(),
    phone: document.getElementById("field-phone").value.trim(),
    email: document.getElementById("field-email").value.trim(),
    message: document.getElementById("field-message").value.trim(),
    timestamp: new Date().toISOString()
  };

  setFormFeedback(contactFeedback, "שולח את הפנייה...", "loading");
  contactSubmitBtn.disabled = true;

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("שגיאת שרת");
    setFormFeedback(contactFeedback, "הפנייה נשלחה בהצלחה! נחזור אליכם בהקדם.", "success");
    contactForm.reset();
  } catch (err) {
    setFormFeedback(contactFeedback, "משהו השתבש בשליחה. אפשר לנסות שוב, או ליצור קשר בוואטסאפ.", "error");
  } finally {
    contactSubmitBtn.disabled = false;
  }
});

function setFormFeedback(el, text, type) {
  el.textContent = text;
  el.className = "form-feedback " + type;
}

/* ==========================================================================
   Interest list — lightweight "wishlist" for browsing/comparing products.
   No cart/checkout: this is a lead-gen tool, sends the selection via the
   existing contact form (n8n) or WhatsApp, not a real purchase flow.
   ========================================================================== */
const INTEREST_STORAGE_KEY = "hamilton-interest-list";
let interestList = loadInterestList();

function loadInterestList() {
  try {
    const raw = localStorage.getItem(INTEREST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveInterestList() {
  localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(interestList));
}

function toggleInterest(productId) {
  const idx = interestList.indexOf(productId);
  if (idx >= 0) interestList.splice(idx, 1);
  else interestList.push(productId);
  saveInterestList();
  updateInterestButton(productId);
  renderInterestBadge();
  renderInterestPanel();
}

function updateInterestButton(productId) {
  const btn = document.querySelector(`[data-interest-toggle="${productId}"]`);
  if (!btn) return;
  const active = interestList.includes(productId);
  btn.classList.toggle("active", active);
  btn.textContent = active ? "✓ ברשימת העניין" : "+ הוספה לרשימת העניין";
}

function getInterestProducts() {
  return siteContent.products.filter(p => interestList.includes(p.id));
}

function renderInterestBadge() {
  document.getElementById("interest-count").textContent = interestList.length;
}

function renderInterestPanel() {
  const body = document.getElementById("interest-panel-body");
  const items = getInterestProducts();
  if (!items.length) {
    body.innerHTML = `<p class="interest-empty">עדיין לא הוספתם פריטים. לחצו על "הוספה לרשימת העניין" בכרטיס המוצר.</p>`;
    return;
  }
  body.innerHTML = items.map(p => `
    <div class="interest-item">
      <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">
      <div class="interest-item-info">
        <strong>${escapeHtml(p.name)}</strong>
        <span>₪${escapeHtml(p.price)}</span>
      </div>
      <button class="interest-item-remove" data-interest-remove="${escapeHtml(p.id)}" aria-label="הסרה">✕</button>
    </div>
  `).join("");
}

function buildInterestMessage() {
  const items = getInterestProducts();
  const lines = items.map(p => `- ${p.name} (₪${p.price})`);
  return `היי, אשמח לקבל הצעת מחיר עבור הפריטים הבאים:\n${lines.join("\n")}`;
}

const interestFloatBtn = document.getElementById("interest-float");
const interestPanel = document.getElementById("interest-panel");
const interestPanelBackdrop = document.getElementById("interest-panel-backdrop");
const interestPanelClose = document.getElementById("interest-panel-close");
const productsGrid = document.getElementById("products-grid");

function openInterestPanel() {
  interestPanel.hidden = false;
  interestPanelBackdrop.hidden = false;
  setTimeout(() => interestPanel.setAttribute("data-open", "true"), 10);
  renderInterestPanel();
}
function closeInterestPanel() {
  interestPanel.setAttribute("data-open", "false");
  setTimeout(() => { interestPanel.hidden = true; interestPanelBackdrop.hidden = true; }, 400);
}

interestFloatBtn.addEventListener("click", openInterestPanel);
interestPanelClose.addEventListener("click", closeInterestPanel);
interestPanelBackdrop.addEventListener("click", closeInterestPanel);

// Event delegation: the products grid is re-rendered on load/admin save,
// so we bind once on the static container rather than per product-card.
productsGrid.addEventListener("click", (e) => {
  const toggleBtn = e.target.closest("[data-interest-toggle]");
  if (toggleBtn) toggleInterest(toggleBtn.getAttribute("data-interest-toggle"));
});

document.getElementById("interest-panel-body").addEventListener("click", (e) => {
  const removeBtn = e.target.closest("[data-interest-remove]");
  if (removeBtn) toggleInterest(removeBtn.getAttribute("data-interest-remove"));
});

document.getElementById("interest-clear").addEventListener("click", () => {
  interestList = [];
  saveInterestList();
  renderProducts(siteContent.products);
  renderInterestBadge();
  renderInterestPanel();
});

document.getElementById("interest-send-form").addEventListener("click", () => {
  if (!getInterestProducts().length) return;
  document.getElementById("field-message").value = buildInterestMessage();
  closeInterestPanel();
  document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  document.getElementById("field-name").focus();
});

document.getElementById("interest-send-whatsapp").addEventListener("click", () => {
  if (!getInterestProducts().length) return;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildInterestMessage())}`;
  window.open(url, "_blank", "noopener");
});

/* ==========================================================================
   Admin: login modal
   ========================================================================== */
const adminEntryBtn = document.getElementById("admin-entry");
const adminLoginOverlay = document.getElementById("admin-login-overlay");
const adminLoginClose = document.getElementById("admin-login-close");
const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginFeedback = document.getElementById("admin-login-feedback");

adminEntryBtn.addEventListener("click", () => {
  adminLoginOverlay.hidden = false;
});
adminLoginClose.addEventListener("click", () => {
  adminLoginOverlay.hidden = true;
});

adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  setFormFeedback(adminLoginFeedback, "מתחבר...", "loading");

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setFormFeedback(adminLoginFeedback, "התחברות נכשלה: " + error.message, "error");
    return;
  }
  setFormFeedback(adminLoginFeedback, "התחברת בהצלחה!", "success");
  adminLoginForm.reset();
  setTimeout(() => { adminLoginOverlay.hidden = true; }, 500);
});

/* ==========================================================================
   Admin: panel open/close + auth state
   ========================================================================== */
const adminPanel = document.getElementById("admin-panel");
const adminPanelBackdrop = document.getElementById("admin-panel-backdrop");
const adminPanelClose = document.getElementById("admin-panel-close");
const adminLogoutBtn = document.getElementById("admin-logout");

function showAdminPanel() {
  adminPanel.hidden = false;
  adminPanelBackdrop.hidden = false;
  setTimeout(() => adminPanel.setAttribute("data-open", "true"), 10);
  populateAdminForm();
}
function hideAdminPanel() {
  adminPanel.setAttribute("data-open", "false");
  setTimeout(() => { adminPanel.hidden = true; adminPanelBackdrop.hidden = true; }, 400);
}
adminPanelClose.addEventListener("click", hideAdminPanel);
adminPanelBackdrop.addEventListener("click", hideAdminPanel);
adminLogoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  hideAdminPanel();
});

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    adminEntryBtn.textContent = "פאנל ניהול";
    adminEntryBtn.onclick = showAdminPanel;
  } else {
    adminEntryBtn.textContent = "כניסת מנהל";
    adminEntryBtn.onclick = () => { adminLoginOverlay.hidden = false; };
    adminPanel.hidden = true;
    adminPanelBackdrop.hidden = true;
  }
});

/* ==========================================================================
   Admin: populate + save each content section
   ========================================================================== */
function populateAdminForm() {
  document.getElementById("edit-hero-title").value = siteContent.hero.title;
  document.getElementById("edit-hero-subtitle").value = siteContent.hero.subtitle;
  document.getElementById("edit-about-title").value = siteContent.about.title;
  document.getElementById("edit-about-text").value = siteContent.about.text;
  document.getElementById("edit-theme-primary").value = siteContent.theme.primary;
  document.getElementById("edit-theme-secondary").value = siteContent.theme.secondary;
  renderAdminProducts();
}

function renderAdminProducts() {
  const list = document.getElementById("edit-products-list");
  list.innerHTML = siteContent.products.map((p, i) => `
    <div class="admin-product-item" data-index="${i}">
      <div class="product-index">מוצר ${i + 1}</div>
      <label>שם</label>
      <input type="text" class="p-name" value="${escapeHtml(p.name)}">
      <label>מחיר (₪)</label>
      <input type="text" class="p-price" value="${escapeHtml(p.price)}">
      <label>תיאור</label>
      <textarea class="p-description" rows="2">${escapeHtml(p.description)}</textarea>
      <label>קישור לתמונה</label>
      <input type="url" class="p-image" value="${escapeHtml(p.image)}">
      <label>או העלאת קובץ מהמחשב (מחליף את הקישור למעלה)</label>
      <input type="file" class="p-image-upload" accept="image/*">
      <div class="form-feedback" data-upload-feedback></div>
    </div>
  `).join("");
}

/* ==========================================================================
   Admin: image upload to Supabase Storage (bucket "product-images")
   ========================================================================== */
document.getElementById("edit-products-list").addEventListener("change", async (e) => {
  const fileInput = e.target.closest(".p-image-upload");
  if (!fileInput || !fileInput.files.length) return;

  const file = fileInput.files[0];
  const item = fileInput.closest(".admin-product-item");
  const urlInput = item.querySelector(".p-image");
  const feedbackEl = item.querySelector("[data-upload-feedback]");

  setFormFeedback(feedbackEl, "מעלה תמונה...", "loading");

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    setFormFeedback(feedbackEl, "שגיאה בהעלאה: " + uploadError.message, "error");
    return;
  }

  const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
  urlInput.value = data.publicUrl;
  setFormFeedback(feedbackEl, 'הועלה בהצלחה ✓ לחצו "שמירת מוצרים" למטה כדי לשמור', "success");
  fileInput.value = "";
});

async function saveSection(key, value, feedbackEl) {
  setFormFeedback(feedbackEl, "שומר...", "loading");
  const { error } = await supabaseClient
    .from("site_content")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    setFormFeedback(feedbackEl, "שגיאה בשמירה: " + error.message, "error");
    return;
  }
  siteContent[key] = value;
  renderAll(siteContent);
  setFormFeedback(feedbackEl, "נשמר בהצלחה ✓", "success");
}

document.querySelectorAll("[data-save]").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-save");
    const feedbackEl = document.querySelector(`[data-feedback="${key}"]`);

    if (key === "hero") {
      saveSection("hero", {
        title: document.getElementById("edit-hero-title").value,
        subtitle: document.getElementById("edit-hero-subtitle").value
      }, feedbackEl);
    }

    if (key === "about") {
      saveSection("about", {
        title: document.getElementById("edit-about-title").value,
        text: document.getElementById("edit-about-text").value
      }, feedbackEl);
    }

    if (key === "theme") {
      saveSection("theme", {
        primary: document.getElementById("edit-theme-primary").value,
        secondary: document.getElementById("edit-theme-secondary").value
      }, feedbackEl);
    }

    if (key === "products") {
      const items = Array.from(document.querySelectorAll(".admin-product-item")).map((el, i) => ({
        id: siteContent.products[i]?.id || `product-${i}`,
        name: el.querySelector(".p-name").value,
        price: el.querySelector(".p-price").value,
        description: el.querySelector(".p-description").value,
        image: el.querySelector(".p-image").value
      }));
      saveSection("products", items, feedbackEl);
    }
  });
});

/* ==========================================================================
   Init
   ========================================================================== */
document.getElementById("footer-year").textContent = new Date().getFullYear();
setupWhatsApp();
observeReveal();
renderInterestBadge();
loadSiteContent();

// If an admin is already logged in on page load, reveal the entry point immediately
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) {
    adminEntryBtn.textContent = "פאנל ניהול";
    adminEntryBtn.onclick = showAdminPanel;
  }
});

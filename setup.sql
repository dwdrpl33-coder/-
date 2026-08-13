-- ============================================================================
-- המילטון עיצוב — Supabase setup
-- הריצו את כל הקובץ הזה פעם אחת ב-Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- 1) טבלת התוכן הדינמי של האתר
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2) הפעלת Row Level Security
alter table public.site_content enable row level security;

-- קריאה פתוחה לכולם (כדי שהאתר יטען תוכן לכל מבקר, גם בלי התחברות)
drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (true);

-- כתיבה (עדכון) מותרת רק למשתמשים מאומתים (מנהלי האתר)
drop policy if exists "Authenticated can update site content" on public.site_content;
create policy "Authenticated can update site content"
  on public.site_content
  for update
  to authenticated
  using (true)
  with check (true);

-- הוספת שורות חדשות מותרת גם היא רק למאומתים (נדרש עבור upsert)
drop policy if exists "Authenticated can insert site content" on public.site_content;
create policy "Authenticated can insert site content"
  on public.site_content
  for insert
  to authenticated
  with check (true);

-- 3) תוכן ברירת מחדל — תואם למבנה שסקריפט האתר (script.js) מצפה לו
insert into public.site_content (key, value) values
(
  'hero',
  '{
    "title": "בית שמספר\nאת הסיפור שלכם",
    "subtitle": "רהיטים בעבודת יד מעץ מלא, בגימור אישי שנשאר לדורות."
  }'::jsonb
),
(
  'about',
  '{
    "title": "מסדנה קטנה בפלורנטין, לבית שלכם",
    "text": "המילטון עיצוב נולדה ב-2012 מתוך סדנת נגרות קטנה בשכונת פלורנטין, כשהמייסד עומר המילטון החליט שהוא לא מוכן להתפשר על רהיט שנקנה — רק על רהיט שנוצר.\nכל פריט אצלנו נבנה ביד, מעץ מלא ואיכותי בלבד, ועובר תהליך גימור המשלב מסורת נגרות אירופאית עם קווים נקיים וישראליים. אנחנו לא מייצרים בסדרות — אנחנו מלווים כל לקוח מהסקיצה הראשונה ועד לרגע שהרהיט נכנס הביתה.\nהיום הסטודיו שלנו מעסיק צוות נגרים ומעצבים שחולקים את אותה שאיפה: רהיטים שלא רק נראים טוב, אלא מזדקנים יפה — ונשארים בבית הרבה אחרי שהטרנדים מתחלפים."
  }'::jsonb
),
(
  'theme',
  '{
    "primary": "#6b4f3b",
    "secondary": "#b8935f"
  }'::jsonb
),
(
  'products',
  '[
    { "id": "nova", "name": "ספת \"נובה\" תלת מושבית", "price": "7,890", "description": "בד בוקלה קרם על מסגרת עץ אלון מלא, רגלי עץ טורנד.", "image": "https://picsum.photos/seed/hamilton-sofa-nova/600/450" },
    { "id": "kidron", "name": "שולחן אוכל \"קדרון\"", "price": "5,450", "description": "עץ אלון מלא בגימור שמן טבעי, ל-8 סועדים.", "image": "https://picsum.photos/seed/hamilton-table-kidron/600/450" },
    { "id": "alon", "name": "כורסת \"אלון\"", "price": "3,200", "description": "עור טבעי בגוון קוניאק, מסגרת עץ אלון גלויה.", "image": "https://picsum.photos/seed/hamilton-armchair-alon/600/450" },
    { "id": "tavor", "name": "מזנון \"טבעון\"", "price": "4,750", "description": "עץ אגוז עם ידיות פליז מוברש, שלוש דלתות.", "image": "https://picsum.photos/seed/hamilton-sideboard-tavor/600/450" },
    { "id": "yaara", "name": "שולחן קפה \"יערה\"", "price": "1,980", "description": "עץ זית מלא ומשטח שיש טבעי.", "image": "https://picsum.photos/seed/hamilton-coffee-yaara/600/450" },
    { "id": "choresh", "name": "מיטה זוגית \"חורש\"", "price": "6,300", "description": "מסגרת עץ מלא, ראש מיטה מרופד בבד פשתן.", "image": "https://picsum.photos/seed/hamilton-bed-choresh/600/450" },
    { "id": "dafna", "name": "כיסא אוכל \"דפנה\" (זוג)", "price": "2,150", "description": "עץ אלון ובד פשתן טבעי, נמכר בזוגות.", "image": "https://picsum.photos/seed/hamilton-chair-dafna/600/450" },
    { "id": "zayit", "name": "ארונית לילה \"זית\"", "price": "1,450", "description": "עץ זית מלא בגימור שמן, מגירה אחת.", "image": "https://picsum.photos/seed/hamilton-nightstand-zayit/600/450" }
  ]'::jsonb
)
on conflict (key) do nothing;

-- ============================================================================
-- 4) יצירת משתמש מנהל — יש לבצע ידנית ב-Dashboard (לא דרך SQL):
--    Supabase Dashboard → Authentication → Users → Add user → Create new user
--    מלאו אימייל וסיסמה, ואשרו את המשתמש (Auto Confirm User).
--    זהו המשתמש שאיתו תתחברו בכפתור "כניסת מנהל" בפוטר האתר.
-- ============================================================================

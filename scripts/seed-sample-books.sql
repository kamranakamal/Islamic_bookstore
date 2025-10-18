-- Sample data seed for core scholars
-- Run manually against the Supabase database once the schema is in place.

with cat_quran as (
  select id from public.categories where slug = 'quran-tafseer'
), cat_hadith as (
  select id from public.categories where slug = 'hadith-collection'
), cat_seerah as (
  select id from public.categories where slug = 'seerah'
)
insert into public.books (
  title,
  author,
  page_count,
  available_formats,
  available_languages,
  stock_quantity,
  price_local_inr,
  price_international_usd,
  description,
  category_id,
  is_featured
)
select
  details.title,
  details.author,
  details.page_count,
  details.available_formats,
  details.available_languages,
  details.stock_quantity,
  details.price_local_inr,
  details.price_international_usd,
  details.description,
  details.category_id,
  details.is_featured
from (
  select
    'The Correct Creed and the Invalidators of Islam'::text as title,
    'Shaykh ''Abdul ''Aziz bin Baz'::text as author,
    176::integer as page_count,
    array['Hardcover','Paperback']::text[] as available_formats,
    array['english']::text[] as available_languages,
    40::integer as stock_quantity,
  1299.00::numeric(10,2) as price_local_inr,
    24.00::numeric(10,2) as price_international_usd,
    'A concise presentation of the pillars of iman, shirk, and the nullifiers of Islam with practical guidance for students.'::text as description,
    (select id from cat_quran) as category_id,
    true as is_featured
  union all
  select
    'Silsilah Al-Ahadith As-Saheehah (Selections)'::text,
    'Imam Muhammad Nasiruddin al-Albani'::text,
    320::integer,
    array['Paperback']::text[],
    array['english']::text[],
    25::integer,
  1549.00::numeric(10,2),
    28.00::numeric(10,2),
    'Curated authentic narrations with brief gradings and benefits for the serious seeker of Sunnah.'::text,
    (select id from cat_hadith),
    false
  union all
  select
    'Beneficial Points from Imam Al-Fawzan''s Lessons'::text,
    'Shaykh Salih al-Fawzan'::text,
    210::integer,
    array['Paperback','Digital']::text[],
    array['english']::text[],
    30::integer,
  999.00::numeric(10,2),
    20.00::numeric(10,2),
    'Highlights from the Saudi senior scholar''s lectures covering creed, worship, and methodology for contemporary audiences.'::text,
    (select id from cat_seerah),
    false
) as details
where not exists (
  select 1 from public.books existing where existing.title = details.title
);

BEGIN;

-- ── Reflections book ──────────────────────────────────────────────────────────
-- A space for poems, prose reflections, and curated quotes organized by theme.
-- Separate from the Acts Bible study series so it shows as its own entry on
-- the home page. display_order=2 puts it after Acts.

INSERT INTO public.books (id, title, slug, description, display_order, is_published)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'Reflections',
  'reflections',
  'Poems, prose, and curated quotes on faith, frailty, and God''s redeeming work',
  2,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published;

-- ── Chapters ─────────────────────────────────────────────────────────────────
INSERT INTO public.chapters
  (book_id, id, title, chapter_number, description, display_order, is_published)
VALUES
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000025', 'God''s Shaping Hand', 1, 'Reflections — On how God molds us through trials, failure, and frailty', 1, true)
ON CONFLICT (id) DO UPDATE SET
  title          = EXCLUDED.title,
  description    = EXCLUDED.description,
  chapter_number = EXCLUDED.chapter_number,
  display_order  = EXCLUDED.display_order,
  is_published   = EXCLUDED.is_published;

-- ── Sessions ─────────────────────────────────────────────────────────────────
INSERT INTO public.sessions
  (id, chapter_id, title, session_number, scripture_reference, content,
   display_order, is_published, published_at)
VALUES
  ('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000025', 'When God Wants to Drill a Man', 1, 'Jeremiah 18:1-6', '<p><em>Encountered in a sermon by <strong>Pastor Charles Price</strong>, "Human Frailty &amp; Spiritual Gifts" — Lead Pastor of The People''s Church, Toronto, Canada.</em></p><hr><blockquote><p>When God wants to drill a man,<br>And thrill a man,<br>And skill a man<br>When God wants to mold a man<br>To play the noblest part;</p><p>When He yearns with all His heart<br>To create so great and bold a man<br>That all the world shall be amazed,<br>Watch His methods, watch His ways!</p><p>How He ruthlessly perfects<br>Whom He royally elects!<br>How He hammers him and hurts him,<br>And with mighty blows converts him</p><p>Into trial shapes of clay which<br>Only God understands;<br>While his tortured heart is crying<br>And he lifts beseeching hands!</p><p>How He bends but never breaks<br>When his good He undertakes;<br>How He uses whom He chooses,<br>And with every purpose fuses him;<br>By every act induces him<br>To try His splendor out—<br>God knows what He''s about.</p><p>—<em>Anonymous</em></p></blockquote><hr><h2>Man''s Value</h2><blockquote><p>"We tend to get the wrong impression that our value to God lies on what we do."</p></blockquote><blockquote><p>"What God is interested in is not what we can do or what he enables us to do — <strong>He is very interested in what we are.</strong>"</p></blockquote><hr><h2>Equipping</h2><blockquote><p>"God sees life from the beginning to the end and equips us accordingly."</p></blockquote><hr><h2>Redemption &amp; Being Used by God</h2><blockquote><p>"When man comes and gives his life to God, He doesn''t simply forgive them of their sins and then try and bury all the nasty bits and the dirty bits and embarrassing bits and the bits that we don''t like. <strong>He actually redeems even the bad bits and makes them useful.</strong>"</p></blockquote><blockquote><p>"Embrace circumstances as friends under the redeeming work of Jesus Christ and quit complaining about them."</p></blockquote><blockquote><p>"If God is going to use us, it''s not just giving us things to do — <strong>it''s molding who we are that is sometimes painful.</strong>"</p></blockquote><hr><h2>The Aristocracy of Heaven</h2><p>The Aristocracy of Heaven is going to be made up of <em>interesting people</em>.</p><ul><li>A murderer whose name is <strong>Moses</strong>.</li><li>An adulterer whose name is <strong>David</strong>.</li><li>A liar whose name is <strong>Abraham</strong>.</li><li>A polygamist whose name is <strong>Solomon</strong>.</li><li>A cursing coward whose name is <strong>Peter</strong>.</li><li>A sex maniac whose name is <strong>Samson</strong>.</li><li>An anti-Christian terrorist whose name is <strong>Saul</strong>.</li></ul><p>Their self-inflicted wounds were brought, forgiven and cleansed — they were still part of these men''s history, but became the very means whereby they are able to be a blessing to other people.</p>', 1, true, now())
ON CONFLICT (id) DO UPDATE SET
  title               = EXCLUDED.title,
  scripture_reference = EXCLUDED.scripture_reference,
  content             = EXCLUDED.content,
  session_number      = EXCLUDED.session_number,
  display_order       = EXCLUDED.display_order,
  is_published        = EXCLUDED.is_published;

COMMIT;

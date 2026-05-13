-- Seed: Create a test admin user
-- This creates a user in Supabase Auth and a matching profile.
-- Login via Supabase Studio (http://127.0.0.1:54323) or use email/password auth locally.

-- Create auth user (password: admin123)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, aud, role,
  email_change, email_change_token_new, email_change_token_current,
  phone, phone_change, phone_change_token,
  recovery_token, reauthentication_token,
  is_sso_user, is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@bible-study.local',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Admin User"}',
  now(), now(), '', 'authenticated', 'authenticated',
  '', '', '',
  '', '', '',
  '', '',
  false, false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@bible-study.local"}',
  'email', '00000000-0000-0000-0000-000000000001',
  now(), now(), now()
);

-- Create/update profile as admin + approved
INSERT INTO public.profiles (id, email, display_name, role, is_approved) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@bible-study.local', 'Admin User', 'admin', true)
ON CONFLICT (id) DO UPDATE SET role = 'admin', is_approved = true, display_name = 'Admin User';

-- Seed: Sample book with chapters and sessions
INSERT INTO public.books (id, title, slug, description, display_order, is_published) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Acts', 'acts', 'A study through the book of Acts', 1, true);

INSERT INTO public.chapters (id, book_id, title, chapter_number, description, display_order, is_published) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'The Promise of the Holy Spirit', 1, 'Acts 1:1-11 — Jesus ascends and promises the Spirit', 1, true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'The Day of Pentecost', 2, 'Acts 2 — The Spirit comes', 2, true);

INSERT INTO public.sessions (id, chapter_id, title, session_number, scripture_reference, content, display_order, is_published, published_at) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Introduction to Acts', 1, 'Acts 1:1-5',
   '<h1>Introduction to the Book of Acts</h1><p>The book of Acts is the second volume of Luke''s two-part work, continuing the story from his Gospel.</p><h2>Author and Date</h2><p>Written by <strong>Luke</strong>, a physician and companion of Paul, likely between AD 62-64.</p><h2>Key Themes</h2><ul><li>The work of the Holy Spirit</li><li>The spread of the Gospel from Jerusalem to Rome</li><li>The growth of the early church</li></ul><blockquote><p>But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth. — Acts 1:8</p></blockquote><h2>Structure of the Book</h2><p>Acts can be divided into two major sections:</p><ol><li><strong>Chapters 1-12:</strong> The church in Jerusalem (Peter''s ministry)</li><li><strong>Chapters 13-28:</strong> The church to the world (Paul''s missionary journeys)</li></ol><hr><h3>Discussion Questions</h3><p>As you read through Acts 1:1-5, consider:</p><ul><li>What does it mean to be a witness?</li><li>How does the Holy Spirit empower believers today?</li></ul>',
   1, true, now()),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'The Ascension', 2, 'Acts 1:6-11',
   '<h1>The Ascension of Jesus</h1><p>After forty days of post-resurrection appearances, Jesus ascends to heaven.</p><h2>The Disciples'' Question</h2><p>The disciples ask: <em>"Lord, are you at this time going to restore the kingdom to Israel?"</em></p><p>Jesus redirects their focus from political restoration to spiritual mission.</p><h2>The Promise</h2><blockquote><p>This same Jesus, who has been taken from you into heaven, will come back in the same way you have seen him go into heaven. — Acts 1:11</p></blockquote>',
   2, true, now()),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'The Coming of the Spirit', 1, 'Acts 2:1-13',
   '<h1>The Day of Pentecost</h1><p>When the day of Pentecost came, they were all together in one place.</p><h2>What Happened</h2><ol><li>A sound like a violent wind filled the house</li><li>Tongues of fire appeared on each of them</li><li>They began speaking in other languages</li></ol><h2>The Crowd''s Reaction</h2><p>Some were <strong>amazed</strong> — "Are not all these who are speaking Galileans?"</p><p>Others <strong>mocked</strong> — "They have had too much wine."</p>',
   1, true, now());

-- Sample Forum Posts for Nautix
-- Create realistic sample posts for testing and demonstration

-- Note: Replace 'YOUR_USER_ID' with an actual user ID from your auth.users table
-- You can get a user ID by running: SELECT id FROM auth.users LIMIT 1;

-- Sample Post 1: Generelt category
INSERT INTO forum_posts (user_id, category_id, title, content, view_count, like_count, is_pinned)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM forum_categories WHERE slug = 'generelt'),
  'Velkommen til Nautix Forum! 🎉',
  '<p>Hei alle sammen!</p><p>Jeg vil ønske alle velkommen til det nye Nautix forumet. Dette er et sted hvor vi kan dele erfaringer, stille spørsmål og hjelpe hverandre med alt som har med båtliv å gjøre.</p><p><strong>Her er noen tips for å komme i gang:</strong></p><ul><li>Bruk kategoriene for å finne relevante diskusjoner</li><li>Søk gjerne før du oppretter et nytt innlegg - kanskje noen allerede har svart på spørsmålet ditt</li><li>Vær hyggelig og respektfull i alle diskusjoner</li><li>Del gjerne bilder og erfaringer fra dine båtturer!</li></ul><p>Jeg gleder meg til å lese om deres opplevelser og erfaringer. La oss bygge et sterkt fellesskap sammen! ⛵</p>',
  45,
  12,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM forum_posts WHERE title = 'Velkommen til Nautix Forum! 🎉'
);

-- Sample Post 2: Vedlikehold category
INSERT INTO forum_posts (user_id, category_id, title, content, view_count, like_count)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM forum_categories WHERE slug = 'vedlikehold'),
  'Tips for vårpuss av båten - min sjekkliste',
  '<p>Hei!</p><p>Nå som våren nærmer seg, tenkte jeg å dele min personlige sjekkliste for vårpuss av båten. Dette har jeg samlet gjennom mange år, og det fungerer veldig bra for meg.</p><p><strong>Utvendig:</strong></p><ul><li>Vask skroget grundig med milde såpeprodukter</li><li>Inspiser gelcoaten for sprekker og skader</li><li>Sjekk anoden - bytt hvis mer enn 50% er nedbrutt</li><li>Polér skroget hvis nødvendig</li><li>Rengjør og behandle gummilister</li></ul><p><strong>Motor:</strong></p><ul><li>Bytt motorolje og oljefilter</li><li>Sjekk drivrem og slanger</li><li>Kontroller kjølevæskenivå</li><li>Rett motorservice hvis det nærmer seg</li></ul><p><strong>Interiør:</strong></p><ul><li>Luft ut godt i alle rom</li><li>Vask puter og tepper</li><li>Sjekk for mugg og fukt</li><li>Test alle elektriske komponenter</li></ul><p>Hva er dine beste tips for vårpuss? Savner jeg noe viktig på listen? 🔧</p>',
  67,
  18
WHERE NOT EXISTS (
  SELECT 1 FROM forum_posts WHERE title = 'Tips for vårpuss av båten - min sjekkliste'
);

-- Sample Post 3: Motor category
INSERT INTO forum_posts (user_id, category_id, title, content, view_count, like_count)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM forum_categories WHERE slug = 'motor'),
  'Problem med Volvo Penta D2-55 - motoren stopper plutselig',
  '<p>Hei alle sammen,</p><p>Jeg har et problem med min Volvo Penta D2-55 som jeg håper noen kan hjelpe meg med. Motoren starter helt fint, men etter ca 20-30 minutters kjøring stopper den plutselig. Etter 10-15 minutters pause starter den igjen uten problemer.</p><p><strong>Hva jeg har sjekket så langt:</strong></p><ul><li>Dieselfilter er byttet for 2 måneder siden</li><li>Ingen synlige lekkasjer i drivstoffsystemet</li><li>Kjølevannsnivå er OK</li><li>Temperaturen ser normal ut</li></ul><p>Det virker nesten som om den blir varm og går i en slags sikkerhetsmodus, men temperaturmåleren viser ikke noe unormalt. Har målt med IR-termometer også, og temperaturen ligger på ca 75-80 grader når den stopper.</p><p>Noen som har opplevd lignende eller har forslag til hva jeg bør sjekke videre? Takker for all hjelp! ⚙️</p>',
  89,
  5
WHERE NOT EXISTS (
  SELECT 1 FROM forum_posts WHERE title = 'Problem med Volvo Penta D2-55 - motoren stopper plutselig'
);

-- Sample Post 4: Reiser category
INSERT INTO forum_posts (user_id, category_id, title, content, view_count, like_count)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM forum_categories WHERE slug = 'reiser'),
  'Fantastisk tur til Hvaler - anbefalinger og tips',
  '<p>Vi hadde en strålende weekend-tur til Hvaler i helgen, og jeg måtte bare dele opplevelsen med dere!</p><p><strong>Rute og ankerplasser:</strong></p><p>Vi startet fra Tønsberg og seilte mot Hvaler med stopp i Tjøme første kvelden. Dagen etter fortsatte vi til Asmaløy hvor vi fant en fantastisk ankerplass i Utgårdskilen. Vannet var krystallklart og perfekt for en dukkert!</p><p><strong>Høydepunkter:</strong></p><ul><li>Solnedgang fra ankerplassen - helt magisk! 🌅</li><li>Grilling på båten med fersk sjømat fra lokalt fiskeutsalg</li><li>Kajaktur rundt holmene om morgenen</li><li>Besøk til Kjøkøy - koselig liten øy med fantastisk natur</li></ul><p><strong>Tips til andre:</strong></p><ul><li>Kom tidlig til populære ankerplasser i helgene</li><li>Ha godt med drikkevann - det er ikke alltid lett å fylle på</li><li>Sjekk værmeldingen nøye - det kan bli mye vind mellom øyene</li><li>Kjøp mat og proviant før du drar, begrenset tilbud på øyene</li></ul><p>Hvaler er virkelig et paradis for båtentusiaster. Kan varmt anbefale dette som en helgetur for familier og par. Dere må bare oppleve det! 🗺️⛵</p>',
  134,
  28
WHERE NOT EXISTS (
  SELECT 1 FROM forum_posts WHERE title = 'Fantastisk tur til Hvaler - anbefalinger og tips'
);

-- Add some sample comments to make it more realistic
INSERT INTO forum_comments (post_id, user_id, content, like_count)
SELECT 
  (SELECT id FROM forum_posts WHERE title = 'Problem med Volvo Penta D2-55 - motoren stopper plutselig'),
  (SELECT id FROM auth.users LIMIT 1),
  '<p>Høres ut som det kan være drivstoffpumpen som sliter. Har du sjekket trykket i drivstoffsystemet? Det kan også være varmeveksleren som tetter seg til.</p>',
  3
WHERE NOT EXISTS (
  SELECT 1 FROM forum_comments WHERE content LIKE '%drivstoffpumpen som sliter%'
);

INSERT INTO forum_comments (post_id, user_id, content, like_count)
SELECT 
  (SELECT id FROM forum_posts WHERE title = 'Tips for vårpuss av båten - min sjekkliste'),
  (SELECT id FROM auth.users LIMIT 1),
  '<p>Flott liste! Jeg vil legge til å sjekke bilgepumpen og sjøventiler. Viktig sikkerhetsutstyr som mange glemmer.</p>',
  5
WHERE NOT EXISTS (
  SELECT 1 FROM forum_comments WHERE content LIKE '%bilgepumpen og sjøventiler%'
);

INSERT INTO forum_comments (post_id, user_id, content, like_count)
SELECT 
  (SELECT id FROM forum_posts WHERE title = 'Fantastisk tur til Hvaler - anbefalinger og tips'),
  (SELECT id FROM auth.users LIMIT 1),
  '<p>Dette høres helt fantastisk ut! Vi planlegger å dra til Hvaler i sommer. Hvilken ankerplass vil du anbefale mest for barn? Vi har to små på 5 og 8 år.</p>',
  2
WHERE NOT EXISTS (
  SELECT 1 FROM forum_comments WHERE content LIKE '%to små på 5 og 8 år%'
);

-- Note: After running this script in Supabase SQL Editor, the category post_counts 
-- will be automatically updated by the database triggers.

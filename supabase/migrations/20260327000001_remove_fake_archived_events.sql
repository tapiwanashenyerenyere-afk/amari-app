DELETE FROM public.events
WHERE title IN (
  'AMARI Gala 2025',
  'Laureate Supper Club'
)
AND registration_url IN (
  'https://www.eventbrite.com/e/amari-gala-2025',
  'https://www.eventbrite.com/e/laureate-supper-club'
);

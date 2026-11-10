-- Fix Lat pulldown GIF (was cable-cross-style full-ROM asset).
update public.exercises
set
  video_url = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif',
  video_attribution = 'Lever Front Pulldown · ExerciseGymGifsDB (jsDelivr)',
  instructions = 'Adjust the machine seat and thigh pad. Grip the bar slightly wider than shoulder width, pull to your upper chest, and control the return. Keep your chest up and avoid leaning back excessively.'
where name = 'Lat pulldown';

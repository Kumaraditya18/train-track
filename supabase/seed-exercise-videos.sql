-- wger.de open exercise videos (linked, not re-hosted). Run after seed-exercises.sql.
alter table public.exercises add column if not exists video_url text;
alter table public.exercises add column if not exists video_source text;
alter table public.exercises add column if not exists video_attribution text;

update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/341/0cbfeace-dda9-4166-8424-f51358e88a4f.MOV',
  video_source = 'wger',
  video_attribution = 'barbell squat · Goulart · CC-BY-SA (wger.de)'
where name = 'Barbell back squat';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/257/ad8ac7d9-b04d-415f-ae0e-837942ce2840.MOV',
  video_source = 'wger',
  video_attribution = 'Front Squats · Goulart · CC-BY-SA 3 (wger.de)'
where name = 'Front squat';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/507/307e7276-a14d-4ea0-b579-f5b0dbc6f5af.MOV',
  video_source = 'wger',
  video_attribution = 'Romanian Deadlift · Goulart · CC-BY-SA 4 (wger.de)'
where name = 'Romanian deadlift';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/507/307e7276-a14d-4ea0-b579-f5b0dbc6f5af.MOV',
  video_source = 'wger',
  video_attribution = 'deadlift · Goulart · CC-BY-SA (wger.de)'
where name = 'Conventional deadlift';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/73/2bdb390c-312c-4497-a722-5eed2c823e5a.MOV',
  video_source = 'wger',
  video_attribution = 'Bench Press · Goulart · CC-BY-SA 3 (wger.de)'
where name = 'Barbell bench press';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/537/b9c937e9-daeb-42a9-be8e-7a77e368478c.MOV',
  video_source = 'wger',
  video_attribution = 'incline bench press · Goulart · CC-BY-SA (wger.de)'
where name = 'Incline dumbbell press';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/73/2bdb390c-312c-4497-a722-5eed2c823e5a.MOV',
  video_source = 'wger',
  video_attribution = 'Bench Press · Goulart · CC-BY-SA 3 (wger.de)'
where name = 'Dumbbell flat bench press';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/512/fff4c294-93f0-4926-b3a2-bf59ad4afaa5.MOV',
  video_source = 'wger',
  video_attribution = 'bent over row · Goulart · CC-BY-SA (wger.de)'
where name = 'Barbell row';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/475/83067ffe-ccb9-4e22-8507-5131b211ce74.MOV',
  video_source = 'wger',
  video_attribution = 'Pull-ups · Goulart · CC-BY-SA 3 (wger.de)'
where name = 'Pull-up';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/512/fff4c294-93f0-4926-b3a2-bf59ad4afaa5.MOV',
  video_source = 'wger',
  video_attribution = 'seated row · Goulart · CC-BY-SA (wger.de)'
where name = 'Seated cable row';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/82/28b53647-27e7-47cf-8852-2ee666c8b628.MOV',
  video_source = 'wger',
  video_attribution = 'Bent-over Lateral Raises · Goulart · CC-BY-SA 4 (wger.de)'
where name = 'Lateral raise';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/91/483f4bff-e108-41f1-8e7b-0caf24952552.MOV',
  video_source = 'wger',
  video_attribution = 'barbell biceps curl · Goulart · CC-BY-SA (wger.de)'
where name = 'Barbell curl';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/272/df069052-2173-4f24-855f-a0eebe729f24.MOV',
  video_source = 'wger',
  video_attribution = 'hammer curl · Goulart · CC-BY-SA (wger.de)'
where name = 'Dumbbell hammer curl';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/73/2bdb390c-312c-4497-a722-5eed2c823e5a.MOV',
  video_source = 'wger',
  video_attribution = 'Bench Press · Goulart · CC-BY-SA 3 (wger.de)'
where name = 'Close-grip bench press';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/371/6aae16b4-01b9-4eb4-935c-3250f84d2c59.MOV',
  video_source = 'wger',
  video_attribution = 'Leg Press · Goulart · CC0 (wger.de)'
where name = 'Leg press';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/365/becaf013-5044-40d0-bae9-7ed60c973737.MOV',
  video_source = 'wger',
  video_attribution = 'lying leg curls · Goulart · CC-BY-SA (wger.de)'
where name = 'Lying leg curl';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/366/43df4b79-d4c3-4fbf-bcb5-e0d825b84120.MOV',
  video_source = 'wger',
  video_attribution = 'Seated leg curl · Goulart · CC-BY-SA (wger.de)'
where name = 'Seated leg curl';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/802/85d1d7f8-c3c5-47e8-9b26-56896919e6e7.MOV',
  video_source = 'wger',
  video_attribution = 'lunges · Goulart · CC-BY-SA (wger.de)'
where name = 'Walking lunge';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/294/45bacf4b-1bb6-4d47-8bd1-9f00eddd4019.MOV',
  video_source = 'wger',
  video_attribution = 'Hip Thrust · Goulart · CC-BY-SA 4 (wger.de)'
where name = 'Hip thrust';
update public.exercises set
  video_url = 'https://wger.de/media/exercise-video/622/35b7b625-77fd-4c09-8c57-3ad0f2f23175.MOV',
  video_source = 'wger',
  video_attribution = 'Standing Calf Raises · Goulart · CC-BY-SA 3 (wger.de)'
where name = 'Standing calf raise';

-- Matched 20 of 40 exercises
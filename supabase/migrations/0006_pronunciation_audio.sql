-- Guarda el audio de cada intento de pronunciacion en Storage para poder
-- escucharlo despues, y anade la columna que referencia ese archivo.

alter table pronunciation_attempts add column if not exists audio_path text;

insert into storage.buckets (id, name, public)
values ('pronunciation-audio', 'pronunciation-audio', false)
on conflict (id) do nothing;

drop policy if exists "pronunciation audio: owner insert" on storage.objects;
drop policy if exists "pronunciation audio: owner select" on storage.objects;
drop policy if exists "pronunciation audio: owner delete" on storage.objects;

create policy "pronunciation audio: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'pronunciation-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pronunciation audio: owner select" on storage.objects
  for select using (
    bucket_id = 'pronunciation-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pronunciation audio: owner delete" on storage.objects
  for delete using (
    bucket_id = 'pronunciation-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

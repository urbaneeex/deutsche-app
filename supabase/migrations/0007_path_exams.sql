-- Anade examenes periodicos a la ruta de aprendizaje: un tipo de paso
-- especial ("exam") que repasa lo aprendido en los pasos anteriores, con
-- una puntuacion real por intento (igual que ya hacemos con las lecciones
-- de gramatica) para poder exigir un minimo de aciertos antes de desbloquear
-- el siguiente paso.

alter table path_steps add column if not exists step_type text not null default 'lesson';
alter table path_steps drop constraint if exists path_steps_step_type_check;
alter table path_steps add constraint path_steps_step_type_check
  check (step_type in ('lesson', 'exam'));

alter table path_progress add column if not exists score numeric not null default 1;
alter table path_progress add column if not exists attempts int not null default 1;

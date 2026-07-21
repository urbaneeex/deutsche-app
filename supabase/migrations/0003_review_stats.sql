-- Progreso mas rico para el apartado "Revision": en vez de un simple
-- completado/no completado, guardamos la puntuacion del intento y cuantas
-- veces se ha repetido la leccion, para poder clasificar el dominio real
-- (necesita mejorar / mejora / fuerte / dominado) como en Busuu.

alter table lesson_progress
  add column if not exists score numeric not null default 1,
  add column if not exists attempts int not null default 1;

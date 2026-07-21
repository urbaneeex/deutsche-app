-- Permite distinguir mazos de vocabulario generados por IA (a peticion del
-- usuario, ej. "tarjetas de ropa") de los mazos semilla del curso.

alter table decks add column if not exists source text not null default 'seed';
alter table decks drop constraint if exists decks_source_check;
alter table decks add constraint decks_source_check check (source in ('seed', 'ai'));

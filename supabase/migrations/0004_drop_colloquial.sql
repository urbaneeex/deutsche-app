-- Se elimina el apartado "Coloquial": ya no se genera ni consulta este
-- contenido desde la app, así que retiramos la tabla y ajustamos el check
-- de categorías de decks para que ya no admita 'colloquial'.

drop table if exists colloquial_phrases;

alter table decks drop constraint if exists decks_category_check;
alter table decks add constraint decks_category_check
  check (category in ('grammar', 'vocab', 'situation'));

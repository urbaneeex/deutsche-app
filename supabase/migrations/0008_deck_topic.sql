-- Anade una categoria tematica a los mazos de vocabulario (ej. "Gramática",
-- "Salud", "Números y tiempo") para poder agruparlos en la barra lateral de
-- tarjetas, en vez de mostrar un listado plano de mazos.

alter table decks add column if not exists topic text;

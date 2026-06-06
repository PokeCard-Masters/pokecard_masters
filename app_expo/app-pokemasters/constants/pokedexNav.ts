type PokedexMode = 'pokedex' | 'collection';

let _pending: PokedexMode | null = null;

export const pokedexNav = {
  request: (mode: PokedexMode) => { _pending = mode; },
  consume: (): PokedexMode | null => {
    const m = _pending;
    _pending = null;
    return m;
  },
};

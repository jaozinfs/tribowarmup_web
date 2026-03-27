# Imagens dos mapas

Dois tipos de assets, em pastas diferentes:

- **`/images/maps/`** (esta pasta) — **Ícones** pequenos: veto PUG (pick/ban), Performance PUG (seleção de mapa) e thumbnail no connect.
- **`/images/maps/backgrounds/`** — **Fundos** grandes: lista de servidores (fundo da row) e fundo da arena PUG após veto.

## Como obter

### Ícones (veto + Performance PUG)

Rode para baixar os ícones do [MurkyYT/cs2-map-icons](https://github.com/MurkyYT/cs2-map-icons):

```bash
node scripts/download-map-icons.js
```

Isso grava aqui **apenas** os ícones (Anubis, Ancient, Dust 2, Inferno, Mirage, Nuke, Overpass). O ícone do **Cache** (`de_cache.png`) já está incluído no projeto (não existe no repositório MurkyYT).

### Fundos (lista de servidores + arena PUG)

Para fundos nas linhas da lista de servidores e atrás da arena PUG:

```bash
node scripts/download-cs2-map-backgrounds.js
```

Isso grava em **`public/images/maps/backgrounds/`** (não sobrescreve os ícones desta pasta).

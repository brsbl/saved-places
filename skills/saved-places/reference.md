# Saved Places reference

## Import files

`npm run import -- [--geocode] [--out <file>] <file…>` builds `data/saved-places.json` from the files you pass. Each import replaces that file, so pass every file you want in one command, then run `bb plugin reload saved-places`. Paths are relative to where you run it; use `"$HOME/…"` rather than a quoted `~`.

- **CSV** with `name`, `latitude`, and `longitude` columns, plus optional `address`, `url`, `list`, `category`, and `type`. A `list` column splits one file into several lists; otherwise each file becomes one list named after the file.
- **GeoJSON** files of Point features, including Google Takeout's `Saved Places.json` (Starred places).
- **Google Takeout** `Saved/<List>.csv` files, which have only Title, Note, and URL columns. Pass `--geocode` to look up coordinates with [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/api/Search/) at one request per second.

A `url` of the form `https://www.google.com/maps?cid=<place ID>` gives each place a stable key, so notes, custom lists, and category fixes stay attached across re-imports. Without one, a place is keyed by its name and coordinates.

## Categories

Each place gets its category from its Google place type, narrowed by its name (a "Restaurant" named "Sushi Hana" is Sushi), or from its name alone when it has no type; addresses are never used. A specific `category` in your CSV, such as `museum`, overrides both. A place with no match whose name is a street address or coordinates is filed under Addresses. Fixes from the place card or `bb saved-places category` win over all of these.

Categories belong to ten color groups: Food, Cafés & sweets, Nightlife, Culture, Outdoors, Shopping, Stays, Wellness & fun, Getting around, and Other. A place takes its group's color and its category's icon, and the basemap's own points of interest use the same icons and colors.

To add or change a category, edit its row in `categories.ts` (label, name or type pattern, and the OpenMapTiles POI classes it covers) and its icon in `category-icons.ts`, then reinstall.

## Lists

The library groups imported lists by title: Favorites, Want to go, and Starred places are "Saved by Google", lists with "recommendations" in the title are "From friends", and the rest are "Trips & cities". See `groupFor` in `model.ts`. Lists without photos use a small map of their places as the cover.

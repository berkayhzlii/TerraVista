# TerraVista

A responsive, dark-themed mapping website built with plain HTML, CSS and JavaScript. It is suitable for static hosting (GitHub Pages, Netlify, Cloudflare Pages, or any web server).

## Features

- Interactive Leaflet map
- OpenStreetMap street map, CartoDB dark map, and Esri satellite imagery
- Place search using OpenStreetMap Nominatim
- Quick navigation to Istanbul, London, New York, and Tokyo
- Browser geolocation
- Optional Mapillary Graph API image lookup around the current map center
- Responsive desktop and mobile layout

## Run locally

Because browser geolocation and some API requests work best on a local web server, do not open `index.html` directly as a `file://` URL.

With Python installed:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

Or use the VS Code Live Server extension.

## Deploy online

### GitHub Pages
1. Create a GitHub repository named `terravista`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. Wait for the deployment URL shown by GitHub Pages.

### Netlify
Drag the project folder into Netlify's manual deploy area, or connect the Git repository. No build command is required; publish directory is `.`.

## Mapillary integration

TerraVista's Mapillary panel uses the public Graph API endpoint:

`https://graph.mapillary.com/images`

To use it:
1. Register a real application in the [Mapillary developer dashboard](https://www.mapillary.com/dashboard/developers).
2. Follow Mapillary's current developer terms and application requirements.
3. Copy the access token issued for your application.
4. Paste it into the TerraVista sidebar and click **Save**, then **Find nearby images**.

The token is held in JavaScript memory for the current page session. It is not saved to local storage and is not sent to a TerraVista backend. **Important:** a browser-side token is visible to visitors through developer tools/network requests. For a public production site, use a small serverless backend to keep credentials private, apply rate limits, and follow Mapillary's token/security guidance. Never put a confidential client secret in frontend code.

Mapillary API access may require approval or a valid token and is subject to Mapillary's current terms, quotas, and permissions. This project does not bypass those requirements.

## Third-party services and attribution

- Leaflet: https://leafletjs.com/
- OpenStreetMap data and tile service: https://www.openstreetmap.org/copyright
- CARTO basemap tiles: https://carto.com/attributions
- Esri World Imagery: https://www.esri.com/en-us/legal/terms/full-master-agreement
- Nominatim search: https://operations.osmfoundation.org/policies/nominatim/
- Mapillary API: https://www.mapillary.com/developer

Respect each provider's usage policies, rate limits, attribution, and licensing. For significant traffic, use an appropriate tile provider rather than relying on the public OSM tile servers.

## Project identity

TerraVista is an independent demo project. It is not affiliated with or endorsed by Mapillary, Meta, OpenStreetMap, CARTO, or Esri.

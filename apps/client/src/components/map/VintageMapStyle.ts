// Vintage/Noir map style for MapLibre - Proper configuration without sprite/glyphs
export const vintageMapStyle = {
  version: 8,
  name: 'Vintage Noir',
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap'
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -0.6,
        'raster-contrast': 0.2,
        'raster-brightness-min': 0.2,
        'raster-brightness-max': 0.7,
        'raster-hue-rotate': 15,
        'raster-opacity': 0.85
      }
    }
  ],
  // Remove sprite and glyphs to avoid errors
  sprite: undefined,
  glyphs: undefined
};

// Alternative: Simple dark style that works without external resources
export const darkVintageStyle = {
  version: 8,
  name: 'Dark Vintage',
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap'
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -0.8,
        'raster-contrast': 0.4,
        'raster-brightness-min': 0.1,
        'raster-brightness-max': 0.6,
        'raster-hue-rotate': 20,
        'raster-opacity': 0.9
      }
    }
  ]
};

// Another option: Use a free MapLibre style
export const freeTileStyle = {
  version: 8,
  name: 'Free Vintage',
  sources: {
    'demotiles': {
      type: 'raster',
      tiles: ['https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© MapLibre'
    }
  },
  layers: [
    {
      id: 'demotiles',
      type: 'raster',
      source: 'demotiles',
      paint: {
        'raster-saturation': -0.5,
        'raster-contrast': 0.3,
        'raster-brightness-min': 0.2,
        'raster-brightness-max': 0.8
      }
    }
  ]
};
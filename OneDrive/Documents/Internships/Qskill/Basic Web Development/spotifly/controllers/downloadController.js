const path = require('path');

// ─────────────────────────────────────────────
//  Spotify API credentials (kept for reference, no longer needed for metadata)
// ─────────────────────────────────────────────
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

/** Parse Spotify track ID from URL or URI. */
function parseSpotifyTrackId(url) {
  const uri = url.match(/^spotify:track:([A-Za-z0-9]+)$/);
  if (uri) return uri[1];
  const link = url.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
  if (link) return link[1];
  return null;
}

/**
 * Fetch track metadata by scraping Open Graph tags from the Spotify page.
 * No API key or auth needed — bypasses the 403 Development Mode restriction.
 */
async function fetchSpotifyTrack(trackId) {
  const spotifyUrl = `https://open.spotify.com/track/${trackId}`;

  const res = await fetch(spotifyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch Spotify page: ${res.status}`);

  const html = await res.text();

  // Helper: extract <meta property="..." content="...">
  const getMeta = (property) => {
    const match =
      html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`)) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`));
    return match ? match[1] : null;
  };

  // Helper: extract <meta name="..." content="...">
  const getMetaName = (name) => {
    const match =
      html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`)) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`));
    return match ? match[1] : null;
  };

  const ogTitle       = getMeta('og:title')       || '';
  const ogDescription = getMeta('og:description') || '';
  const ogImage       = getMeta('og:image')        || null;
  const twitterTitle  = getMetaName('twitter:title') || '';

  let title  = 'Unknown Title';
  let artist = 'Unknown Artist';
  let album  = 'Unknown Album';
  let year   = null;

  // og:title is usually "Track Name - Artist Name | Spotify"
  const raw = ogTitle || twitterTitle;
  if (raw) {
    const cleaned = raw.replace(/\s*[|·]\s*Spotify\s*$/i, '').trim();
    if (cleaned.includes(' - ')) {
      const parts = cleaned.split(' - ');
      title  = parts[0].trim();
      artist = parts.slice(1).join(' - ').trim();
    } else {
      title = cleaned;
    }
  }

  // og:description is usually "Artist · Song · Year" or similar
  if (ogDescription) {
    const yearMatch = ogDescription.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) year = yearMatch[0];

    const parts = ogDescription.split('·').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2 && artist === 'Unknown Artist') artist = parts[0];
    if (parts.length >= 3 && album === 'Unknown Album')   album  = parts[1];
  }

  // Fallback: JSON-LD structured data in the page
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (jsonLdMatch) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      if (title  === 'Unknown Title')  title  = ld.name || title;
      if (artist === 'Unknown Artist') {
        artist = (ld.byArtist?.name) ||
                 (Array.isArray(ld.byArtist) ? ld.byArtist.map(a => a.name).join(', ') : null) ||
                 artist;
      }
      if (album === 'Unknown Album') album = ld.inAlbum?.name || album;
      if (!year)                     year  = ld.datePublished?.slice(0, 4) || year;
    } catch (_) {}
  }

  console.log(`[fetchSpotifyTrack] title="${title}" artist="${artist}" album="${album}" year="${year}"`);

  return {
    id:            trackId,
    title,
    artist,
    album,
    duration:      null,
    thumbnail:     ogImage,
    year,
    genre:         null,
    spotifyUrl,
    downloadReady: true,
  };
}

// ─────────────────────────────────────────────
//  Route: POST /api/download/fetch
// ─────────────────────────────────────────────
exports.fetchTrack = async (req, res) => {
  try {
    const { spotifyUrl } = req.body;
    if (!spotifyUrl) return res.status(400).json({ error: 'Spotify URL is required.' });

    const trackId = parseSpotifyTrackId(spotifyUrl.trim());
    if (!trackId) {
      return res.status(400).json({
        error: 'Invalid Spotify link. Use: https://open.spotify.com/track/…',
      });
    }

    const track = await fetchSpotifyTrack(trackId);
    res.json({ success: true, track });

  } catch (err) {
    console.error('fetchTrack error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch track info.' });
  }
};

// ─────────────────────────────────────────────
//  Route: GET /api/download/file/:trackId
//  Query params: ?title=...&artist=...&spotifyUrl=...
// ─────────────────────────────────────────────
exports.downloadFile = async (req, res) => {
  const { trackId } = req.params;
  const title      = (req.query.title      || 'Unknown Title') .replace(/[<>:"/\\|?*]/g, '');
  const artist     = (req.query.artist     || 'Unknown Artist').replace(/[<>:"/\\|?*]/g, '');
  const spotifyUrl = req.query.spotifyUrl  || `https://open.spotify.com/track/${trackId}`;
  const filename   = `${artist} - ${title}.mp3`;

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({
      error: 'RAPIDAPI_KEY is not configured. Add it to your .env file.',
    });
  }

  console.log(`[download] Fetching via RapidAPI for track: ${trackId}`);

  try {
    // Step 1: Get download link from RapidAPI
    const apiRes = await fetch(
      `https://spotify-downloader9.p.rapidapi.com/downloadSong?songId=${encodeURIComponent(spotifyUrl)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'spotify-downloader9.p.rapidapi.com',
          'x-rapidapi-key':  RAPIDAPI_KEY,
        },
      }
    );

    if (!apiRes.ok) {
      const body = await apiRes.text();
      const headers = {};
      apiRes.headers.forEach((v, k) => { headers[k] = v; });
      console.error('[RapidAPI] Error headers:', headers);
      console.error('[RapidAPI] Error body:', body);

      if (apiRes.status === 403) {
        throw new Error('RapidAPI returned 403. Check your subscription to "spotify-downloader9" at rapidapi.com.');
      }
      if (apiRes.status === 429) {
        throw new Error('RapidAPI rate limit exceeded. Please wait a moment and try again.');
      }

      throw new Error(`RapidAPI error ${apiRes.status}: ${body}`);
    }

    const apiData = await apiRes.json();
    console.log('[RapidAPI] Response:', JSON.stringify(apiData, null, 2));

    const downloadLink = apiData?.data?.downloadLink;
    if (!downloadLink) {
      throw new Error('No download link returned by RapidAPI. Check your subscription or try a different track.');
    }

    console.log(`[download] Streaming MP3 for "${title}"`);

    // Step 2: Stream the MP3 to the browser
    const mp3Res = await fetch(downloadLink);
    if (!mp3Res.ok) throw new Error(`Failed to fetch MP3 stream: ${mp3Res.status}`);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const contentLength = mp3Res.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const { Readable } = require('stream');
    Readable.fromWeb(mp3Res.body).pipe(res);

  } catch (err) {
    console.error('downloadFile error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Download failed.' });
    }
  }
};
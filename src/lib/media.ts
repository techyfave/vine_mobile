/**
 * Image source for a file served by the API.
 *
 * Media links from R2 are signed and change every time the API returns them (the signature and
 * expiry are in the query string). Caching by the path alone means a photo downloads once and is
 * reused, instead of being fetched again for every new link.
 */
export function remoteImage(uri: string) {
  return { uri, cacheKey: uri.split('?')[0] };
}

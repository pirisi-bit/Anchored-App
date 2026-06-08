const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, "") ?? "";

export function apiPath(path: `/${string}`): string {
  return `${apiOrigin}${path}`;
}

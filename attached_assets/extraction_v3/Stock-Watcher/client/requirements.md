## Packages
date-fns | Formatting dates easily
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to merge tailwind classes without style conflicts

## Notes
The app relies heavily on localStorage to replicate the original vanilla JS state behavior.
It fetches the SET index from the backend `/api/set-index`.
Crypto prices are fetched directly from CoinGecko API as in the original app to avoid needing backend proxy unless CORS becomes an issue (standard practice for simple trackers).

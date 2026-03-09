import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Fetch SET Index from our backend
export function useSetIndex() {
  return useQuery({
    queryKey: [api.setIndex.path],
    queryFn: async () => {
      const res = await fetch(api.setIndex.path);
      if (!res.ok) throw new Error("Failed to fetch SET index");
      return api.setIndex.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// Fetch all Crypto prices from Bitkub — direct browser fetch (bypasses server/Lambda)
export function useCryptoPrices() {
    return useQuery({
        queryKey: ["crypto-prices"],
        queryFn: async () => {
            try {
                const res = await fetch('https://api.bitkub.com/api/market/ticker');
                if (!res.ok) throw new Error("Bitkub API error");
                const data = await res.json() as Record<string, { last: number }>;
                const prices: Record<string, number> = {};
                for (const [pair, info] of Object.entries(data)) {
                    if (pair.startsWith('THB_')) {
                        prices[pair.replace('THB_', '')] = info.last;
                    }
                }
                return prices;
            } catch {
                // Fallback to server proxy if browser fetch fails (e.g. CORS)
                const res = await fetch('/api/crypto/prices');
                if (!res.ok) return {} as Record<string, number>;
                return await res.json() as Record<string, number>;
            }
        },
        refetchInterval: 10000
    });
}

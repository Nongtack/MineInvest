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
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Fetch Crypto prices from Bitkub
export function useCryptoPrice(symbol: string) {
    return useQuery({
        queryKey: ["crypto-price", symbol],
        queryFn: async () => {
            const res = await fetch(`/api/crypto/${symbol}`);
            if (!res.ok) throw new Error("Failed to fetch crypto price");
            return await res.json() as { price: number };
        },
        refetchInterval: 30000,
        enabled: !!symbol
    });
}

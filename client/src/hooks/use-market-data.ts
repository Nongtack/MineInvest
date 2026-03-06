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

// Fetch all Crypto prices from Bitkub
export function useCryptoPrices() {
    return useQuery({
        queryKey: ["crypto-prices"],
        queryFn: async () => {
            const res = await fetch('/api/crypto/prices');
            if (!res.ok) throw new Error("Failed to fetch crypto prices");
            return await res.json() as Record<string, number>;
        },
        refetchInterval: 10000 // Refresh every 10 seconds
    });
}

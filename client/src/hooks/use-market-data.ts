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

// Fetch Crypto prices from CoinGecko (replicated from original app)
export function useCryptoPrices(cgids: string[]) {
  return useQuery({
    queryKey: ["crypto-prices", cgids.join(",")],
    queryFn: async () => {
      if (cgids.length === 0) return {};
      const ids = cgids.filter(Boolean).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=thb`);
      if (!res.ok) throw new Error("Failed to fetch crypto prices");
      const data = await res.json();
      return data as Record<string, { thb: number }>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: cgids.length > 0,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useInvestmentTypes() {
  return useQuery({
    queryKey: [api.investmentTypes.list.path],
    queryFn: async () => {
      const res = await fetch(api.investmentTypes.list.path);
      if (!res.ok) throw new Error("Failed to fetch investment types");
      return api.investmentTypes.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateInvestmentType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch(api.investmentTypes.create.path, {
        method: api.investmentTypes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create investment type");
      }
      return api.investmentTypes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investmentTypes.list.path] });
    },
  });
}

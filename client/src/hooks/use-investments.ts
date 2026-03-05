import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useInvestments() {
  return useQuery({
    queryKey: [api.investments.list.path],
    queryFn: async () => {
      const res = await fetch(api.investments.list.path);
      if (!res.ok) throw new Error("Failed to fetch investments");
      return api.investments.list.responses[200].parse(await res.json());
    },
  });
}

export function useInvestment(id: number) {
  return useQuery({
    queryKey: [api.investments.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.investments.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch investment");
      return api.investments.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.investments.create.input>) => {
      const res = await fetch(api.investments.create.path, {
        method: api.investments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create investment");
      return api.investments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<z.infer<typeof api.investments.update.input>>) => {
      const url = buildUrl(api.investments.update.path, { id });
      const res = await fetch(url, {
        method: api.investments.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update investment");
      return api.investments.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.investments.get.path, variables.id] });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.investments.delete.path, { id });
      const res = await fetch(url, { method: api.investments.delete.method });
      if (!res.ok) throw new Error("Failed to delete investment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
    },
  });
}

export function useSyncPrices() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.investments.syncPrices.path, {
        method: api.investments.syncPrices.method,
      });
      if (!res.ok) throw new Error("Failed to sync prices");
      return api.investments.syncPrices.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useDividends() {
  return useQuery({
    queryKey: [api.dividends.list.path],
    queryFn: async () => {
      const res = await fetch(api.dividends.list.path);
      if (!res.ok) throw new Error("Failed to fetch dividends");
      return api.dividends.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDividend() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.dividends.create.input>) => {
      const res = await fetch(api.dividends.create.path, {
        method: api.dividends.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create dividend");
      return api.dividends.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.dividends.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.investments.get.path, Number(variables.investmentId)] });
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
    },
  });
}

export function useUpdateDividend() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<z.infer<typeof api.dividends.update.input>>) => {
      const url = buildUrl(api.dividends.update.path, { id });
      const res = await fetch(url, {
        method: api.dividends.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update dividend");
      return api.dividends.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.dividends.list.path] });
      if (variables.investmentId) {
        queryClient.invalidateQueries({ queryKey: [api.investments.get.path, Number(variables.investmentId)] });
      }
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
    },
  });
}

export function useDeleteDividend() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, investmentId }: { id: number, investmentId: number }) => {
      const url = buildUrl(api.dividends.delete.path, { id });
      const res = await fetch(url, { method: api.dividends.delete.method });
      if (!res.ok) throw new Error("Failed to delete dividend");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.dividends.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.investments.get.path, variables.investmentId] });
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
    },
  });
}

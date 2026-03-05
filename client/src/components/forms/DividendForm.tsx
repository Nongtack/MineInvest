import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDividend, useUpdateDividend } from "@/hooks/use-dividends";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  investmentId: number;
  initialData?: any;
  onSuccess: () => void;
}

export function DividendForm({ investmentId, initialData, onSuccess }: Props) {
  const isEditing = !!initialData;
  const defaultDate = initialData?.date 
    ? format(new Date(initialData.date), "yyyy-MM-dd") 
    : format(new Date(), "yyyy-MM-dd");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: initialData?.amount?.toString() || "",
      date: defaultDate,
    }
  });

  const createMutation = useCreateDividend();
  const updateMutation = useUpdateDividend();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        investmentId,
        amount: data.amount,
        date: new Date(data.date),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: initialData.id, ...payload });
        toast({ title: "Success", description: "Dividend updated" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Success", description: "Dividend added" });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input 
          id="amount" 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          className="h-12 rounded-xl"
          {...register("amount")} 
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input 
          id="date" 
          type="date" 
          className="h-12 rounded-xl block w-full"
          {...register("date")} 
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      <Button type="submit" className="w-full h-12 rounded-xl" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Update Dividend" : "Record Dividend"}
      </Button>
    </form>
  );
}

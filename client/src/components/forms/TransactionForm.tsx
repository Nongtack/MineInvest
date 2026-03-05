import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  type: z.enum(["buy", "sell"]),
  quantity: z.string().min(1, "Quantity is required"),
  price: z.string().min(1, "Price is required"),
  date: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  investmentId: number;
  initialData?: any;
  onSuccess: () => void;
}

export function TransactionForm({ investmentId, initialData, onSuccess }: Props) {
  const isEditing = !!initialData;
  const defaultDate = initialData?.date 
    ? format(new Date(initialData.date), "yyyy-MM-dd") 
    : format(new Date(), "yyyy-MM-dd");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initialData?.type || "buy",
      quantity: initialData?.quantity?.toString() || "",
      price: initialData?.price?.toString() || "",
      date: defaultDate,
    }
  });

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        investmentId,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        date: new Date(data.date),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: initialData.id, ...payload });
        toast({ title: "Success", description: "Transaction updated" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Success", description: "Transaction recorded" });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <Select value={watch("type")} onValueChange={(val: "buy" | "sell") => setValue("type", val)}>
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input 
            id="quantity" 
            type="number" 
            step="any"
            placeholder="0.00" 
            className="h-12 rounded-xl"
            {...register("quantity")} 
          />
          {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Unit Price ($)</Label>
          <Input 
            id="price" 
            type="number" 
            step="0.01"
            placeholder="0.00" 
            className="h-12 rounded-xl"
            {...register("price")} 
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
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
        {isEditing ? "Update Transaction" : "Record Transaction"}
      </Button>
    </form>
  );
}

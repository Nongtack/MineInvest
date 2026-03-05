import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateInvestment, useUpdateInvestment } from "@/hooks/use-investments";
import { CustomSelectType } from "../ui/CustomSelectType";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().optional(),
  typeId: z.coerce.number().min(1, "Type is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: any;
  onSuccess: () => void;
}

export function InvestmentForm({ initialData, onSuccess }: Props) {
  const isEditing = !!initialData;
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      symbol: initialData?.symbol || "",
      typeId: initialData?.typeId || undefined,
    }
  });

  const createMutation = useCreateInvestment();
  const updateMutation = useUpdateInvestment();
  
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: initialData.id, ...data });
        toast({ title: "Success", description: "Investment updated successfully" });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Success", description: "Investment created successfully" });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Investment Name</Label>
        <Input 
          id="name" 
          placeholder="e.g. Apple Inc, Real Estate Fund" 
          className="h-12 rounded-xl border-border/50 focus:border-primary transition-all bg-secondary/30"
          {...register("name")} 
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="symbol" className="text-sm font-medium">Symbol/Ticker (Optional)</Label>
        <Input 
          id="symbol" 
          placeholder="e.g. AAPL" 
          className="h-12 rounded-xl border-border/50 focus:border-primary transition-all bg-secondary/30"
          {...register("symbol")} 
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Investment Type</Label>
        <CustomSelectType 
          value={watch("typeId")} 
          onChange={(val) => setValue("typeId", val, { shouldValidate: true })} 
          error={!!errors.typeId}
        />
        {errors.typeId && <p className="text-xs text-destructive">{errors.typeId.message}</p>}
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl font-semibold shadow-md shadow-primary/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Save Changes" : "Add Investment"}
      </Button>
    </form>
  );
}

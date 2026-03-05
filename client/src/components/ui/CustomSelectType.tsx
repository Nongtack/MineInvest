import React, { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { useInvestmentTypes, useCreateInvestmentType } from "@/hooks/use-investment-types";
import { cn } from "@/lib/utils";

interface CustomSelectTypeProps {
  value: number | undefined;
  onChange: (value: number) => void;
  error?: boolean;
}

export function CustomSelectType({ value, onChange, error }: CustomSelectTypeProps) {
  const [open, setOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  
  const { data: types = [], isLoading } = useInvestmentTypes();
  const { mutate: createType, isPending } = useCreateInvestmentType();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    
    createType({ name: newTypeName.trim() }, {
      onSuccess: (newType) => {
        onChange(newType.id);
        setNewTypeName("");
        setOpen(false);
      }
    });
  };

  const selectedType = types.find(t => t.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12 font-normal rounded-xl transition-all duration-200",
            !value && "text-muted-foreground",
            error && "border-destructive ring-1 ring-destructive/20"
          )}
        >
          {isLoading ? "Loading..." : selectedType ? selectedType.name : "Select an investment type"}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2 rounded-xl shadow-xl border-border/50">
        <div className="max-h-[200px] overflow-y-auto mb-2 space-y-1">
          {types.map((type) => (
            <div
              key={type.id}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-secondary transition-colors duration-200",
                value === type.id ? "bg-accent text-accent-foreground font-medium" : ""
              )}
              onClick={() => {
                onChange(type.id);
                setOpen(false);
              }}
            >
              {type.name}
              {value === type.id && <Check className="h-4 w-4" />}
            </div>
          ))}
          {types.length === 0 && !isLoading && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No types available.
            </div>
          )}
        </div>
        
        <div className="border-t pt-2 mt-2">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="Add New Type..."
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="h-10 text-sm"
              autoFocus={false}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={!newTypeName.trim() || isPending}
              className="h-10 px-3"
            >
              {isPending ? "..." : <Plus className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

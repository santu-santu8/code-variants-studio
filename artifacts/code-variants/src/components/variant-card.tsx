import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { BenchmarkGauge } from "./benchmark-gauge";
import type { Variant } from "@workspace/api-client-react";

interface VariantCardProps {
  variant: Variant;
  isRecommended?: boolean;
}

export function VariantCard({ variant, isRecommended }: VariantCardProps) {
  return (
    <Link href={`/variants/${variant.id}`} className="group block h-full">
      <div className="flex flex-col h-full bg-card border border-border/50 hover:border-primary/50 transition-colors p-5 relative overflow-hidden group-hover:bg-card/80">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/10 transition-colors" />
        
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-mono text-[10px] rounded-none px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                {variant.techniqueLabel}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px] rounded-none px-2 py-0.5 text-muted-foreground">
                {variant.language}
              </Badge>
              {isRecommended && (
                <Badge variant="default" className="font-mono text-[10px] rounded-none px-2 py-0.5 bg-chart-4 text-chart-4-foreground hover:bg-chart-4">
                  Recommended
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors tracking-tight">
              {variant.title}
            </h3>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
          {variant.summary}
        </p>

        <div className="mt-auto pt-4 border-t border-border/40">
          <BenchmarkGauge {...variant.benchmark} />
        </div>
      </div>
    </Link>
  );
}

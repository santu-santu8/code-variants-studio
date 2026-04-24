import { useParams } from "wouter";
import { Link } from "wouter";
import { useGetBlogByTechnique, getGetBlogByTechniqueQueryKey, useListTechniques } from "@workspace/api-client-react";
import { ArrowLeft, Layers, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VariantCard } from "@/components/variant-card";
import { Skeleton } from "@/components/ui/skeleton";

export function BlogTechnique() {
  const params = useParams<{ technique: string }>();
  const technique = params.technique || "";
  
  const { data: group, isLoading } = useGetBlogByTechnique(technique, { 
    query: { enabled: !!technique, queryKey: getGetBlogByTechniqueQueryKey(technique) } 
  });
  
  const { data: techniquesList } = useListTechniques();
  const techInfo = techniquesList?.techniques.find(t => t.slug === technique);

  return (
    <div className="flex-1 w-full bg-background/50">
      <div className="max-w-6xl mx-auto p-6 lg:p-10 xl:p-14 space-y-12">
        
        <div>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            BACK_TO_INDEX
          </Link>

          {isLoading ? (
            <div className="space-y-4 max-w-2xl">
              <Skeleton className="h-10 w-64 rounded-none" />
              <Skeleton className="h-20 w-full rounded-none" />
            </div>
          ) : group ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{group.techniqueLabel}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="font-mono rounded-none bg-secondary text-secondary-foreground border-border/50">
                      {technique}
                    </Badge>
                    <span className="font-mono text-sm text-muted-foreground">{group.variants.length} VARIANTS</span>
                  </div>
                </div>
              </div>
              
              {techInfo?.description && (
                <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed border-l-2 border-primary/50 pl-6 py-2 bg-secondary/10">
                  {techInfo.description}
                </p>
              )}
            </div>
          ) : (
             <div className="text-destructive font-mono">CATEGORY_NOT_FOUND</div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-72 w-full rounded-none" />)}
          </div>
        ) : group?.variants?.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {group.variants.map((variant, i) => (
              <div key={variant.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                <VariantCard variant={variant} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-border/50 text-center bg-card/20">
            <Code2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-mono font-bold mb-2 text-muted-foreground">NO_VARIANTS</h3>
            <p className="text-muted-foreground text-sm max-w-md">There are no implementations using this technique yet.</p>
          </div>
        )}

      </div>
    </div>
  );
}

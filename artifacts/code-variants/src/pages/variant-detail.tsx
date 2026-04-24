import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetVariant, 
  getGetVariantQueryKey, 
  useConvertVariant,
  getListBlogsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Code2, Database, Info, Cpu, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BenchmarkGauge } from "@/components/benchmark-gauge";
import { CodeBlock } from "@/components/code-block";

const targetLanguages = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" }
];

export function VariantDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [targetLang, setTargetLang] = useState<string>("");
  const [convertedCode, setConvertedCode] = useState<{code: string, lang: string, notes: string} | null>(null);

  const { data: variant, isLoading } = useGetVariant(id, {
    query: { enabled: !!id, queryKey: getGetVariantQueryKey(id) }
  });

  const convertMutation = useConvertVariant();

  function handleConvert() {
    if (!targetLang) return;
    
    convertMutation.mutate(
      { data: { variantId: id, targetLanguage: targetLang } },
      {
        onSuccess: (res) => {
          setConvertedCode({ code: res.code, lang: res.targetLanguage, notes: res.notes });
          toast({ title: "Conversion Complete", description: `Converted to ${res.targetLanguage}` });
          // Invalidate to update the blog/techniques count since a new variant might be created implicitly by the backend
          queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetVariantQueryKey(id) });
        },
        onError: (err) => {
          toast({ title: "Conversion Failed", description: err.message, variant: "destructive" });
        }
      }
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10 w-full space-y-8">
        <Skeleton className="h-8 w-32 rounded-none" />
        <Skeleton className="h-16 w-3/4 rounded-none" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[400px] w-full rounded-none" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-none" />
        </div>
      </div>
    );
  }

  if (!variant) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center h-[50vh]">
        <h3 className="text-xl font-mono text-destructive mb-2">VARIANT_NOT_FOUND</h3>
        <Link href="/blog" className="text-primary hover:underline font-mono">RETURN_TO_INDEX</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-background relative">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 xl:p-12 space-y-10">
        
        {/* Header */}
        <div className="space-y-6">
          <Link href={`/blog/${variant.technique}`} className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            BACK_TO_{variant.technique.toUpperCase()}
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="outline" className="font-mono text-xs rounded-none bg-primary/10 text-primary border-primary/20">
                {variant.techniqueLabel}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs rounded-none">
                {variant.language}
              </Badge>
              <div className="text-xs font-mono text-muted-foreground flex items-center gap-1 ml-2">
                <Clock className="w-3 h-3" />
                {new Date(variant.createdAt).toLocaleDateString()}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{variant.title}</h1>
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed border-l-4 border-primary/50 pl-6 py-2 bg-secondary/10">
              {variant.summary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            <section className="space-y-4">
              <h3 className="text-lg font-mono font-bold flex items-center gap-2 border-b border-border/40 pb-2">
                <Info className="w-5 h-5 text-primary" />
                EXPLANATION
              </h3>
              <div className="prose prose-invert max-w-none text-foreground/90 leading-loose prose-pre:bg-card prose-pre:border prose-pre:border-border/50 prose-pre:rounded-none">
                {variant.explanation.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-mono font-bold flex items-center gap-2 border-b border-border/40 pb-2">
                <Code2 className="w-5 h-5 text-primary" />
                SOURCE_CODE
              </h3>
              <CodeBlock code={variant.code} language={variant.language} />
            </section>

            {/* Translation Output */}
            {convertedCode && (
              <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-10 border-t border-border/40">
                <h3 className="text-lg font-mono font-bold flex items-center gap-2 border-b border-border/40 pb-2 text-chart-4">
                  <Zap className="w-5 h-5" />
                  CONVERTED_SOURCE [{convertedCode.lang.toUpperCase()}]
                </h3>
                {convertedCode.notes && (
                  <div className="p-4 bg-chart-4/10 border border-chart-4/20 text-sm text-foreground/80 mb-4">
                    <strong className="text-chart-4 font-mono mr-2">NOTES:</strong>
                    {convertedCode.notes}
                  </div>
                )}
                <CodeBlock code={convertedCode.code} language={convertedCode.lang} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8 sticky top-24">
            
            {/* Benchmark Card */}
            <div className="bg-card border border-border/50 rounded-none overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-secondary/30 flex items-center gap-2 font-mono font-bold text-sm">
                <Database className="w-4 h-4 text-primary" />
                BENCHMARK_TELEMETRY
              </div>
              <div className="p-5">
                <BenchmarkGauge {...variant.benchmark} />
              </div>
            </div>

            {/* Translate Card */}
            <div className="bg-card border border-border/50 rounded-none overflow-hidden">
               <div className="p-4 border-b border-border/40 bg-secondary/30 flex items-center gap-2 font-mono font-bold text-sm">
                <Cpu className="w-4 h-4 text-chart-4" />
                LANGUAGE_TRANSPILER
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Port this algorithm implementation to another programming language using the AI transpiler.
                </p>
                <div className="space-y-3">
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger className="rounded-none border-border/50 font-mono">
                      <SelectValue placeholder="Select target language..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none font-mono">
                      {targetLanguages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    className="w-full rounded-none font-mono tracking-widest" 
                    onClick={handleConvert}
                    disabled={!targetLang || convertMutation.isPending}
                  >
                    {convertMutation.isPending ? "TRANSPILING..." : "EXECUTE_CONVERSION"}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

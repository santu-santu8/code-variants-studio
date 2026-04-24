import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { Terminal, Cpu, Bug, Wand2, Activity, Play, Zap } from "lucide-react";
import { useAnalyzeCode, getListBlogsQueryKey, getListTechniquesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { VariantCard } from "@/components/variant-card";
import { CodeBlock } from "@/components/code-block";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  hintLanguage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const loadingMessages = [
  "Initializing analysis engine...",
  "Detecting language and syntax...",
  "Parsing AST...",
  "Identifying logic errors...",
  "Applying automatic repairs...",
  "Extracting algorithm intent...",
  "Generating technique variants...",
  "Running isolated benchmarks...",
  "Computing complexity scores...",
  "Finalizing recommendations..."
];

export function Studio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingStep, setLoadingStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "function fib(n) {\n  if(n<=1) return n;\n  return fib(n-1) + fib(n-2);\n}",
      hintLanguage: "",
    },
  });

  const analyzeMutation = useAnalyzeCode();

  useEffect(() => {
    if (analyzeMutation.isPending) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, loadingMessages.length - 1));
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
    return undefined;
  }, [analyzeMutation.isPending]);

  function onSubmit(data: FormValues) {
    analyzeMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Analysis complete", description: "Variants generated successfully." });
          queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListTechniquesQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Analysis failed", description: err.message || "An error occurred.", variant: "destructive" });
        },
      }
    );
  }

  const result = analyzeMutation.data;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Editor Pane */}
      <div className="flex flex-col w-full lg:w-5/12 border-r border-border/40 bg-card/30">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0 bg-background/50">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 text-primary font-mono text-sm font-semibold tracking-tight">
                  <Terminal className="w-4 h-4" />
                  <span>INPUT_STREAM</span>
                </div>
                <FormField
                  control={form.control}
                  name="hintLanguage"
                  render={({ field }) => (
                    <FormItem className="flex-1 max-w-[150px]">
                      <FormControl>
                        <Input 
                          placeholder="Language hint..." 
                          {...field} 
                          className="h-7 text-xs font-mono bg-background/50 border-border/40 focus-visible:ring-primary/50 rounded-none" 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
              <Button 
                type="submit" 
                size="sm" 
                disabled={analyzeMutation.isPending}
                className="rounded-none h-8 font-mono text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground ml-4 shrink-0"
              >
                {analyzeMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Activity className="w-3 h-3 animate-pulse" /> Processing
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play className="w-3 h-3 fill-current" /> Analyze
                  </span>
                )}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex-1 overflow-hidden relative">
                  <FormControl>
                    <div className="absolute inset-0 overflow-auto bg-[#1e1e1e]">
                      <CodeEditor
                        value={field.value}
                        language={form.watch("hintLanguage") || "javascript"}
                        placeholder="Paste your code here..."
                        onChange={(evn) => field.onChange(evn.target.value)}
                        padding={24}
                        style={{
                          fontSize: 14,
                          backgroundColor: "transparent",
                          fontFamily: "var(--app-font-mono)",
                          minHeight: "100%"
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="absolute bottom-4 left-4 right-4 bg-destructive/90 text-destructive-foreground p-2 text-xs font-mono z-10" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Results Pane */}
      <div className="flex-1 overflow-y-auto bg-background/50 relative">
        {analyzeMutation.isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="max-w-md w-full p-8 border border-primary/20 bg-card/80 shadow-2xl">
              <div className="flex items-center justify-center mb-6">
                <Cpu className="w-12 h-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-4 font-mono">
                <div className="h-1 w-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                  />
                </div>
                <div className="text-center text-sm text-primary tracking-tight">
                  <span className="opacity-50">[{loadingStep + 1}/{loadingMessages.length}]</span>
                  <br />
                  <span className="animate-pulse">{loadingMessages[loadingStep]}</span>
                </div>
              </div>
            </div>
          </div>
        ) : !result ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <div className="w-24 h-24 mb-6 opacity-20 border border-current rounded-full flex items-center justify-center">
              <Wand2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-mono mb-2 text-foreground">Waiting for Input</h2>
            <p className="text-center max-w-sm text-sm">Paste a program, click analyze, and watch the engine reconstruct it using diverse algorithmic techniques.</p>
          </div>
        ) : (
          <div className="p-6 lg:p-10 space-y-10">
            {/* Analysis Header */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/30 px-3 py-1 text-sm rounded-none">
                  {result.detectedLanguage.toUpperCase()}
                </Badge>
                <div className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {result.variants.length} VARIANTS GENERATED
                </div>
              </div>

              <div className="p-5 border border-border/50 bg-secondary/20">
                <p className="text-lg leading-relaxed">{result.problemSummary}</p>
              </div>

              {result.errorsFound.length > 0 && (
                <Card className="border-destructive/30 bg-destructive/5 rounded-none">
                  <CardHeader className="py-4 border-b border-destructive/20 flex flex-row items-center gap-2">
                    <Bug className="w-4 h-4 text-destructive" />
                    <CardTitle className="text-sm font-mono text-destructive">ERRORS_DETECTED_AND_FIXED</CardTitle>
                  </CardHeader>
                  <CardContent className="py-4">
                    <ul className="list-disc list-inside space-y-1 text-sm font-mono text-destructive/80 ml-4">
                      {result.errorsFound.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Collapsible className="border border-border/50 bg-card rounded-none">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-mono text-sm hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-2 text-primary">
                    <Zap className="w-4 h-4" />
                    <span>VIEW_REPAIRED_SOURCE</span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border/50">
                    <CodeBlock code={result.fixedCode} language={result.detectedLanguage} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Variants Grid */}
            <div className="space-y-6">
              <h2 className="text-xl font-mono font-bold flex items-center gap-2 border-b border-border/40 pb-4">
                <Cpu className="w-5 h-5 text-primary" />
                <span>ALGORITHMIC_VARIANTS</span>
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {result.variants.map((variant, i) => (
                  <div key={variant.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <VariantCard 
                      variant={variant} 
                      isRecommended={variant.id === result.recommendedVariantId} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface Benchmark {
  timeComplexity: string;
  spaceComplexity: string;
  estimatedTimeMs: number;
  estimatedMemoryKb: number;
  balanceScore: number;
}

export interface Variant {
  id: string;
  technique: string;
  techniqueLabel: string;
  title: string;
  summary: string;
  explanation: string;
  language: string;
  code: string;
  benchmark: Benchmark;
  createdAt: string;
}

export const TECHNIQUES: { slug: string; label: string; description: string }[] = [
  { slug: "searching", label: "Searching", description: "Linear, binary and beyond — finding elements in collections." },
  { slug: "sorting", label: "Sorting", description: "Ordering data: comparison sorts, distribution sorts, hybrids." },
  { slug: "iteration", label: "Iteration", description: "Straightforward loop-driven solutions." },
  { slug: "recursion", label: "Recursion", description: "Self-referential solutions that break a problem into smaller subproblems." },
  { slug: "sliding-window", label: "Sliding Window", description: "Maintain a moving range over a sequence." },
  { slug: "two-pointers", label: "Two Pointers", description: "Two indices traverse a structure to converge on a result." },
  { slug: "dynamic-programming", label: "Dynamic Programming", description: "Optimal substructure with overlapping subproblems." },
  { slug: "tabulation", label: "Tabulation (Bottom-up DP)", description: "Iterative DP filling a table." },
  { slug: "memoization", label: "Memoization (Top-down DP)", description: "Recursive DP caching subresults." },
  { slug: "divide-and-conquer", label: "Divide & Conquer", description: "Split, solve, combine." },
  { slug: "brute-force", label: "Brute Force", description: "Exhaustively try every option — the baseline." },
  { slug: "greedy", label: "Greedy", description: "Locally optimal choices that yield a global optimum." },
  { slug: "trees", label: "Trees", description: "Hierarchical structures — BSTs, traversals, balanced trees." },
  { slug: "graphs", label: "Graphs", description: "Nodes and edges — BFS, DFS, shortest paths." },
  { slug: "stacks", label: "Stacks", description: "LIFO structures for ordered processing." },
  { slug: "queues", label: "Queues", description: "FIFO and priority queues." },
  { slug: "linked-list", label: "Linked List", description: "Pointer-based sequential structures." },
  { slug: "array", label: "Arrays", description: "Contiguous indexable storage — the workhorse." },
  { slug: "hashing", label: "Hashing", description: "Constant-time lookups via hash tables." },
  { slug: "bit-manipulation", label: "Bit Manipulation", description: "Operating directly on bits for speed and elegance." },
  { slug: "backtracking", label: "Backtracking", description: "Recursive search with pruning." },
];

export const TECHNIQUE_LABEL: Record<string, string> = Object.fromEntries(
  TECHNIQUES.map((t) => [t.slug, t.label]),
);

class VariantStore {
  private variants = new Map<string, Variant>();

  add(v: Variant) {
    this.variants.set(v.id, v);
  }

  get(id: string): Variant | undefined {
    return this.variants.get(id);
  }

  all(): Variant[] {
    return Array.from(this.variants.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  byTechnique(technique: string): Variant[] {
    return this.all().filter((v) => v.technique === technique);
  }

  groupedByTechnique(): { technique: string; techniqueLabel: string; variants: Variant[] }[] {
    return TECHNIQUES.map((t) => ({
      technique: t.slug,
      techniqueLabel: t.label,
      variants: this.byTechnique(t.slug),
    }));
  }

  size(): number {
    return this.variants.size;
  }
}

export const variantStore = new VariantStore();

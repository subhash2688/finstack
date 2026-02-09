"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientContext } from "@/types/engagement";
import { generateEngagementId, saveEngagement } from "@/lib/storage/engagements";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function NewEngagementForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClientContext>({
    companyName: "",
    industry: "",
    companySize: "mid-market",
    erp: "",
    monthlyInvoiceVolume: "100-500",
    characteristics: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call workflow generation API
      const response = await fetch("/api/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientContext: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate workflow");
      }

      const { steps, toolMappings } = await response.json();

      // Create engagement with new multi-process format
      const engagement = {
        id: generateEngagementId(),
        name: `${formData.companyName} - AP Assessment`,
        clientContext: formData,
        processAssessments: [
          {
            functionId: "finance" as const,
            processId: "ap",
            processName: "Accounts Payable",
            generatedWorkflow: steps,
            toolMappings,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage
      saveEngagement(engagement);

      // Redirect to engagement workspace (not editor)
      router.push(`/engagements/${engagement.id}`);
    } catch (err) {
      console.error("Failed to create engagement:", err);
      setError(err instanceof Error ? err.message : "Failed to create engagement");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Company Name *
        </label>
        <input
          type="text"
          required
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Industry *</label>
        <select
          required
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select industry...</option>
          <option value="Technology">Technology</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Professional Services">Professional Services</option>
          <option value="Retail">Retail</option>
          <option value="Financial Services">Financial Services</option>
          <option value="E-commerce">E-commerce</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Company Size *</label>
        <div className="grid grid-cols-4 gap-2">
          {(["startup", "smb", "mid-market", "enterprise"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setFormData({ ...formData, companySize: size })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                formData.companySize === size
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent"
              }`}
            >
              {size === "smb" ? "SMB" : size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">ERP System *</label>
        <input
          type="text"
          required
          value={formData.erp}
          onChange={(e) => setFormData({ ...formData, erp: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="e.g., SAP, Oracle NetSuite, QuickBooks"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Monthly Invoice Volume *
        </label>
        <select
          required
          value={formData.monthlyInvoiceVolume}
          onChange={(e) =>
            setFormData({ ...formData, monthlyInvoiceVolume: e.target.value })
          }
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="< 100">&lt; 100</option>
          <option value="100-500">100-500</option>
          <option value="500-2000">500-2000</option>
          <option value="2000+">2000+</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Client Characteristics
        </label>
        <textarea
          value={formData.characteristics}
          onChange={(e) =>
            setFormData({ ...formData, characteristics: e.target.value })
          }
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Pain points, goals, constraints, specific challenges..."
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Describe their specific challenges to get a more tailored workflow
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating tailored AP workflow...
          </>
        ) : (
          "Generate Workflow"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        This will use AI to create a customized workflow based on your client&apos;s context
      </p>
    </form>
  );
}

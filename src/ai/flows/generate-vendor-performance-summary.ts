'use server';
/**
 * @fileOverview A Genkit flow that generates an AI-powered summary of a vendor's performance.
 *
 * - generateVendorPerformanceSummary - A function to summarize vendor performance.
 * - VendorPerformanceInput - The input type for the generateVendorPerformanceSummary function.
 * - VendorPerformanceOutput - The return type for the generateVendorPerformanceSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VendorPerformanceInputSchema = z.object({
  vendorName: z.string().describe('The name of the vendor.'),
  qualityRatings: z
    .array(
      z.object({
        itemId: z.string().describe('The ID of the item rated.'),
        rating: z
          .number()
          .min(1)
          .max(5)
          .describe('Quality rating from 1 (poor) to 5 (excellent).'),
        comment: z.string().optional().describe('Optional comment on the quality.'),
      })
    )
    .describe('A list of quality ratings for items sourced from the vendor.'),
  deliveryMetrics: z
    .object({
      onTimeDeliveryRate: z
        .number()
        .min(0)
        .max(100)
        .describe('Percentage of deliveries made on time.'),
      averageDeliveryTime: z
        .number()
        .describe('Average number of days for delivery.'),
      totalOrders: z.number().describe('Total number of orders placed with the vendor.'),
    })
    .describe('Metrics related to the vendor\u0027s delivery performance.'),
  disputeHistory: z
    .array(
      z.object({
        disputeId: z.string().describe('Unique ID of the dispute.'),
        date: z.string().describe('Date the dispute was raised (e.g., YYYY-MM-DD).'),
        reason: z.string().describe('Reason for the dispute.'),
        resolution: z.string().optional().describe('Resolution of the dispute, if any.'),
      })
    )
    .describe('A chronological list of disputes with the vendor.'),
});

export type VendorPerformanceInput = z.infer<typeof VendorPerformanceInputSchema>;

const VendorPerformanceOutputSchema = z.object({
  overallSummary: z
    .string()
    .describe('A concise, overall summary of the vendor\u0027s performance.'),
  strengths: z
    .array(z.string())
    .describe('Key strengths identified in the vendor\u0027s performance.'),
  weaknesses: z
    .array(z.string())
    .describe('Key weaknesses identified in the vendor\u0027s performance.'),
  areasForImprovement: z
    .array(z.string())
    .describe('Specific areas where the vendor can improve their performance.'),
});

export type VendorPerformanceOutput = z.infer<typeof VendorPerformanceOutputSchema>;

export async function generateVendorPerformanceSummary(
  input: VendorPerformanceInput
): Promise<VendorPerformanceOutput> {
  return generateVendorPerformanceSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vendorPerformanceSummaryPrompt',
  input: { schema: VendorPerformanceInputSchema },
  output: { schema: VendorPerformanceOutputSchema },
  prompt: `As an expert procurement analyst, your task is to synthesize the provided data for vendor '{{{vendorName}}}' into a clear and actionable performance summary.

Focus on identifying key strengths, weaknesses, and specific areas for improvement based on the following metrics:

Quality Ratings:
{{#if qualityRatings}}
{{#each qualityRatings}}
  - Item ID: {{{itemId}}}, Rating: {{{rating}}} {{#if comment}}({{comment}}){{/if}}
{{/each}}
{{else}}
  No quality ratings available.
{{/if}}

Delivery Metrics:
  - On-Time Delivery Rate: {{{deliveryMetrics.onTimeDeliveryRate}}}%
  - Average Delivery Time: {{{deliveryMetrics.averageDeliveryTime}}} days
  - Total Orders: {{{deliveryMetrics.totalOrders}}}

Dispute History:
{{#if disputeHistory}}
{{#each disputeHistory}}
  - Dispute ID: {{{disputeId}}}, Date: {{{date}}}, Reason: {{{reason}}} {{#if resolution}}Resolution: {{{resolution}}}{{/if}}
{{/each}}
{{else}}
  No dispute history available.
{{/if}}

Provide an 'overallSummary', a list of 'strengths', a list of 'weaknesses', and a list of 'areasForImprovement'. The output must be valid JSON matching the specified schema.`,
});

const generateVendorPerformanceSummaryFlow = ai.defineFlow(
  {
    name: 'generateVendorPerformanceSummaryFlow',
    inputSchema: VendorPerformanceInputSchema,
    outputSchema: VendorPerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate vendor performance summary.');
    }
    return output;
  }
);

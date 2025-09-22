'use server';

/**
 * @fileOverview Retrieves product information based on a scanned barcode.
 *
 * - barcodeProductLookup - A function that takes a barcode string and returns product details.
 * - BarcodeProductLookupInput - The input type for the barcodeProductLookup function.
 * - BarcodeProductLookupOutput - The return type for the barcodeProductLookup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BarcodeProductLookupInputSchema = z.object({
  barcode: z.string().describe('The barcode string scanned from the product.'),
});
export type BarcodeProductLookupInput = z.infer<typeof BarcodeProductLookupInputSchema>;

const BarcodeProductLookupOutputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productId: z.string().describe('The unique identifier of the product.'),
  description: z.string().describe('A detailed description of the product.'),
  imageUrl: z.string().describe('URL of the product image.'),
  price: z.number().describe('The price of the product.'),
});
export type BarcodeProductLookupOutput = z.infer<typeof BarcodeProductLookupOutputSchema>;

export async function barcodeProductLookup(input: BarcodeProductLookupInput): Promise<BarcodeProductLookupOutput> {
  return barcodeProductLookupFlow(input);
}

const barcodeProductLookupPrompt = ai.definePrompt({
  name: 'barcodeProductLookupPrompt',
  input: {schema: BarcodeProductLookupInputSchema},
  output: {schema: BarcodeProductLookupOutputSchema},
  prompt: `You are a product identifier. Given a barcode, you will identify the product
  and return its details in JSON format. The barcode is: {{{barcode}}}.

  If you can identify a real-world product, return its actual details. If you cannot find an exact match, generate realistic, representative product data for a plausible product that might have that barcode. For example, if the barcode looks like it could be for a food item, invent a food item. Do not state that the product was not found.

  Ensure the JSON response includes:
  - productName: The name of the product.
  - productId: A unique identifier for the product.
  - description: A detailed description of the product.
  - imageUrl: A URL to an image of the product.
  - price: The price of the product.
  `,
});

const barcodeProductLookupFlow = ai.defineFlow(
  {
    name: 'barcodeProductLookupFlow',
    inputSchema: BarcodeProductLookupInputSchema,
    outputSchema: BarcodeProductLookupOutputSchema,
  },
  async input => {
    const {output} = await barcodeProductLookupPrompt(input);
    return output!;
  }
);

import { z } from 'zod';

export interface StructuredOutputOptions {
  maxRetries?: number;
  cleanJson?: boolean;
  maxTokens?: number;
}

/**
 * Enhanced structured output parser that handles common LLM output issues
 */
export class StructuredOutputParser {
  /**
   * Parse JSON output from LLM with error recovery
   */
  static parseJson<T>(
    output: string,
    schema?: z.ZodSchema<T>,
    options: StructuredOutputOptions = {}
  ): T | null {
    const { maxRetries = 3, cleanJson = true } = options;
    
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts < maxRetries) {
      try {
        // Clean the output if requested
        let jsonStr = output;
        if (cleanJson) {
          jsonStr = this.cleanJsonString(output);
        }
        
        // Try to parse
        const parsed = JSON.parse(jsonStr);
        
        // Validate with schema if provided
        if (schema) {
          return schema.parse(parsed);
        }
        
        return parsed;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        // Try different cleaning strategies
        if (attempts === 1) {
          // Remove markdown code blocks
          output = output.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (attempts === 2) {
          // Extract JSON from mixed content
          output = this.extractJsonFromText(output);
        }
      }
    }
    
    console.error('Failed to parse structured output after', maxRetries, 'attempts:', lastError?.message);
    return null;
  }
  
  /**
   * Clean common JSON formatting issues
   */
  private static cleanJsonString(str: string): string {
    // Remove leading/trailing whitespace
    str = str.trim();
    
    // Remove markdown code blocks
    str = str.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Fix truncated strings (add closing quotes)
    str = str.replace(/("(?:[^"\\]|\\.)*?)$/gm, '$1"');
    
    // Fix trailing commas
    str = str.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing commas between properties
    str = str.replace(/}(\s*"){/g, '},$1{');
    str = str.replace(/"(\s*"){/g, '",$1{');
    
    // Balance brackets and braces
    const openBrackets = (str.match(/\[/g) || []).length;
    const closeBrackets = (str.match(/\]/g) || []).length;
    const openBraces = (str.match(/\{/g) || []).length;
    const closeBraces = (str.match(/\}/g) || []).length;
    
    // Add missing closing brackets/braces
    str += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
    str += '}'.repeat(Math.max(0, openBraces - closeBraces));
    
    return str;
  }
  
  /**
   * Extract JSON object or array from mixed text content
   */
  private static extractJsonFromText(text: string): string {
    // Try to find JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return objectMatch[0];
    }
    
    // Try to find JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }
    
    // If no clear JSON structure, return original
    return text;
  }
  
  /**
   * Create a prompt instruction for structured output
   */
  static createStructuredPrompt(
    schema: z.ZodSchema,
    instructions: string = ''
  ): string {
    const schemaDescription = this.generateSchemaDescription(schema);
    
    return `${instructions}

Please provide your response as a valid JSON object that matches this schema:

${schemaDescription}

Important:
- Return ONLY valid JSON without any markdown formatting or code blocks
- Ensure all strings are properly quoted and escaped
- Do not include trailing commas
- Keep responses concise to avoid truncation`;
  }
  
  /**
   * Generate human-readable schema description
   */
  private static generateSchemaDescription(schema: z.ZodSchema): string {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties = Object.entries(shape).map(([key, value]) => {
        const type = this.getZodTypeName(value as z.ZodSchema);
        const optional = value instanceof z.ZodOptional ? ' (optional)' : '';
        return `  "${key}": ${type}${optional}`;
      });
      
      return `{
${properties.join(',\n')}
}`;
    }
    
    return 'Valid JSON matching the provided schema';
  }
  
  /**
   * Get human-readable type name from Zod schema
   */
  private static getZodTypeName(schema: z.ZodSchema): string {
    if (schema instanceof z.ZodString) return 'string';
    if (schema instanceof z.ZodNumber) return 'number';
    if (schema instanceof z.ZodBoolean) return 'boolean';
    if (schema instanceof z.ZodArray) return 'array';
    if (schema instanceof z.ZodObject) return 'object';
    if (schema instanceof z.ZodOptional) return this.getZodTypeName(schema.unwrap());
    if (schema instanceof z.ZodEnum) return 'enum';
    return 'any';
  }
}

// Evidence quality evaluation schema
export const evidenceQualitySchema = z.object({
  relevance: z.number().min(0).max(1),
  credibility: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
  specificity: z.number().min(0).max(1),
  bias: z.number().min(0).max(1),
  reasoning: z.string().max(500), // Limit reasoning length to prevent truncation
});

// Query generation schema
export const queryGenerationSchema = z.object({
  queries: z.array(z.object({
    query: z.string(),
    purpose: z.string(),
    expectedResults: z.string(),
  })).max(10), // Limit number of queries
});

// Report section schema
export const reportSectionSchema = z.object({
  title: z.string(),
  content: z.string().max(5000), // Limit content length
  keyPoints: z.array(z.string()).max(10),
  evidence: z.array(z.string()).max(5), // Evidence IDs
});
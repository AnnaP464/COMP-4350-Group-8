// validateRequest.ts
import type { RequestHandler } from "express";
import { ZodError, ZodTypeAny, ZodIssue } from "zod";

/**
 * The shape of schemas you can pass in for each request "segment".
 * Provide only what you need for a given route.
 */
export type RequestSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
  headers?: ZodTypeAny;
};

//toggles for validate options just in 
export type ValidateOptions = {
  respondWithJsonError?: boolean;
  assignParsedData?: boolean;
  detailedErrors?: boolean;
};

/**
 * JSON for Zod errors
 *  if detailed == TRUE, makes a nicer format . Change this to match API .
 */
function formatZodError(err: ZodError, detailed: boolean) {
  if (!detailed) {
    return { message: "Invalid request", errors: err.errors.map(e => e.message) };
  }
  return {
    message: "Invalid request",
    errors: err.errors.map((issue: ZodIssue) => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
      expected: (issue as any).expected,
      received: (issue as any).received,
    })),
  };
}

/**
 * Factory that returns an Express middleware which validates the request.
 *
 * You can provide any subset of schemas for body, query, params, headers.
 * If a schema is not provided, that segment is not validated.
 */
export function validateRequest(
  schemas: RequestSchemas,
  options: ValidateOptions = {}
): RequestHandler {
  const {
    respondWithJsonError = true,
    assignParsedData = true,
    detailedErrors = true,
  } = options;

  return (req, res, next) => {
    try {
      // We validate each present schema independently so errors are aggregated
      // the client sees everything wrong with their input at once.
      const segmentResults: Array<{ segment: keyof RequestSchemas; ok: boolean; data?: any; error?: ZodError }> = [];

      ([
        ["body", schemas.body],
        ["query", schemas.query],
        ["params", schemas.params],
        ["headers", schemas.headers],
      ] as const).forEach(([segment, schema]) => {
        if (!schema) return; //potential bug, returns if no schema found, but request may have headers without query 

        const value =
          segment === "headers"
            ? req.headers
            : (req as any)[segment];

        const parsed = schema.safeParse(value);
        if (parsed.success) {
          segmentResults.push({ segment, ok: true, data: parsed.data });
        } else {
          segmentResults.push({ segment, ok: false, error: parsed.error });
        }
      });

      // If any validation failed, merge errors
      const failures = segmentResults.filter(r => !r.ok);
      if (failures.length > 0) {

        // Merge issues from all failing segments into one ZodError array.
        const mergedIssues = failures.flatMap(f => {
          // Prefix each path with the segment name so the client knows where it failed.
          return (f.error as ZodError).issues.map(issue => ({
            ...issue,
            path: [f.segment as string, ...issue.path],
          }));
        });

        const merged = new ZodError(mergedIssues);
        const payload = formatZodError(merged, detailedErrors);

        if (respondWithJsonError) {
          return res.status(400).json(payload);
        }
        return next(merged);
      }

      // Success: optionally assign parsed/coerced values back to req.*.
      if (assignParsedData) {
        for (const r of segmentResults) {
          if (r.ok) {
            if (r.segment === "headers") {
              //
              (req as any).headers = r.data;
            } else {
              (req as any)[r.segment] = r.data;
            }
          }
        }
      }

      return next();
    } catch (err) {
      // catch unexpected runtime errors in the validator itself.
      return next(err);
    }
  };
}

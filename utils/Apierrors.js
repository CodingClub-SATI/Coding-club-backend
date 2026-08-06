/* 
The backend's validateBody middleware responds to failed validation with { message: "Validation failed.", errors: <zod issues[]> }, where each issue has a `path` array (e.g. ["skills"] or ["skills", 0]) and a `message`.
This turns Validation error into a flat { fieldName: message } map so forms can show the actual reason a save failed instead of a generic error string.
*/

export function fieldErrorsFromApiError(err) {
  const issues = err?.body?.errors;
  if (!Array.isArray(issues)) return {};
  const fieldErrors = {};
  for (const issue of issues) {
    const field = Array.isArray(issue?.path) ? issue.path[0] : undefined;
    if (typeof field === 'string' && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}
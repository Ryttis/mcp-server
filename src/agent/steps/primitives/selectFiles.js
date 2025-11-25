/**
 * Primitive Step: selectFiles (v1)
 *
 * Purpose:
 * - choose files for this run
 * - for v1, we simply return the user's targetFiles or all files later via scanner
 */

export async function run(context, options = {}) {
    // For now: select targetFiles if provided
    const files = context.options.targetFiles || [];

    context.selectedFiles = files;

    return {
        mutations: {
            selectedFiles: files
        }
    };
}

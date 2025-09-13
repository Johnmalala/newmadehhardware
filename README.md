# newmadehhardware

## Troubleshooting

### Supabase 'Failed to fetch' / CORS Error

If you encounter a `TypeError: Failed to fetch` error when the application tries to communicate with Supabase (e.g., when saving a form), it is likely a Cross-Origin Resource Sharing (CORS) issue.

This happens because the Supabase project, by default, may not trust the URL of the development environment.

**Solution:**

1.  Go to your Supabase Project Dashboard.
2.  Navigate to **Project Settings** > **API**.
3.  Find the **CORS Origins** section.
4.  Add a new pattern: `*`
5.  This will allow requests from any origin, resolving the issue for your development environment. For production, it's recommended to use your specific application URL instead of a wildcard.

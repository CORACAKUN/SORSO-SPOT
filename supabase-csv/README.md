# Sorso Spot Supabase CSV Starters

These CSV files are starter seed data for Supabase.

Recommended import order:

1. `profiles.csv`
2. `destinations.csv`
3. `activities.csv`
4. `accommodations.csv`
5. `transport_routes.csv`
6. `reviews.csv`
7. `favorites.csv`
8. `submissions.csv`

Notes:

- CSV import is useful for sample data, but Supabase security rules should still be created with SQL Row Level Security policies.
- The CSV files do not include `id` columns because Supabase can auto-generate them.
- Files that need relationships use readable columns like `destination_slug` or `user_email` for import convenience.
- In the final database, `reviews`, `favorites`, and `submissions` should use real foreign keys such as `user_id` and `destination_id`.
- For early testing, you can import the public content tables first: `destinations`, `activities`, `accommodations`, and `transport_routes`.
- Use `uuid` columns for `id` fields when creating the tables.
- Use `timestamptz` columns for `created_at`, `updated_at`, and `submitted_at`.

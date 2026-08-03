-- Private compliance evidence. Application server uploads with service_role;
-- no public object policy is intentionally provided.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'compliance-photos',
  'compliance-photos',
  false,
  5000000,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

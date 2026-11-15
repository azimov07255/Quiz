-- IELTS kitoblari (PDF): shaxsiy bulut ombori. Fayl yo‘li: <user_id>/<kitob_id>.pdf — faqat egasi (va ielts ruxsati bor) o‘qiy/yoza oladi.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ielts-books', 'ielts-books', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 52428800, allowed_mime_types = array['application/pdf'];

drop policy if exists ielts_books_own on storage.objects;
create policy ielts_books_own on storage.objects for all to authenticated
  using (bucket_id = 'ielts-books' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.can_ielts()))
  with check (bucket_id = 'ielts-books' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.can_ielts()));

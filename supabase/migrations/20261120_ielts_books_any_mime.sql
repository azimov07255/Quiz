-- Cambridge testlari (JSON) va audio ham shaxsiy omborda (<user_id>/cam/...) saqlanadi: MIME cheklovi olib tashlandi (RLS papka bo‘yicha).
update storage.buckets set allowed_mime_types = null, file_size_limit = 52428800 where id = 'ielts-books';

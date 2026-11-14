-- Sinov hisoblari (parol: Sinov-12345). Faqat tests/cloud.cjs uchun. Supabase SQL muharririda ishga tushiring.
insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated','authenticated', e, crypt('Sinov-12345', gen_salt('bf')), now(),
 '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', n), now(), now(), '','','',''
from (values ('zz.owner@quiz.test','Sinov Owner'),('zz.user@quiz.test','Sinov User'),('zz.pending@quiz.test','Sinov Pending')) v(e,n);
update public.profiles set role='owner', lifetime=true, pending=false, expires_at=null where email='zz.owner@quiz.test';
update public.profiles set pending=false, expires_at=null where email='zz.user@quiz.test';

-- Sinovdan keyin TOZALASH:
-- delete from public.payments where email like 'zz.%@quiz.test';
-- delete from public.catalog_subjects;   (agar sinov katalogi qolgan bo‘lsa)
-- delete from auth.users where email like 'zz.%@quiz.test';

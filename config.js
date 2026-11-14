// Supabase loyihasi (testlar-app). Bu "publishable" kalit ochiq bo‘lishi uchun mo‘ljallangan — ma’lumotni RLS himoyalaydi.
// Maxfiy kalit (service_role / secret) bu yerga HECH QACHON yozilmaydi.
window.TESTLAR_CONFIG = {
  url: 'https://hxywksrsgixwmmvvpajc.supabase.co',
  key: 'sb_publishable_PBAHG1CGi1X65_-bq5rbRg_nVKL5pIQ',
  loginDomain: 'testlar.internal',   // “ozod1” kabi loginlar ichkarida ozod1@testlar.internal bo‘lib saqlanadi (.internal — pochta qabul qila olmaydi)
  allowSignup: false   // false: hisobni faqat owner ochib beradi (ilovada “Ro‘yxatdan o‘tish” ko‘rinmaydi)
};

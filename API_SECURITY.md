# Aturan Keamanan API Key & Rate Limit (RoastX)

Untuk mencegah API Key Gemini terblokir (403 Leaked) atau sering kena limit (429 Quota Exceeded), terapkan SOP berikut:

## 1. PENCEGAHAN BOCOR (LEAK)

- **DILARANG KERAS** mem-push file yang berisi API key asli ke GitHub.
- File-file ini **TIDAK BOLEH** ada di repository publik:
  - `.env`
  - `.env.local`
  - `.dev.vars` (khusus Wrangler / Cloudflare Pages lokal)
  - _File-file ini sudah masuk `.gitignore` secara otomatis._
- **Jangan pernah** menaruh API key ke dalam kode Front-End (file `.tsx`, `.ts`, `.html`). Semua request LLM harus lewat route backend (`functions/api/roast.ts`).
- Jika key sudah terlanjur bocor dan di-push ke GitHub, segera **Hapus/Revoke** API key tersebut di Google AI Studio, lalu generate yang baru. (Menghapus dari code commit history tidak cukup aman).

## 2. MANAJEMEN LOKAL (Local Development)

- Pada saat testing lokal menggunakan Vite (`npm run dev`), gunakan `.env.local`.
- Pada saat testing lokal Cloudflare dengan Wrangler (`npm run preview` / `npx wrangler pages dev`), masukkan keys di file `.dev.vars`:
  ```env
  GEMINI_API_KEY_1=your_new_key_here
  GEMINI_API_KEY_2=your_new_key_two_here
  ```

## 3. MANAJEMEN PRODUKSI (Cloudflare Dashboard)

- Untuk deploy web di internet (Cloudflare Pages), tambahkan key lewat dashboard.
- Masuk ke: **Cloudflare Dashboard > Pages > roastx > Settings > Environment Variables > Production**.
- Tambahkan variable dengan tepat:
  - **Variable name:** `GEMINI_API_KEY_1` | **Value:** `(Isi Key ke-1)`
  - **Variable name:** `GEMINI_API_KEY_2` | **Value:** `(Isi Key ke-2)`
  - (Dan seterusnya sampai GEMINI_API_KEY_5)
- Setiap kali menambahkan variabel baru, **wajib melakukan redeploy** agar environment variable terbaca oleh backend worker.

## 4. SISTEM AUTO-SWITCH API KEY

- Script `roast.ts` dirancang untuk memutar 5 API Key yang berbeda secara berurutan.
- Jika `GEMINI_API_KEY_1` kena limit (429), sistem otomatis pindah membakar request dengan `GEMINI_API_KEY_2`, dsb.
- Semakin banyak akun Google / API Key yang dimasukkan (max 5), semakin tebal batas rate-limit yang bisa ditahan aplikasi ini tiap menitnya.
- Pastikan kamu sering login ke Google AI Studio untuk mengecek status quota harian maupun bulanan di tiap key.

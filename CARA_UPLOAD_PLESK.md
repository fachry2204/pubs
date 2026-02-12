# Panduan Upload ke Plesk (Single Domain - Backend + Frontend)

Panduan ini untuk konfigurasi **Satu Domain** (misal: `domainanda.com`).
Backend Node.js akan melayani Frontend React secara otomatis.
**Semua proses Build dilakukan di Plesk.**

---

## 1. Persiapan Database (MySQL)

1.  **Export Database Lokal**:
    *   Gunakan file `backend/pubs_db_dump.sql` (otomatis terbuat saat Anda menjalankan `npm run build` di lokal sebelumnya) ATAU export manual via phpMyAdmin.
2.  **Buat Database di Plesk**:
    *   Menu **Databases** -> **Add Database**.
    *   Buat user dan password database. **CATAT!**
3.  **Import Database (Otomatis)**:
    *   Pastikan Anda sudah mengisi **Environment Variables** (Langkah 3.3).
    *   Pastikan file `backend/pubs_db_dump.sql` sudah terupload.
    *   Buka menu **Node.js** di Plesk.
    *   Klik **Run Script**.
    *   Pilih script: **init:db**.
    *   Tunggu proses import selesai.
    *   *(Alternatif Manual: Menu Import Dump -> Upload file `.sql` Anda)*.

---

## 2. Upload Kode Sumber

Kita akan mengupload **seluruh folder project** ke Plesk.

1.  **Compress Project**:
    *   Zip folder project `pubs` Anda (kecuali `node_modules` di root dan `backend/node_modules`).
    *   Pastikan folder `backend`, `src`, `public`, `package.json`, `vite.config.ts`, dll terbawa.

2.  **Upload ke Plesk**:
    *   Buka **File Manager**.
    *   Masuk ke folder `httpdocs` (kosongkan isinya dulu jika ada file default).
    *   Upload file ZIP Anda dan **Extract** di sini.
    *   Pastikan struktur folder di dalam `httpdocs` terlihat seperti ini:
        ```text
        /httpdocs
          ├── backend/       <-- Folder backend
          ├── src/           <-- Source React
          ├── package.json   <-- Package json utama
          ├── vite.config.ts <-- Config Vite
          └── ...
        ```

---

## 3. Setup Node.js di Plesk

1.  **Aktifkan Node.js**:
    *   Buka menu **Node.js**.
    *   Klik **Enable Node.js**.
    *   **Document Root**: `/httpdocs/backend/public` (Penting! Agar Node.js berjalan tapi public root aman).
    *   **Application Root**: `/httpdocs`.
    *   **Application Startup File**: `backend/src/app.js`.

2.  **Install Dependencies**:
    *   Klik tombol **NPM Install**.
    *   Ini akan menginstall dependency untuk root (Frontend) dan backend (jika dikonfigurasi).
    *   *Catatan*: Jika Plesk gagal menginstall dependency backend secara otomatis, Anda mungkin perlu masuk via SSH atau Terminal di Plesk:
        ```bash
        cd httpdocs
        npm install
        cd backend
        npm install
        ```

3.  **Setup Environment Variables**:
    *   Di menu Node.js, klik **Environment variables**.
    *   Tambahkan:
        ```text
        DB_HOST=localhost
        DB_USER=u12345_user      <-- User DB Plesk
        DB_PASSWORD=password123  <-- Pass DB Plesk
        DB_NAME=u12345_db        <-- Nama DB Plesk
        NODE_ENV=production
        PORT=3000                <-- Port default
        JWT_SECRET=rahasia_anda
        ```

---

## 4. Build Frontend di Plesk

Karena kita ingin build di server, kita perlu menjalankan perintah build di Plesk.

1.  **Jalankan Build Script**:
    *   Buka menu **Node.js**.
    *   Klik tombol **Run Script**.
    *   Pilih script: **build** (Script ini sudah dioptimalkan untuk Plesk: Install + Build Frontend).
    *   Tunggu hingga proses selesai. Ini akan:
        1.  Menginstall dependency.
        2.  Melakukan build React (Vite).
        3.  Hasil build akan masuk ke folder `frontend_dist` (karena kita akan ubah output build).

    *Jika tombol Run Script tidak ada atau gagal:*
    *   Buka **Terminal** (jika akses tersedia) atau **SSH**.
    *   Jalankan:
        ```bash
        cd httpdocs
        npm run build
        ```

---

## 5. Verifikasi

Backend Node.js Anda sekarang sudah dikonfigurasi untuk:
1.  Menangani request API di `/api/...`
2.  Melayani file Frontend React untuk request lainnya (`*`).

Akses domain Anda (`https://domainanda.com`). Aplikasi seharusnya sudah berjalan!

---

### Troubleshooting

*   **Error "We're sorry, but something went wrong"**:
    *   Ini berarti aplikasi Node.js **CRASH** saat baru menyala.
    *   **Solusi Node.js v25+ (UPDATE)**: Kode sudah saya update untuk support Node.js versi terbaru (v25). Saya sudah mengganti `bcrypt` (native) dengan `bcryptjs` (JavaScript murni) dan menghapus `sharp`.
    *   **Langkah Perbaikan**:
        1.  **Upload Ulang** file `backend/package.json` dan folder `backend/src` ke Plesk (overwrite file lama).
        2.  Masuk ke folder `backend` di File Manager Plesk.
        3.  **HAPUS** folder `node_modules` di dalam `backend`.
        4.  Klik tombol **NPM Install** lagi (atau jalankan `npm install` di terminal dalam folder `backend`).
        5.  Restart App.
    *   **Penyebab Utama 2 (Dependency Kurang)**: Pastikan folder `backend/node_modules` ada isinya setelah install.
    *   **Cek Log**: Buka menu **Logs** di Plesk jika masih error.

*   **Error 500 / 403 / 404**:
    *   Cek **Logs** di dashboard Plesk.
    *   Pastikan **Document Root** di setting Node.js mengarah ke folder yang ada (`backend/public`).
    *   Pastikan **Application Startup File** benar (`backend/src/app.js`).

*   **Halaman Putih / Blank**:
    *   Pastikan proses **Build** sukses.
    *   Pastikan folder `frontend_dist` (atau `dist`) ada di root `httpdocs`.

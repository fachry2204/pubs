# Panduan Konfigurasi Node.js di Plesk (Pubs System)

Dokumen ini berisi panduan langkah demi langkah untuk mengatur aplikasi **Pubs Publishing System** di hosting yang menggunakan **Plesk** dengan **Node.js**.

---

## 1. Persiapan File
Pastikan struktur file yang diupload ke File Manager Plesk (`httpdocs` atau subdomain) adalah sebagai berikut:

```
/httpdocs (Root Folder Aplikasi)
├── backend/                <-- Folder kode server
│   ├── src/                <-- Source code backend
│   ├── package.json        <-- File konfigurasi depedensi
│   ├── schema.sql          <-- Skema database
│   └── ...
├── frontend_dist/          <-- Folder hasil build React (Rename dari 'dist')
│   ├── index.html
│   ├── assets/
│   └── ...
├── uploads/                <-- Folder untuk menyimpan gambar/file
└── .env                    <-- File konfigurasi environment (PENTING!)
```

---

## 2. Konfigurasi Node.js di Plesk

Buka menu **Node.js** di dashboard Plesk Anda dan atur konfigurasi seperti berikut:

| Pengaturan | Nilai / Value | Keterangan |
| :--- | :--- | :--- |
| **Node.js Version** | `20.x` atau `18.x` | Gunakan versi LTS agar stabil. Hindari versi ganjil/terbaru jika tidak perlu. |
| **Document Root** | `/httpdocs` | Folder utama tempat aplikasi berada. |
| **Application Mode** | `production` | Agar performa maksimal & error detail disembunyikan. |
| **Application URL** | `http://domain-anda.com` | URL publik website Anda. |
| **Application Root** | `/httpdocs` | Sama dengan document root. |
| **Application Startup File** | `backend/src/app.js` | **PENTING!** Ini file utama yang menjalankan server. |

---

## 3. Konfigurasi Environment Variable (.env)

Klik tombol **"Custom environment variables"** di menu Node.js, lalu tambahkan:

```ini
DB_HOST=localhost
DB_USER=nama_user_database_plesk
DB_PASSWORD=password_database_plesk
DB_NAME=nama_database_plesk
PORT=3000
JWT_SECRET=rahasia_super_aman_bebas_ketik_apa_saja
```
> **Catatan:** Sesuaikan `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` dengan database yang Anda buat di menu **Databases** Plesk.

---

## 4. Instalasi & Build

Lakukan langkah ini setiap kali Anda mengupload file baru:

1.  **Install Dependency**:
    *   Klik tombol **NPM Install** di dashboard Node.js.
    *   Tunggu hingga proses selesai (pastikan folder `node_modules` muncul di dalam `backend`).

2.  **Inisialisasi Database (Hanya Sekali / Jika Update Struktur)**:
    *   Klik tombol **Run Script**.
    *   Ketik/Pilih script: `init:db` (atau `migrate`).
    *   Ini akan membuat tabel database otomatis.

3.  **Restart Aplikasi**:
    *   Klik tombol **Restart App**.

---

## 5. Troubleshooting (Jika Error)

### Masalah: "We're sorry, but something went wrong" (Error 500)
*   **Cek Database**: Pastikan tabel `notifications`, `users`, dll sudah ada di phpMyAdmin.
*   **Cek Log**: Klik link "Logs" di dashboard Node.js untuk melihat pesan error spesifik.
*   **Solusi Cepat**: Upload ulang file `backend/src/app.js` versi "Safe Mode" yang menangani error koneksi database.

### Masalah: "404 Page Not Found"
*   **Cek Frontend**: Pastikan folder `frontend_dist` ada di root folder.
*   **Salah Nama**: Jika folder bernama `dist`, ubah namanya menjadi `frontend_dist`.
*   **Salah Path**: Pastikan `app.js` memiliki logika pencarian path frontend yang benar.

### Masalah: Gambar Tidak Muncul
*   Pastikan folder `/uploads` ada dan memiliki permission **Write** (755 atau 777).
*   Path gambar di database harus absolute (contoh: `/uploads/logo.png`), bukan full URL (`http://localhost...`).

---

## 6. Cara Update Aplikasi (Deploy)

1.  **Frontend**:
    *   Di komputer lokal: `npm run build`
    *   Upload isi folder `dist` lokal ke folder `frontend_dist` di Plesk.
2.  **Backend**:
    *   Upload file backend yang berubah ke folder `backend`.
3.  **Restart**:
    *   Selalu klik **Restart App** setelah upload file apapun.

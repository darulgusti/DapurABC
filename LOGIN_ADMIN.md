# 🔐 Fitur Login Admin

## Informasi Login

### Kredensial Default:
- **Username**: `admin`
- **Password**: `admin123`

---

## Cara Menggunakan

### 1. **Buka Login Modal**
- Klik tombol **"🔒 Login Admin"** di sudut kanan atas header
- Modal login akan muncul

### 2. **Masukkan Kredensial**
- Username: `admin`
- Password: `admin123`
- Klik **"Login"**

### 3. **Setelah Login Berhasil**
- Tombol login akan hilang
- Muncul panel **"👤 Admin | Logout"** di bawah header
- Anda sekarang memiliki akses penuh ke fitur admin

### 4. **Fitur Admin**
Setelah login, Anda dapat:
- ✅ Hapus semua data (dengan konfirmasi)
- ✅ Export data ke Excel
- ✅ Import data dari Excel
- ✅ Lihat semua informasi pendaftar

### 5. **Logout**
- Klik tombol **"Logout"** di panel admin
- Status login akan kembali ke mode user

---

## 🔒 Fitur Keamanan

- Session tersimpan di localStorage
- Admin status akan dipertahankan meski refresh halaman
- Logout otomatis dihapus dari localStorage
- Password dihidden saat diinput

---

## 📝 Catatan

- Ini adalah demo aplikasi, gunakan password yang lebih aman untuk production
- Untuk mengubah kredensial, edit file `script.js` pada bagian `ADMIN_CREDENTIALS`
- Sistem login bersifat client-side (simple)

---

**Fitur ditambahkan: 12 April 2026**

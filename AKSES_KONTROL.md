# 🔐 Sistem Akses User vs Admin

## Pembagian Akses

### 👤 **User Biasa (Non-Admin)**
User yang belum login admin hanya bisa:
- ✅ Isi form pendaftaran
- ✅ Submit data pendaftar
- ❌ Melihat data pendaftar
- ❌ Export data
- ❌ Import data
- ❌ Hapus data

**Catatan**: Tab "Data Pendaftar" tidak terlihat untuk user biasa

---

### 👨‍💼 **Admin User (Setelah Login)**
Setelah login dengan kredensial admin:
- ✅ Isi form pendaftaran
- ✅ Submit data pendaftar
- ✅ **Melihat semua data pendaftar**
- ✅ **Export data ke Excel**
- ✅ **Import data dari Excel**
- ✅ **Hapus semua data**

**Catatan**: Tab "Data Pendaftar" muncul hanya untuk admin

---

## Cara Kerja Sistem

### 1. **Saat User Biasa Membuka Aplikasi**
```
[Login Admin Button] ← Di sudut kanan atas
[Form Pendaftaran Tab] ← Visible
[Data Pendaftar Tab] ← HIDDEN
```

- User hanya melihat form pendaftaran
- Tab data pendaftar tidak ada
- Tombol export/import disabled (abu-abu)

### 2. **Saat User Login Sebagai Admin**
```
[Admin Panel: 👤 Admin | Logout] ← Mengganti login button
[Form Pendaftaran Tab]
[Data Pendaftar Tab] ← VISIBLE
```

- Tab data pendaftar muncul
- Tombol export/import aktif (hijau)
- Bisa hapus semua data

### 3. **Saat Admin Logout**
```
[Login Admin Button] ← Kembali
[Form Pendaftaran Tab]
[Data Pendaftar Tab] ← HIDDEN LAGI
```

- Kembali ke mode user biasa
- Tab data otomatis disembunyikan
- Jika sedang di tab data, akan dipindahkan ke form pendaftaran

---

## 🔒 Fitur Keamanan

✅ Tab data hanya muncul untuk admin  
✅ Jika user non-admin coba klik data tab → Peringatan akses ditolak  
✅ Jika admin logout saat di tab data → Otomatis pindah ke form  
✅ Tombol admin disabled untuk non-admin  
✅ Session dipertahankan di localStorage

---

## 📋 File yang Diubah

- `index.html` - Hide/show tab data berdasarkan ID
- `script.js` - Logic akses control & show/hide fitur

**Update: 12 April 2026**

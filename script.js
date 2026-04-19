// IndexedDB Database Setup
let db;
const DB_NAME = 'CrownBasketballDB';
const DB_VERSION = 1;
let registrants = [];

// Pagination variables
let currentPage = 1;
const ITEMS_PER_PAGE = 3;
let totalPages = 1;

// Sort order: 'asc' = terlama ke terbaru, 'desc' = terbaru ke terlama
let sortOrder = 'asc';

function parseTimestamp(ts) {
    if (!ts) return new Date(0);
    // Format: "18/4/2026, 12.44.30"
    const [datePart, timePart] = ts.split(', ');
    if (!datePart || !timePart) return new Date(0);
    const [day, month, year] = datePart.split('/');
    const [hour, min, sec] = timePart.split('.');
    return new Date(year, month - 1, day, hour, min, sec);
}

function toggleSort() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    const btn = document.getElementById('sortBtn');
    const label = document.getElementById('sortLabel');
    if (sortOrder === 'asc') {
        btn.style.background = 'linear-gradient(135deg, #6f42c1, #8e44ad)';
        label.textContent = 'Terlama';
        btn.querySelector('i').className = 'fas fa-sort-amount-up';
    } else {
        btn.style.background = 'linear-gradient(135deg, #e83e8c, #c0392b)';
        label.textContent = 'Terbaru';
        btn.querySelector('i').className = 'fas fa-sort-amount-down';
    }
    currentPage = 1;
    Database.loadAllData();
}

class Database {
    static init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
                this.loadAllData();
            };
            
            request.onupgradeneeded = (e) => {
                db = e.target.result;
                
                if (!db.objectStoreNames.contains('registrants')) {
                    const store = db.createObjectStore('registrants', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('nama', 'nama', { unique: false });
                    store.createIndex('nama_ortu', 'nama_ortu', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }
    
    static loadAllData() {
        const transaction = db.transaction(['registrants'], 'readonly');
        const store = transaction.objectStore('registrants');
        const request = store.getAll();
        
        request.onsuccess = () => {
            registrants = request.result.sort((a, b) => {
                const ta = parseTimestamp(a.timestamp);
                const tb = parseTimestamp(b.timestamp);
                return sortOrder === 'asc' ? ta - tb : tb - ta;
            });
            displayData(registrants);
        };
    }
    
    static async addData(data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registrants'], 'readwrite');
            const store = transaction.objectStore('registrants');
            
            data.timestamp = new Date().toLocaleString('id-ID');
            data.id = Date.now();
            
            const request = store.add(data);
            request.onsuccess = () => {
                resolve(request.result);
                this.loadAllData(); // Auto refresh tabel
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    static async clearAllData() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registrants'], 'readwrite');
            const store = transaction.objectStore('registrants');
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve();
                registrants = [];
                displayData([]);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    static async updateData(id, updatedData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registrants'], 'readwrite');
            const store = transaction.objectStore('registrants');
            const request = store.get(id);
            
            request.onsuccess = () => {
                const data = request.result;
                const newData = { ...data, ...updatedData };
                const updateRequest = store.put(newData);
                
                updateRequest.onsuccess = () => {
                    resolve(updateRequest.result);
                    this.loadAllData();
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    static async deleteData(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registrants'], 'readwrite');
            const store = transaction.objectStore('registrants');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve();
                this.loadAllData();
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    static async getDataById(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registrants'], 'readonly');
            const store = transaction.objectStore('registrants');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

function switchTab(tabName) {
    // Cek apakah user bisa akses tab data
    if (tabName === 'data' && !isAdminLoggedIn) {
        console.warn('Akses ditolak: bukan admin');
        return;
    }
    
    // Remove active from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active to selected tab and content
    const tabBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (tabBtn) {
        tabBtn.classList.add('active');
    }
    
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    if (tabName === 'data') {
        Database.loadAllData();
    }
}

function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 1.1rem;
        font-weight: 600;
        animation: slideIn 0.5s ease;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
        <span>Data berhasil disimpan ke Database Lokal!</span>
    `;
    document.querySelector('.form-container').prepend(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => successDiv.remove(), 500);
    }, 3000);
}

function showErrorMessage(message) {
    // Error message tidak ditampilkan di halaman, hanya di console
    console.error('Error:', message);
}

function displayData(filteredData = registrants) {
    const dataTable = document.getElementById('dataTable');
    const statsBox = document.getElementById('statsBox');
    const totalCount = document.getElementById('totalCount');
    
    // Update total count
    if (registrants.length > 0) {
        totalCount.textContent = registrants.length;
        statsBox.style.display = 'grid';
    } else {
        statsBox.style.display = 'none';
    }
    
    if (filteredData.length === 0) {
        dataTable.innerHTML = `
            <p style="text-align: center; padding: 60px 20px; color: #6c757d; font-size: 1.2rem;">
                Tidak ada data pendaftar. Silakan isi form pendaftaran terlebih dahulu.
            </p>
            <div class="clear-all-btn" onclick="clearAllData()" style="display: none;">Hapus Semua Data</div>
        `;
        updatePagination(0);
        return;
    }
    
    // Pagination logic
    totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    const tableHTML = `
        <div class="table-container">
            <table id="registrantsTable">
                <thead>
                    <tr>
                        <th><i class="fas fa-user"></i> Nama</th>
                        <th><i class="fas fa-calendar-day"></i> TTL</th>
                        <th><i class="fas fa-venus-mars"></i> JK</th>
                        <th><i class="fas fa-ruler-combined"></i> TB/BB</th>
                        <th><i class="fas fa-school"></i> Sekolah</th>
                        <th><i class="fas fa-phone"></i> HP</th>
                        <th><i class="fas fa-user-friends"></i> Nama Ortu</th>
                        <th><i class="fas fa-basketball-ball"></i> Pengalaman</th>
                        <th><i class="fas fa-clock"></i> Waktu</th>
                        <th style="text-align: center;"><i class="fas fa-cogs"></i> Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageData.map((data) => `
                        <tr>
                            <td><strong>${data.nama}</strong></td>
                            <td>${data.ttl}</td>
                            <td>${data.jenis_kelamin}</td>
                            <td>${data.tinggi_berat}</td>
                            <td>${data.sekolah}</td>
                            <td>${data.no_hp}</td>
                            <td>${data.nama_ortu}</td>
                            <td>
                                ${data.pengalaman}
                                ${data.club ? `<br><small style="color: #6c757d;">(${data.club})</small>` : ''}
                            </td>
                            <td style="font-size: 0.85rem; color: #6c757d;">${data.timestamp}</td>
                            <td style="text-align: center;">
                                <button class="action-btn edit-btn" onclick="openEditModal(${data.id})" title="Edit Data">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" onclick="deleteData(${data.id})" title="Hapus Data">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="pagination-container">
            <div class="pagination-info">
                Halaman ${currentPage} dari ${totalPages} 
                (${filteredData.length} total data)
            </div>
            <button class="pagination-btn" id="prevBtn" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
            <div style="display: flex; gap: 5px; font-weight: 600;">
                ${Array.from({length: totalPages}, (_, i) => `
                    <button class="pagination-btn ${i + 1 === currentPage ? 'active' : ''}"
                            onclick="goToPage(${i + 1})">
                        ${i + 1}
                    </button>
                `).join('')}
            </div>
            <button class="pagination-btn" id="nextBtn" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <button class="clear-all-btn" onclick="clearAllData()">
            <i class="fas fa-trash"></i> Hapus Semua Data (${filteredData.length})
        </button>
    `;
    
    dataTable.innerHTML = tableHTML;
    
    // Event listeners untuk pagination buttons
    if (document.getElementById('prevBtn')) {
        document.getElementById('prevBtn').onclick = () => goToPage(currentPage - 1);
    }
    if (document.getElementById('nextBtn')) {
        document.getElementById('nextBtn').onclick = () => goToPage(currentPage + 1);
    }
    
    updatePagination(filteredData.length);
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    
    // Re-render dengan page baru
    if (registrants.length > 0) {
        displayData(registrants);
    }
}

function updatePagination(totalData) {
    // Update logic sudah dihandle di displayData
}

async function clearAllData() {
    if (confirm('⚠️ Yakin ingin menghapus SEMUA data pendaftar?\n\nData tidak bisa dikembalikan!')) {
        try {
            await Database.clearAllData();
            showSuccessMessageClear();
            currentPage = 1;
        } catch (error) {
            showErrorMessage('Gagal menghapus data: ' + error.message);
        }
    }
}

function showSuccessMessageClear() {
    const msg = document.createElement('div');
    msg.style.cssText = `
        background: linear-gradient(135deg, #ffc107, #fd7e14);
        color: #333;
        padding: 20px;
        border-radius: 12px;
        margin: 20px 0;
        text-align: center;
        font-weight: 600;
        font-size: 1.1rem;
        box-shadow: 0 5px 15px rgba(255,193,7,0.4);
    `;
    msg.innerHTML = `
        <i class="fas fa-trash" style="font-size: 1.5rem; color: #dc3545;"></i>
        <div>Semua data (${registrants.length}) telah dihapus!</div>
    `;
    document.querySelector('.data-container').prepend(msg);
    setTimeout(() => msg.remove(), 4000);
}

async function searchData() {
    const filter = document.getElementById('searchFilter').value;
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    
    currentPage = 1; // Reset pagination
    
    if (query === '') {
        Database.loadAllData();
        return;
    }
    
    // Filter data secara lokal (cepat untuk demo)
    const results = registrants.filter(data => 
        data[filter].toLowerCase().includes(query)
    );
    
    displayData(results);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    currentPage = 1;
    Database.loadAllData();
}

function exportToExcel() {
    if (!registrants.length) {
        alert('Tidak ada data untuk diexport!');
        return;
    }
    // Buat array header dan data
    const header = [
        'Nama', 'TTL', 'Jenis Kelamin', 'Tinggi/Berat', 'Sekolah', 'No HP', 'Alamat', 'Pengalaman', 'Club', 'Nama Ortu', 'Pekerjaan Ortu', 'No HP Ortu', 'Waktu'
    ];
    const data = registrants.map(r => [
        r.nama || '',
        r.ttl || '',
        r.jenis_kelamin || '',
        r.tinggi_berat || '',
        r.sekolah || '',
        r.no_hp || '',
        r.alamat || '',
        r.pengalaman || '',
        r.club || '',
        r.nama_ortu || '',
        r.pekerjaan_ortu || '',
        r.no_hp_ortu || '',
        r.timestamp || ''
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pendaftar');
    XLSX.writeFile(wb, 'data_pendaftar_crown_basketball.xlsx');
}

function importFromExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const binaryString = event.target.result;
                const workbook = XLSX.read(binaryString, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                
                if (jsonData.length === 0) {
                    alert('⚠️ File Excel kosong atau format tidak sesuai');
                    return;
                }
                
                let successCount = 0;
                let errorCount = 0;
                const importedIds = [];
                
                for (const row of jsonData) {
                    try {
                        const newData = {
                            nama: row['Nama'] || row['nama'] || '',
                            ttl: row['TTL'] || row['ttl'] || '',
                            jenis_kelamin: row['Jenis Kelamin'] || row['jenis_kelamin'] || '',
                            tinggi_berat: row['Tinggi/Berat'] || row['tinggi_berat'] || '',
                            sekolah: row['Sekolah'] || row['sekolah'] || '',
                            no_hp: row['No HP'] || row['no_hp'] || '',
                            alamat: row['Alamat'] || row['alamat'] || '',
                            pengalaman: row['Pengalaman'] || row['pengalaman'] || '',
                            club: row['Club'] || row['club'] || '',
                            nama_ortu: row['Nama Ortu'] || row['nama_ortu'] || '',
                            pekerjaan_ortu: row['Pekerjaan Ortu'] || row['pekerjaan_ortu'] || '',
                            no_hp_ortu: row['No HP Ortu'] || row['no_hp_ortu'] || '',
                            source: 'imported' // Mark as imported
                        };
                        
                        // Validasi minimal
                        if (newData.nama && newData.sekolah) {
                            const id = await Database.addData(newData);
                            importedIds.push(id);
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    } catch (err) {
                        errorCount++;
                        console.error('Error importing row:', err);
                    }
                }
                
                // Refresh data
                Database.loadAllData();
                
                // Show success message with detailed info
                const importMsg = document.createElement('div');
                importMsg.style.cssText = `
                    background: linear-gradient(135deg, #17a2b8, #20c997);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-size: 1.05rem;
                    font-weight: 600;
                    animation: slideIn 0.5s ease;
                `;
                importMsg.innerHTML = `
                    <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
                    <div>
                        <div>✅ Import Excel berhasil!</div>
                        <div style="font-size: 0.9rem; margin-top: 5px;">
                            ${successCount} data berhasil diimport${errorCount > 0 ? ` | ${errorCount} data gagal` : ''}
                        </div>
                        <div style="font-size: 0.85rem; margin-top: 8px; opacity: 0.9;">
                            💡 Data yang diimport sekarang bisa diedit dan dihapus sama seperti data lainnya
                        </div>
                    </div>
                `;
                document.querySelector('.data-container').prepend(importMsg);
                
                // Auto hide message
                setTimeout(() => {
                    importMsg.style.animation = 'slideOut 0.5s ease';
                    setTimeout(() => importMsg.remove(), 500);
                }, 5000);
                
                // Switch to data tab to show imported data
                setTimeout(() => {
                    switchTab('data');
                    currentPage = 1;
                }, 1500);
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            alert('❌ Error membaca file: ' + error.message);
        }
    };
    input.click();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', submitForm);
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchData);
    }
    
    const searchFilter = document.getElementById('searchFilter');
    if (searchFilter) {
        searchFilter.addEventListener('change', searchData);
    }
    
    // Responsive radio button handling
    document.querySelectorAll('input[name="pengalaman"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const clubInput = document.getElementById('club');
            if (this.value === 'Ya') {
                clubInput.disabled = false;
                clubInput.required = true;
                clubInput.focus();
            } else {
                clubInput.disabled = true;
                clubInput.required = false;
                clubInput.value = '';
            }
        });
    });
});

// Initialize Database
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await Database.init();
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(-20px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Initialize admin UI
        if (localStorage.getItem('adminLoggedIn') === 'true') {
            isAdminLoggedIn = true;
        }
        updateAdminUI();
        
        console.log('🏀 Crown Basketball Academy - Database Ready!');
        console.log(`📊 Database: ${DB_NAME} v${DB_VERSION}`);
        console.log(`📱 Pagination: ${ITEMS_PER_PAGE} items/page`);
        
    } catch (error) {
        console.error('❌ Database Error:', error);
        showErrorMessage('Database gagal dimuat. Gunakan browser modern.');
    }
});

// Edit & Delete Functions
let editingDataId = null;

async function openEditModal(id) {
    if (!isAdminLoggedIn) {
        console.warn('Akses ditolak: User bukan admin');
        return;
    }
    
    try {
        // Ensure db is ready
        if (!db) {
            console.error('Database belum siap');
            return;
        }
        
        const data = await Database.getDataById(id);
        if (!data) {
            console.error('Data with id', id, 'not found');
            return;
        }
        
        editingDataId = id;
        
        // Fill form with data - handle undefined values
        document.getElementById('nama').value = data.nama || '';
        document.getElementById('ttl').value = data.ttl || '';
        document.getElementById('jenis_kelamin').value = data.jenis_kelamin || '';
        document.getElementById('tinggi_berat').value = data.tinggi_berat || '';
        document.getElementById('sekolah').value = data.sekolah || '';
        document.getElementById('no_hp').value = data.no_hp || '';
        document.getElementById('alamat').value = data.alamat || '';
        document.getElementById('nama_ortu').value = data.nama_ortu || '';
        document.getElementById('pekerjaan_ortu').value = data.pekerjaan_ortu || '';
        document.getElementById('no_hp_ortu').value = data.no_hp_ortu || '';
        
        // Handle pengalaman radio button
        document.querySelectorAll('input[name="pengalaman"]').forEach(radio => {
            radio.checked = radio.value === data.pengalaman;
        });
        
        // Handle club input
        const clubInput = document.getElementById('club');
        clubInput.value = data.club || '';
        if (data.pengalaman === 'Ya') {
            clubInput.disabled = false;
            clubInput.required = true;
        } else {
            clubInput.disabled = true;
            clubInput.required = false;
        }
        
        // Change button text
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
        submitBtn.id = 'updateBtn';
        
        // Show cancel button
        const cancelEditBtn = document.getElementById('cancelEditBtn') || createCancelEditBtn();
        cancelEditBtn.style.display = 'inline-block';
        
        // Show info message if data is imported
        if (data.source === 'imported') {
            const infoMsg = document.createElement('div');
            infoMsg.style.cssText = `
                background: linear-gradient(135deg, #ffc107, #fd7e14);
                color: #333;
                padding: 12px 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.95rem;
            `;
            infoMsg.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>Mengedit data yang diimport dari Excel</span>
            `;
            
            // Remove old info message if exists
            const oldMsg = document.querySelector('.form-container > div:first-child');
            if (oldMsg && oldMsg.textContent.includes('Mengedit data yang diimport')) {
                oldMsg.remove();
            }
            
            document.querySelector('.form-container').prepend(infoMsg);
        }
        
        // Switch to form tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[onclick="switchTab(\'form\')"]').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById('form-tab').classList.add('active');
        
        // Scroll to form
        setTimeout(() => {
            document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
    } catch (error) {
        console.error('Error in openEditModal:', error);
    }
}

function createCancelEditBtn() {
    const btn = document.createElement('button');
    btn.id = 'cancelEditBtn';
    btn.type = 'button';
    btn.className = 'cancel-edit-btn';
    btn.innerHTML = '<i class="fas fa-times"></i> Batal Edit';
    btn.onclick = cancelEdit;
    btn.style.display = 'none';
    document.querySelector('.form-container').appendChild(btn);
    return btn;
}

function cancelEdit() {
    editingDataId = null;
    document.getElementById('registrationForm').reset();
    document.querySelector('.submit-btn').innerHTML = '<i class="fas fa-paper-plane"></i> Daftarkan';
    document.querySelector('.submit-btn').id = '';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

async function submitForm(e) {
    if (e) e.preventDefault();
    
    const formData = {
        nama: document.getElementById('nama').value.trim(),
        ttl: document.getElementById('ttl').value.trim(),
        jenis_kelamin: document.getElementById('jenis_kelamin').value,
        tinggi_berat: document.getElementById('tinggi_berat').value.trim(),
        sekolah: document.getElementById('sekolah').value.trim(),
        no_hp: document.getElementById('no_hp').value.trim(),
        alamat: document.getElementById('alamat').value.trim(),
        pengalaman: document.querySelector('input[name="pengalaman"]:checked')?.value || '',
        club: document.getElementById('club').value.trim(),
        nama_ortu: document.getElementById('nama_ortu').value.trim(),
        pekerjaan_ortu: document.getElementById('pekerjaan_ortu').value.trim(),
        no_hp_ortu: document.getElementById('no_hp_ortu').value.trim()
    };
    
    // Validasi input
    if (!formData.nama || !formData.ttl || !formData.sekolah) {
        alert('⚠️ Nama, TTL, dan Sekolah harus diisi!');
        return;
    }
    
    try {
        if (editingDataId) {
            // Update existing data
            await Database.updateData(editingDataId, formData);
            
            // Show success notification
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                animation: slideIn 0.5s ease;
            `;
            successMsg.innerHTML = `
                <i class="fas fa-check-circle"></i>
                ✅ Data berhasil diperbarui!
            `;
            document.querySelector('.form-container').prepend(successMsg);
            
            // Reset form and state
            cancelEdit();
            document.getElementById('registrationForm').reset();
            
            // Immediately switch to data tab
            setTimeout(() => {
                // Remove success message
                if (successMsg.parentElement) {
                    successMsg.remove();
                }
                // Switch tab
                switchTab('data');
                currentPage = 1;
                // Scroll to top of data table
                setTimeout(() => {
                    document.querySelector('.data-container').scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }, 800);
        } else {
            // Add new data
            await Database.addData(formData);
            
            // Show success notification
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                animation: slideIn 0.5s ease;
            `;
            successMsg.innerHTML = `
                <i class="fas fa-check-circle"></i>
                ✅ Data berhasil disimpan ke Database Lokal!
            `;
            document.querySelector('.form-container').prepend(successMsg);
            
            // Reset form
            document.getElementById('registrationForm').reset();
            
            // Switch to data tab
            setTimeout(() => {
                if (successMsg.parentElement) {
                    successMsg.remove();
                }
                switchTab('data');
                currentPage = 1;
                // Scroll to top of data table
                setTimeout(() => {
                    document.querySelector('.data-container').scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }, 800);
        }
    } catch (error) {
        console.error('Error in submitForm:', error);
        // Silent fail - just log to console
        console.log('Failed to save data');
    }
}

async function deleteData(id) {
    if (!isAdminLoggedIn) {
        console.warn('Akses ditolak: User bukan admin');
        return;
    }
    
    if (confirm('⚠️ Yakin ingin menghapus data ini?\n\nData tidak bisa dikembalikan!')) {
        try {
            await Database.deleteData(id);
            
            // Show success notification
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                background: linear-gradient(135deg, #ffc107, #fd7e14);
                color: #333;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                animation: slideIn 0.5s ease;
            `;
            successMsg.innerHTML = `
                <i class="fas fa-trash"></i>
                ✅ Data berhasil dihapus!
            `;
            document.querySelector('.data-container').prepend(successMsg);
            
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        } catch (error) {
            console.error('Error deleting data:', error);
        }
    }
}

// Admin Login System
let isAdminLoggedIn = false;
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('adminUsername').focus();
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    // Validasi credentials (simple validation)
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAdminLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminUser', username);
        
        closeLoginModal();
        updateAdminUI();
        
        // Success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        `;
        successMsg.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Login admin berhasil!
        `;
        document.querySelector('.container').insertBefore(successMsg, document.querySelector('.tabs'));
        
        setTimeout(() => successMsg.remove(), 3000);
    } else {
        // Error message
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            Username atau password salah!
        `;
        errorDiv.style.display = 'flex';
        document.getElementById('adminPassword').value = '';
    }
}

function handleAdminLogout() {
    isAdminLoggedIn = false;
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    
    updateAdminUI();
    
    // Logout message
    const logoutMsg = document.createElement('div');
    logoutMsg.style.cssText = `
        background: linear-gradient(135deg, #ffc107, #fd7e14);
        color: #333;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
    `;
    logoutMsg.innerHTML = `
        <i class="fas fa-sign-out-alt"></i>
        Logout berhasil!
    `;
    document.querySelector('.container').insertBefore(logoutMsg, document.querySelector('.tabs'));
    
    setTimeout(() => logoutMsg.remove(), 3000);
}

function updateAdminUI() {
    const loginBtn = document.getElementById('loginAdminBtn');
    const adminPanel = document.getElementById('adminPanel');
    const dataTabBtn = document.getElementById('dataTabBtn');
    
    if (isAdminLoggedIn) {
        loginBtn.style.display = 'none';
        adminPanel.style.display = 'flex';
        dataTabBtn.style.display = 'block';
        document.getElementById('adminUser').textContent = `👤 ${localStorage.getItem('adminUser') || 'Admin'}`;
        
        // Show admin features
        showAdminFeatures();
    } else {
        loginBtn.style.display = 'flex';
        adminPanel.style.display = 'none';
        dataTabBtn.style.display = 'none';
        
        // Hide admin features
        hideAdminFeatures();
        
        // Switch to form tab if user tries to access data tab
        if (document.getElementById('data-tab').classList.contains('active')) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('[onclick="switchTab(\'form\')"]').classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById('form-tab').classList.add('active');
        }
    }
}

function showAdminFeatures() {
    // Enable export/import buttons
    const exportBtn = document.querySelector('.export-btn');
    const importBtn = document.querySelector('.import-btn');
    const clearBtn = document.querySelector('.clear-all-btn');
    
    if (exportBtn) {
        exportBtn.style.opacity = '1';
        exportBtn.style.pointerEvents = 'auto';
        exportBtn.title = '';
    }
    if (importBtn) {
        importBtn.style.opacity = '1';
        importBtn.style.pointerEvents = 'auto';
        importBtn.title = '';
    }
    if (clearBtn) {
        clearBtn.style.opacity = '1';
        clearBtn.style.pointerEvents = 'auto';
        clearBtn.title = '';
    }
}

function hideAdminFeatures() {
    // Disable export/import buttons
    const exportBtn = document.querySelector('.export-btn');
    const importBtn = document.querySelector('.import-btn');
    const clearBtn = document.querySelector('.clear-all-btn');
    
    if (exportBtn) {
        exportBtn.style.opacity = '0.5';
        exportBtn.style.pointerEvents = 'none';
        exportBtn.title = 'Fitur ini hanya tersedia untuk admin. Login terlebih dahulu.';
    }
    if (importBtn) {
        importBtn.style.opacity = '0.5';
        importBtn.style.pointerEvents = 'none';
        importBtn.title = 'Fitur ini hanya tersedia untuk admin. Login terlebih dahulu.';
    }
    if (clearBtn) {
        clearBtn.style.opacity = '0.5';
        clearBtn.style.pointerEvents = 'none';
        clearBtn.title = 'Fitur ini hanya tersedia untuk admin. Login terlebih dahulu.';
    }
}

// Check if admin is already logged in
if (localStorage.getItem('adminLoggedIn') === 'true') {
    isAdminLoggedIn = true;
}
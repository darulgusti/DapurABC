// IndexedDB Database Setup
let db;
const DB_NAME = 'CrownBasketballDB';
const DB_VERSION = 1;
let registrants = [];

// Pagination variables
let currentPage = 1;
const ITEMS_PER_PAGE = 3;
let totalPages = 1;

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
            registrants = request.result.reverse(); // Terbaru duluan
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
}

function switchTab(tabName) {
    // Cek apakah user bisa akses tab data
    if (tabName === 'data' && !isAdminLoggedIn) {
        alert('⚠️ Akses Ditolak!\n\nHanya admin yang bisa melihat data pendaftar.\nSilakan login sebagai admin terlebih dahulu.');
        return;
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
    
    if (tabName === 'data') {
        Database.loadAllData();
    }
}

async function submitForm(e) {
    if (e) e.preventDefault();
    
    const formData = {
        nama: document.getElementById('nama').value,
        ttl: document.getElementById('ttl').value,
        jenis_kelamin: document.getElementById('jenis_kelamin').value,
        tinggi_berat: document.getElementById('tinggi_berat').value,
        sekolah: document.getElementById('sekolah').value,
        no_hp: document.getElementById('no_hp').value,
        alamat: document.getElementById('alamat').value,
        pengalaman: document.querySelector('input[name="pengalaman"]:checked')?.value || '',
        club: document.getElementById('club').value,
        nama_ortu: document.getElementById('nama_ortu').value,
        pekerjaan_ortu: document.getElementById('pekerjaan_ortu').value,
        no_hp_ortu: document.getElementById('no_hp_ortu').value
    };
    
    // Validasi input
    if (!formData.nama || !formData.ttl || !formData.sekolah) {
        alert('⚠️ Nama, TTL, dan Sekolah harus diisi!');
        return;
    }
    
    try {
        await Database.addData(formData);
        document.getElementById('registrationForm').reset();
        showSuccessMessage();
        setTimeout(() => {
            switchTab('data');
            currentPage = 1;
        }, 1000);
    } catch (error) {
        alert('❌ Gagal menyimpan data: ' + error.message);
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
                            no_hp_ortu: row['No HP Ortu'] || row['no_hp_ortu'] || ''
                        };
                        
                        // Validasi minimal
                        if (newData.nama && newData.sekolah) {
                            await Database.addData(newData);
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
                
                // Tampilkan hasil
                alert(`✅ Import selesai!\n\n✓ Berhasil: ${successCount} data\n✗ Gagal: ${errorCount} data\n\nTip: Pastikan file Excel memiliki kolom: Nama, Sekolah, TTL, dll`);
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
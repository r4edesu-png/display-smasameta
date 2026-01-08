// Sistem Antrian SPMB SMA Negeri 1 Magetan
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi variabel
    let queueList = [];
    let currentQueue = null;
    let isMuted = false;
    
    // Operator data
    const operators = [
        { id: 1, name: 'Operator 1', status: 'available', type: 'Pendaftaran' },
        { id: 2, name: 'Operator 2', status: 'available', type: 'Dokumen' },
        { id: 3, name: 'Operator 3', status: 'available', type: 'Verifikasi' },
        { id: 4, name: 'Operator 4', status: 'available', type: 'Wawancara' },
        { id: 5, name: 'Operator 5', status: 'available', type: 'Tes Tulis' },
        { id: 6, name: 'Operator 6', status: 'available', type: 'Konsultasi' },
        { id: 7, name: 'Operator 7', status: 'available', type: 'Pembayaran' },
        { id: 8, name: 'Operator 8', status: 'available', type: 'Pengambilan Kartu' }
    ];
    
    // Elemen DOM
    const currentQueueNumberEl = document.getElementById('current-queue-number');
    const currentOperatorEl = document.getElementById('current-operator');
    const nextQueueNumberEl = document.getElementById('next-queue-number');
    const nextOperatorEl = document.getElementById('next-operator');
    const queueStatusEl = document.getElementById('queue-status');
    const operatorsGridEl = document.getElementById('operators-grid');
    const queueNumberInput = document.getElementById('queue-number');
    const operatorSelect = document.getElementById('operator-select');
    const increaseBtn = document.getElementById('increase-btn');
    const decreaseBtn = document.getElementById('decrease-btn');
    const addQueueBtn = document.getElementById('add-queue-btn');
    const callQueueBtn = document.getElementById('call-queue-btn');
    const resetQueueBtn = document.getElementById('reset-queue-btn');
    const queueListEl = document.getElementById('queue-list');
    const totalQueueEl = document.getElementById('total-queue');
    const remainingQueueEl = document.getElementById('remaining-queue');
    const muteBtn = document.getElementById('mute-btn');
    const muteText = document.getElementById('mute-text');
    const testVoiceBtn = document.getElementById('test-voice-btn');
    const currentDateEl = document.getElementById('current-date');
    
    // Inisialisasi
    init();
    
    function init() {
        // Set tanggal hari ini
        setCurrentDate();
        
        // Render operator status
        renderOperators();
        
        // Update statistik antrian
        updateQueueStats();
        
        // Event listeners
        increaseBtn.addEventListener('click', () => {
            queueNumberInput.value = parseInt(queueNumberInput.value) + 1;
        });
        
        decreaseBtn.addEventListener('click', () => {
            if (parseInt(queueNumberInput.value) > 1) {
                queueNumberInput.value = parseInt(queueNumberInput.value) - 1;
            }
        });
        
        addQueueBtn.addEventListener('click', addQueue);
        callQueueBtn.addEventListener('click', callQueue);
        resetQueueBtn.addEventListener('click', resetQueue);
        muteBtn.addEventListener('click', toggleMute);
        testVoiceBtn.addEventListener('click', testVoice);
        
        // Tambahkan antrian awal untuk demo
        setTimeout(() => {
            addDemoQueues();
        }, 500);
    }
    
    // Fungsi untuk menambahkan antrian
    function addQueue() {
        const queueNumber = parseInt(queueNumberInput.value);
        const operator = operatorSelect.value;
        
        // Cek apakah nomor antrian sudah ada
        if (queueList.some(item => item.number === queueNumber)) {
            alert(`Nomor antrian ${queueNumber} sudah ada. Silakan gunakan nomor lain.`);
            return;
        }
        
        // Tambahkan ke daftar antrian
        const newQueue = {
            number: queueNumber,
            operator: operator,
            addedTime: new Date(),
            calledTime: null,
            status: 'waiting'
        };
        
        queueList.push(newQueue);
        
        // Urutkan antrian berdasarkan nomor
        queueList.sort((a, b) => a.number - b.number);
        
        // Update tampilan
        renderQueueList();
        updateQueueStats();
        
        // Reset input nomor ke berikutnya
        queueNumberInput.value = queueNumber + 1;
        
        // Tampilkan notifikasi suara jika tidak mute
        if (!isMuted) {
            playNotificationSound();
        }
    }
    
    // Fungsi untuk memanggil antrian
    function callQueue() {
        if (queueList.length === 0) {
            alert('Tidak ada antrian yang bisa dipanggil.');
            return;
        }
        
        // Ambil antrian pertama
        const nextQueue = queueList[0];
        
        // Update status antrian
        nextQueue.calledTime = new Date();
        nextQueue.status = 'called';
        
        // Pindahkan ke antrian saat ini
        currentQueue = nextQueue;
        
        // Hapus dari daftar antrian
        queueList.shift();
        
        // Update operator status
        updateOperatorStatus(nextQueue.operator, 'busy');
        
        // Update tampilan
        updateCurrentQueueDisplay();
        renderQueueList();
        updateQueueStats();
        renderOperators();
        
        // Mainkan suara panggilan antrian
        if (!isMuted) {
            speakQueueCall(nextQueue.number, nextQueue.operator);
        }
        
        // Set timeout untuk mengembalikan operator ke status available setelah 5 menit
        setTimeout(() => {
            updateOperatorStatus(nextQueue.operator, 'available');
            renderOperators();
        }, 5 * 60 * 1000); // 5 menit
    }
    
    // Fungsi untuk mengupdate tampilan antrian saat ini
    function updateCurrentQueueDisplay() {
        if (currentQueue) {
            currentQueueNumberEl.textContent = currentQueue.number;
            currentOperatorEl.textContent = currentQueue.operator;
            queueStatusEl.textContent = 'Dipanggil';
            queueStatusEl.style.color = 'var(--success-color)';
        } else {
            currentQueueNumberEl.textContent = '-';
            currentOperatorEl.textContent = '-';
            queueStatusEl.textContent = 'Menunggu panggilan';
            queueStatusEl.style.color = 'inherit';
        }
        
        // Update antrian berikutnya
        if (queueList.length > 0) {
            const nextQueue = queueList[0];
            nextQueueNumberEl.textContent = nextQueue.number;
            nextOperatorEl.textContent = nextQueue.operator;
        } else {
            nextQueueNumberEl.textContent = '-';
            nextOperatorEl.textContent = '-';
        }
    }
    
    // Fungsi untuk merender daftar antrian
    function renderQueueList() {
        if (queueList.length === 0) {
            queueListEl.innerHTML = '<p class="empty-queue">Belum ada antrian. Tambahkan antrian baru.</p>';
            return;
        }
        
        queueListEl.innerHTML = '';
        
        queueList.forEach((queue, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item' + (index === 0 ? ' current' : '');
            
            const timeString = formatTime(queue.addedTime);
            
            queueItem.innerHTML = `
                <div class="queue-number-badge">${queue.number}</div>
                <div class="queue-operator">${queue.operator}</div>
                <div class="queue-time">${timeString}</div>
            `;
            
            queueListEl.appendChild(queueItem);
        });
        
        updateCurrentQueueDisplay();
    }
    
    // Fungsi untuk merender status operator
    function renderOperators() {
        operatorsGridEl.innerHTML = '';
        
        operators.forEach(operator => {
            const operatorCard = document.createElement('div');
            operatorCard.className = `operator-card ${operator.status}`;
            
            const statusText = operator.status === 'available' ? 'Tersedia' : 'Sibuk';
            const statusClass = operator.status === 'available' ? 'status-available' : 'status-busy';
            
            operatorCard.innerHTML = `
                <div class="operator-name">${operator.name}</div>
                <div class="operator-type">${operator.type}</div>
                <div class="operator-status ${statusClass}">${statusText}</div>
            `;
            
            operatorsGridEl.appendChild(operatorCard);
        });
    }
    
    // Fungsi untuk mengupdate status operator
    function updateOperatorStatus(operatorName, status) {
        const operator = operators.find(op => op.name === operatorName);
        if (operator) {
            operator.status = status;
        }
    }
    
    // Fungsi untuk mengupdate statistik antrian
    function updateQueueStats() {
        totalQueueEl.textContent = queueList.length + (currentQueue ? 1 : 0);
        remainingQueueEl.textContent = queueList.length;
    }
    
    // Fungsi untuk mereset antrian
    function resetQueue() {
        if (confirm('Apakah Anda yakin ingin mereset semua antrian? Tindakan ini tidak dapat dibatalkan.')) {
            queueList = [];
            currentQueue = null;
            
            // Reset semua operator ke status available
            operators.forEach(operator => {
                operator.status = 'available';
            });
            
            // Update tampilan
            renderQueueList();
            renderOperators();
            updateQueueStats();
            
            // Reset input
            queueNumberInput.value = 1;
            
            alert('Semua antrian telah direset.');
        }
    }
    
    // Fungsi untuk mengaktifkan/menonaktifkan suara
    function toggleMute() {
        isMuted = !isMuted;
        
        if (isMuted) {
            muteText.textContent = 'Suara Dimatikan';
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> <span id="mute-text">Suara Dimatikan</span>';
            muteBtn.style.backgroundColor = 'var(--danger-color)';
        } else {
            muteText.textContent = 'Mute Suara';
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span id="mute-text">Mute Suara</span>';
            muteBtn.style.backgroundColor = 'var(--accent-color)';
        }
    }
    
    // Fungsi untuk menguji suara
    function testVoice() {
        if (!isMuted) {
            speakText("Sistem antrian SPMB SMA Negeri 1 Magetan siap digunakan.");
        } else {
            alert('Suara sedang dimatikan. Aktifkan suara terlebih dahulu untuk menguji.');
        }
    }
    
    // Fungsi untuk membaca panggilan antrian
    function speakQueueCall(queueNumber, operator) {
        const text = `Nomor antrian ${queueNumber}, silakan menuju ke ${operator}`;
        speakText(text);
    }
    
    // Fungsi untuk membacakan teks dengan Web Speech API
    function speakText(text) {
        // Cek browser support untuk Web Speech API
        if ('speechSynthesis' in window) {
            // Hentikan pembicaraan yang sedang berlangsung
            speechSynthesis.cancel();
            
            // Buat objek SpeechSynthesisUtterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set bahasa Indonesia
            utterance.lang = 'id-ID';
            
            // Gunakan suara wanita jika tersedia
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.lang === 'id-ID' && voice.name.toLowerCase().includes('female')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            // Set kecepatan dan volume
            utterance.rate = 0.9;
            utterance.volume = 1;
            
            // Mulai berbicara
            speechSynthesis.speak(utterance);
        } else {
            console.log('Web Speech API tidak didukung di browser ini.');
            // Fallback: Tampilkan alert
            alert(`Panggilan: ${text}`);
        }
    }
    
    // Fungsi untuk memutar suara notifikasi
    function playNotificationSound() {
        // Buat audio context untuk sound effect sederhana
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio Context tidak didukung:', e);
        }
    }
    
    // Fungsi untuk menambahkan antrian demo
    function addDemoQueues() {
        // Tambahkan beberapa antrian untuk demo
        const demoQueues = [
            { number: 5, operator: 'Operator 1 - Pendaftaran' },
            { number: 6, operator: 'Operator 3 - Verifikasi' },
            { number: 7, operator: 'Operator 5 - Tes Tulis' },
            { number: 8, operator: 'Operator 7 - Pembayaran' }
        ];
        
        demoQueues.forEach(queue => {
            const newQueue = {
                number: queue.number,
                operator: queue.operator,
                addedTime: new Date(),
                calledTime: null,
                status: 'waiting'
            };
            
            queueList.push(newQueue);
        });
        
        // Urutkan antrian
        queueList.sort((a, b) => a.number - b.number);
        
        // Update tampilan
        renderQueueList();
        updateQueueStats();
    }
    
    // Fungsi untuk mengatur tanggal hari ini
    function setCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('id-ID', options);
    }
    
    // Fungsi untuk memformat waktu
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    // Inisialisasi suara untuk Web Speech API
    if ('speechSynthesis' in window) {
        // Memuat daftar suara yang tersedia
        speechSynthesis.onvoiceschanged = function() {
            console.log('Suara tersedia:', speechSynthesis.getVoices().length);
        };
    }
});
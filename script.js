// 全局变量
let songs = []; // 存储所有歌曲信息
let currentSongIndex = -1; // 当前播放歌曲的索引
let isPlaying = false; // 播放状态
let repeatMode = 0; // 0: 顺序播放, 1: 循环播放, 2: 随机播放
let sortBy = 'added'; // 排序方式: added, name, artist
let sortOrder = 'desc'; // 排序顺序: asc, desc
let particles = []; // 粒子数组

// DOM元素
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const repeatBtn = document.getElementById('repeat-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const currentSongTitle = document.getElementById('current-song-title');
const currentSongArtist = document.getElementById('current-song-artist');
const albumCover = document.getElementById('album-cover');
const volumeSlider = document.getElementById('volume-slider');
const volumeIcon = document.getElementById('volume-icon');
const songTableBody = document.getElementById('song-table-body');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const addSongForm = document.getElementById('add-song-form');
const songFileInput = document.getElementById('song-file');
const songNameInput = document.getElementById('song-name');
const songArtistInput = document.getElementById('song-artist');
const sortBySelect = document.getElementById('sort-by');
const sortOrderBtn = document.getElementById('sort-order');
const toggleThemeBtn = document.getElementById('toggle-theme');
const particleContainer = document.getElementById('particle-container');
const albumCoverContainer = document.querySelector('.album-cover');
const songCountDisplay = document.getElementById('song-count-display');

// 初始化
function init() {
    // 创建粒子背景
    createParticleBackground();
    // 从本地存储加载歌曲列表
    loadSongsFromStorage();
    // 渲染歌曲表格
    renderSongTable();
    // 更新歌曲数量显示
    updateSongCount();
    // 检查主题设置
    checkThemePreference();
    // 添加事件监听器
    addEventListeners();
}

// 创建粒子背景
function createParticleBackground() {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    particleContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸
    function resizeCanvas() {
        canvas.width = particleContainer.offsetWidth;
        canvas.height = particleContainer.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 粒子类
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // 边界检查
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }
        
        draw() {
            const isLightTheme = document.body.classList.contains('light-theme');
            ctx.fillStyle = isLightTheme ? 'rgba(58, 123, 213, 0.3)' : 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 创建粒子
    function createParticles() {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // 连接粒子
    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const opacity = 1 - (distance / 100);
                    const isLightTheme = document.body.classList.contains('light-theme');
                    ctx.strokeStyle = isLightTheme ? 
                        `rgba(58, 123, 213, ${opacity * 0.2})` : 
                        `rgba(255, 255, 255, ${opacity * 0.2})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        
        connectParticles();
        requestAnimationFrame(animate);
    }
    
    // 初始化粒子并开始动画
    createParticles();
    animate();
}

// 从本地存储加载歌曲
function loadSongsFromStorage() {
    const storedSongs = localStorage.getItem('musicPlayerSongs');
    if (storedSongs) {
        songs = JSON.parse(storedSongs);
    } else {
        // 首次使用时初始化空歌单
        songs = [];
        saveSongsToStorage(); // 保存空歌单到本地存储
    }
}

// 保存歌曲到本地存储
function saveSongsToStorage() {
    localStorage.setItem('musicPlayerSongs', JSON.stringify(songs));
}

// 更新歌曲数量显示
function updateSongCount() {
    songCountDisplay.textContent = songs.length;
}

// 渲染歌曲表格
function renderSongTable() {
    songTableBody.innerHTML = '';
    
    // 排序歌曲
    const sortedSongs = sortSongs([...songs]);
    
    if (sortedSongs.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px;">暂无歌曲，请添加歌曲</td>';
        songTableBody.appendChild(emptyRow);
        return;
    }
    
    sortedSongs.forEach((song, index) => {
        const row = document.createElement('tr');
        // 格式化日期
        const date = new Date(song.addedTime);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${song.name}</td>
            <td>${song.artist}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="action-btn play-btn" data-id="${song.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${song.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        songTableBody.appendChild(row);
    });
    
    // 为播放按钮添加事件监听器
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const index = songs.findIndex(song => song.id === id);
            if (index !== -1) {
                playSong(index);
            }
        });
    });
    
    // 为删除按钮添加事件监听器
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteSong(id);
        });
    });
}

// 排序歌曲
function sortSongs(songsToSort) {
    return songsToSort.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
            case 'added':
                comparison = new Date(a.addedTime) - new Date(b.addedTime);
                break;
            case 'name':
                comparison = a.name.localeCompare(b.name, 'zh-CN');
                break;
            case 'artist':
                comparison = a.artist.localeCompare(b.artist, 'zh-CN');
                break;
        }
        
        // 根据排序顺序调整比较结果
        return sortOrder === 'asc' ? comparison : -comparison;
    });
}

// 添加事件监听器
function addEventListeners() {
    // 播放/暂停按钮
    playBtn.addEventListener('click', togglePlay);
    
    // 上一首/下一首按钮
    prevBtn.addEventListener('click', playPreviousSong);
    nextBtn.addEventListener('click', playNextSong);
    
    // 循环模式按钮
    repeatBtn.addEventListener('click', changeRepeatMode);
    
    // 随机播放按钮
    shuffleBtn.addEventListener('click', toggleShuffleMode);
    
    // 音频进度更新
    audioPlayer.addEventListener('timeupdate', updateProgress);
    
    // 点击进度条跳转
    document.querySelector('.progress-bar').addEventListener('click', seek);
    
    // 音量控制
    volumeSlider.addEventListener('input', setVolume);
    
    // 搜索功能
    searchInput.addEventListener('input', handleSearch);
    searchBtn.addEventListener('click', handleSearch);
    
    // 音频结束时处理
    audioPlayer.addEventListener('ended', handleAudioEnd);
    
    // 提交添加歌曲表单
    addSongForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSongUpload();
    });
    
    // 当选择文件时，自动填充歌曲名（可选）
    songFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && !songNameInput.value) {
            // 从文件名提取歌曲名（不含扩展名）
            const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
            songNameInput.value = fileName;
        }
    });
    
    // 排序控制
    sortBySelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderSongTable();
    });
    
    sortOrderBtn.addEventListener('click', toggleSortOrder);
    
    // 主题切换
    toggleThemeBtn.addEventListener('click', toggleTheme);
}

// 处理歌曲上传
function handleSongUpload() {
    const file = songFileInput.files[0];
    const name = songNameInput.value.trim();
    const artist = songArtistInput.value.trim();
    
    if (!file || !name || !artist) {
        alert('请填写完整的歌曲信息');
        return;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('audio/')) {
        alert('请上传音频文件');
        return;
    }
    
    // 检查文件名是否已存在
    const fileExists = songs.some(song => song.filename === file.name);
    if (fileExists) {
        alert('该文件已存在，请选择其他文件');
        return;
    }
    
    // 创建新歌曲对象
    const newSong = {
        id: Date.now().toString(), // 使用时间戳作为唯一ID
        name: name,
        artist: artist,
        filename: file.name,
        addedTime: new Date().toISOString()
    };
    
    // 添加到歌曲列表
    songs.push(newSong);
    
    // 保存到本地存储
    saveSongsToStorage();
    
    // 重新渲染歌曲表格
    renderSongTable();
    
    // 更新歌曲数量
    updateSongCount();
    
    // 重置表单
    addSongForm.reset();
    
    // 提示用户
    alert(`歌曲 "${name}" 已添加，请将文件复制到 "music" 文件夹中`);
}

// 播放/暂停切换
function togglePlay() {
    if (songs.length === 0) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
        albumCoverContainer.classList.remove('playing');
    } else {
        // 如果当前没有播放的歌曲，播放第一首
        if (currentSongIndex === -1) {
            playSong(0);
        } else {
            audioPlayer.play();
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
            albumCoverContainer.classList.add('playing');
        }
    }
    isPlaying = !isPlaying;
}

// 播放指定索引的歌曲
function playSong(index) {
    if (index < 0 || index >= songs.length) return;
    
    currentSongIndex = index;
    const song = songs[index];
    
    // 设置音频源
    audioPlayer.src = `music/${song.filename}`;
    // 更新UI
    currentSongTitle.textContent = song.name;
    currentSongArtist.textContent = song.artist;
    albumCover.src = `https://picsum.photos/seed/${song.id}/300/300`;
    
    // 播放音乐
    audioPlayer.play().catch(error => {
        console.error('播放失败:', error);
        alert('播放失败，请确保音乐文件已正确上传到music文件夹');
    });
    
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    isPlaying = true;
    albumCoverContainer.classList.add('playing');
    
    // 重置进度条
    progress.style.width = '0%';
}

// 播放上一首
function playPreviousSong() {
    if (songs.length <= 1) return;
    
    let newIndex;
    
    if (repeatMode === 2) {
        // 随机播放模式
        newIndex = Math.floor(Math.random() * songs.length);
        while (newIndex === currentSongIndex && songs.length > 1) {
            newIndex = Math.floor(Math.random() * songs.length);
        }
    } else {
        // 顺序或循环模式
        newIndex = currentSongIndex - 1;
        if (newIndex < 0) {
            newIndex = songs.length - 1;
        }
    }
    
    playSong(newIndex);
}

// 播放下一首
function playNextSong() {
    if (songs.length <= 1) return;
    
    let newIndex;
    
    if (repeatMode === 2) {
        // 随机播放模式
        newIndex = Math.floor(Math.random() * songs.length);
        while (newIndex === currentSongIndex && songs.length > 1) {
            newIndex = Math.floor(Math.random() * songs.length);
        }
    } else {
        // 顺序或循环模式
        newIndex = currentSongIndex + 1;
        if (newIndex >= songs.length) {
            newIndex = 0;
        }
    }
    
    playSong(newIndex);
}

// 改变循环模式
function changeRepeatMode() {
    repeatMode = (repeatMode + 1) % 3;
    
    // 更新按钮样式
    shuffleBtn.classList.remove('active');
    
    switch (repeatMode) {
        case 0: // 顺序播放
            repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
            repeatBtn.title = '顺序播放';
            break;
        case 1: // 循环播放
            repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
            repeatBtn.title = '循环播放';
            break;
        case 2: // 随机播放
            repeatBtn.innerHTML = '<i class="fas fa-random"></i>';
            repeatBtn.title = '随机播放';
            shuffleBtn.classList.add('active');
            break;
    }
}

// 切换随机播放模式
function toggleShuffleMode() {
    if (repeatMode === 2) {
        repeatMode = 0;
        repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
        repeatBtn.title = '顺序播放';
        shuffleBtn.classList.remove('active');
    } else {
        repeatMode = 2;
        repeatBtn.innerHTML = '<i class="fas fa-random"></i>';
        repeatBtn.title = '随机播放';
        shuffleBtn.classList.add('active');
    }
}

// 更新进度条
function updateProgress() {
    const { duration, currentTime } = audioPlayer;
    if (isNaN(duration)) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    
    // 更新时间显示
    currentTimeEl.textContent = formatTime(currentTime);
    totalTimeEl.textContent = formatTime(duration);
}

// 格式化时间（秒 -> mm:ss）
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 进度条跳转
function seek(e) {
    const progressBar = document.querySelector('.progress-bar');
    const seekTime = (e.offsetX / progressBar.offsetWidth) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
}

// 设置音量
function setVolume() {
    audioPlayer.volume = volumeSlider.value;
    
    // 更新音量图标
    const volume = parseFloat(volumeSlider.value);
    if (volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

// 处理音频结束
function handleAudioEnd() {
    if (repeatMode === 1) {
        // 循环播放 - 重新播放当前歌曲
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        // 顺序播放或随机播放 - 播放下一首
        playNextSong();
    }
}

// 删除歌曲
function deleteSong(id) {
    if (confirm('确定要删除这首歌吗？')) {
        // 检查是否是当前播放的歌曲
        const index = songs.findIndex(song => song.id === id);
        if (index === currentSongIndex) {
            audioPlayer.pause();
            isPlaying = false;
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
            albumCoverContainer.classList.remove('playing');
            currentSongIndex = -1;
            currentSongTitle.textContent = '未播放歌曲';
            currentSongArtist.textContent = '未知艺术家';
        }
        
        // 从列表中删除
        songs = songs.filter(song => song.id !== id);
        
        // 保存到本地存储
        saveSongsToStorage();
        
        // 重新渲染
        renderSongTable();
        
        // 更新歌曲数量
        updateSongCount();
    }
}

// 切换排序顺序
function toggleSortOrder() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortOrderBtn.innerHTML = sortOrder === 'asc' ? 
        '<i class="fas fa-sort-amount-up"></i>' : 
        '<i class="fas fa-sort-amount-down"></i>';
    renderSongTable();
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        searchResults.classList.remove('active');
        return;
    }
    
    // 搜索匹配的歌曲
    const matchedSongs = songs.filter((song) => {
        const nameMatch = song.name.toLowerCase().includes(searchTerm);
        const artistMatch = song.artist.toLowerCase().includes(searchTerm);
        return nameMatch || artistMatch;
    });
    
    // 显示搜索结果
    if (matchedSongs.length > 0) {
        // 定位搜索结果容器
        const searchBox = document.querySelector('.search-box');
        const rect = searchBox.getBoundingClientRect();
        searchResults.style.top = `${rect.bottom}px`;
        searchResults.style.left = `${rect.left}px`;
        searchResults.style.width = `${rect.width}px`;
        
        searchResults.innerHTML = '';
        matchedSongs.forEach(song => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.id = song.id;
            resultItem.innerHTML = `
                <div class="song-info">
                    <div class="song-name">${song.name}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>
                <i class="fas fa-play"></i>
            `;
            searchResults.appendChild(resultItem);
        });
        searchResults.classList.add('active');
    } else {
        searchResults.innerHTML = '<div class="search-result-item">没有找到匹配的歌曲</div>';
        searchResults.classList.add('active');
    }
}

// 切换主题
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    toggleThemeBtn.innerHTML = isLight ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    
    // 保存主题偏好
    localStorage.setItem('musicPlayerTheme', isLight ? 'light' : 'dark');
}

// 检查主题偏好
function checkThemePreference() {
    const savedTheme = localStorage.getItem('musicPlayerTheme');
    const isLight = savedTheme === 'light' || 
                   (savedTheme === null && window.matchMedia('(prefers-color-scheme: light)').matches);
    
    if (isLight) {
        document.body.classList.add('light-theme');
        toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// 点击页面其他地方关闭搜索结果
document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-sort-container');
    if (!searchContainer.contains(e.target)) {
        searchResults.classList.remove('active');
    }
});

// 初始化应用
document.addEventListener('DOMContentLoaded', init);

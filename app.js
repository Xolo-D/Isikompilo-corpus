let isLoggedIn = false;

// ===== SECURITY & VALIDATION =====
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function validateEntry(entry) {
    const errors = [];
    
    if (!entry.word || entry.word.trim().length === 0) {
        errors.push('Word/phrase is required');
    }
    
    if (!entry.translation || entry.translation.trim().length === 0) {
        errors.push('Translation is required');
    }
    
    if (!Array.isArray(entry.examples) || entry.examples.length === 0) {
        errors.push('At least one example is required');
    } else {
        entry.examples.forEach((example, index) => {
            if (!example.isizulu || !example.english) {
                errors.push(`Example ${index + 1} must have both isiZulu and English`);
            }
        });
    }
    
    if (!entry.pos) errors.push('Part of speech is required');
    if (!entry.genre) errors.push('Genre is required');
    if (!entry.culturalContext) errors.push('Cultural context is required');
    
    return errors;
}

function validateImportedData(data) {
    if (!Array.isArray(data)) {
        throw new Error('Imported data must be an array');
    }
    
    const requiredFields = ['word', 'translation', 'pos', 'genre', 'languages', 'examples', 'culturalContext'];
    
    data.forEach((entry, index) => {
        requiredFields.forEach(field => {
            if (!(field in entry)) {
                throw new Error(`Entry ${index} missing required field: ${field}`);
            }
        });
        
        if (!Array.isArray(entry.examples)) {
            throw new Error(`Entry ${index} examples must be an array`);
        }
        
        if (!Array.isArray(entry.languages)) {
            throw new Error(`Entry ${index} languages must be an array`);
        }
    });
    
    return true;
}

// ===== PERFORMANCE OPTIMIZATIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== LOADING STATES =====
function setLoadingState(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        const originalText = element.innerHTML;
        element.setAttribute('data-original-text', originalText);
        element.innerHTML = 'Loading...';
        element.classList.add('button-loading');
    } else {
        element.disabled = false;
        const originalText = element.getAttribute('data-original-text');
        element.innerHTML = originalText || 'Search';
        element.classList.remove('button-loading');
    }
}

// ===== STORAGE MANAGEMENT =====
function isStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.error('LocalStorage not available:', e);
        return false;
    }
}

function cleanupOldData() {
    try {
        const logs = getActivityLogs();
        if (logs.length > 100) {
            localStorage.setItem('activityLogs', JSON.stringify(logs.slice(0, 100)));
        }
        
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        if (searchHistory.length > 20) {
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory.slice(0, 20)));
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// ===== ENHANCED SEARCH =====
function performEnhancedSearch(searchTerm, data) {
    const results = data.filter(entry => {
        const searchFields = [
            entry.word,
            entry.translation, 
            entry.culturalContext,
            ...entry.examples.flatMap(ex => [ex.isizulu, ex.english])
        ];
        
        return searchFields.some(field => 
            field && field.toLowerCase().includes(searchTerm)
        );
    });
    
    // Sort by relevance
    results.sort((a, b) => {
        const aExact = a.word.toLowerCase() === searchTerm;
        const bExact = b.word.toLowerCase() === searchTerm;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const aStartsWith = a.word.toLowerCase().startsWith(searchTerm);
        const bStartsWith = b.word.toLowerCase().startsWith(searchTerm);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        return b.frequency - a.frequency;
    });
    
    return results;
}

// ===== ERROR HANDLING =====
function handleError(context, error, userMessage = null) {
    console.error(`Error in ${context}:`, error);
    
    if (userMessage) {
        alert(userMessage);
    } else {
        alert(`An error occurred in ${context}. Please try again.`);
    }
    
    // Could send to logging service in production
    logActivity(`ERROR: ${context} - ${error.message}`);
}

// ===== DATA MANAGEMENT =====

// Seed initial data if empty (run once)
function seedData() {
    if (!isStorageAvailable()) {
        console.error('Storage not available - running in fallback mode');
        return;
    }
    
    if (localStorage.getItem('corpusData')) return;
    
    try {
        const initialData = [
            {
                id: 1,
                word: "Ubuntu",
                translation: "Humanity, human kindness",
                pos: "noun",
                genre: "cultural",
                languages: ["isizulu", "english"],
                examples: [
                    { isizulu: "Ubuntu ngumuntu ngabantu", english: "A person is a person through other people" }
                ],
                culturalContext: "Philosophical concept emphasizing shared humanity",
                frequency: 156
            },
            {
                id: 2,
                word: "Indlela ibuzwa kwabaphambili",
                translation: "The way is asked from those who have gone before",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Umuntu omusha kufanele azwe izinkulumo zabadala ngoba indlela ibuzwa kwabaphambili", english: "A young person should listen to the elders because the way is asked from those who have gone before" }
                ],
                culturalContext: "Emphasizes learning from elders and experienced people",
                frequency: 87
            },
            {
                id: 3,
                word: "Inkunzi isematholeni",
                translation: "The bull is still in the kraal",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Inkunzi isematholeni, ayikho isikhuni esingekaphothulwa.", english: "The bull is still in the kraal, no bone has been broken yet." }
                ],
                culturalContext: "Refers to someone who is still young and inexperienced",
                frequency: 76
            },
            {
                id: 4,
                word: "Iqaqa alidli elangeni",
                translation: "A skunk does not eat in the open",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Iqaqa alidli elangeni, izinto ezimbi zenziwa ngasese.", english: "A skunk does not eat in the open, bad things are done in secret." }
                ],
                culturalContext: "Some actions are done privately",
                frequency: 64
            },
            {
                id: 5,
                word: "Isikhathi",
                translation: "Time",
                pos: "noun",
                genre: "cultural",
                languages: ["isizulu", "english"],
                examples: [
                    { isizulu: "Isikhathi siyaphela.", english: "Time is running out." }
                ],
                culturalContext: "Concept of time in Zulu philosophy",
                frequency: 58
            },
            {
                id: 6,
                word: "Akukho ntaka idubula emqolo",
                translation: "No bird shoots its own back",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Akukho ntaka idubula emqolo, abantu abazenziselwa ububi.", english: "No bird shoots its own back, people don't harm themselves." }
                ],
                culturalContext: "Unity and self-preservation",
                frequency: 45
            },
            {
                id: 7,
                word: "Umemulo",
                translation: "Coming of age ceremony",
                pos: "noun",
                genre: "cultural",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Umemulo womfana umqondo wezintombi.", english: "The boy's umemulo is the girls' dream." }
                ],
                culturalContext: "Zulu rite of passage",
                frequency: 32
            },
            {
                id: 8,
                word: "Ukubuyisa",
                translation: "To return or restore",
                pos: "verb",
                genre: "cultural",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Ukubuyisa iziko lomuzi.", english: "To restore the family hearth." }
                ],
                culturalContext: "Restoration in family traditions",
                frequency: 28
            },
            {
                id: 9,
                word: "Imbeleko",
                translation: "First milk offering",
                pos: "noun",
                genre: "cultural",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Imbeleko yomntwana ingcwele.", english: "The child's first milk offering is sacred." }
                ],
                culturalContext: "Infant naming ceremony",
                frequency: 25
            },
            {
                id: 10,
                word: "Ulwaluko",
                translation: "Initiation circumcision",
                pos: "noun",
                genre: "cultural",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Ulwaluko luyisiko lesizwe.", english: "Circumcision is a national custom." }
                ],
                culturalContext: "Male initiation rite",
                frequency: 22
            },
            {
                id: 11,
                word: "Inkosi ilibusisa izwe",
                translation: "The king blesses the nation",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Inkosi ilibusisa izwe, abantu bayathula.", english: "The king blesses the nation, people are at peace." }
                ],
                culturalContext: "Royal authority and peace",
                frequency: 19
            },
            {
                id: 12,
                word: "Isikhathi sizathupha",
                translation: "Time will reveal",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Isikhathi sizathupha, izinto zizabonakala.", english: "Time will reveal, things will become clear." }
                ],
                culturalContext: "Patience in revelation",
                frequency: 17
            },
            {
                id: 13,
                word: "Indaba kaMamGcina",
                translation: "MamGcina's story",
                pos: "narrative",
                genre: "narrative",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Indaba kaMamGcina ifundisa ubuntu.", english: "MamGcina's story teaches humanity." }
                ],
                culturalContext: "Folktale of wisdom",
                frequency: 15
            },
            {
                id: 14,
                word: "Igugu leZulu",
                translation: "Pride of Zulu",
                pos: "noun",
                genre: "cultural",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Igugu leZulu liyakhanya.", english: "The pride of Zulu shines." }
                ],
                culturalContext: "Zulu heritage pride",
                frequency: 14
            },
            {
                id: 15,
                word: "Umuntu ngumuntu ngabantu",
                translation: "I am because we are",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu", "english"],
                examples: [
                    { isizulu: "Umuntu ngumuntu ngabantu.", english: "I am because we are." }
                ],
                culturalContext: "Ubuntu philosophy",
                frequency: 120
            },
            {
                id: 16,
                word: "Inja iyawa ngomlenze wayo",
                translation: "The dog fell on its own leg",
                pos: "proverb",
                genre: "proverb",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Inja iyawa ngomlenze wayo, ububi buvezela umuntu.", english: "The dog fell on its own leg, evil catches up." }
                ],
                culturalContext: "Karma in Zulu sayings",
                frequency: 12
            },
            {
                id: 17,
                word: "Isihlangu sesizwe",
                translation: "Shield of the nation",
                pos: "noun",
                genre: "cultural",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Isihlangu sesizwe siyavikeleka.", english: "The nation's shield protects." }
                ],
                culturalContext: "National defense metaphor",
                frequency: 10
            },
            {
                id: 18,
                word: "Ukuphendula",
                translation: "To respond",
                pos: "verb",
                genre: "greeting",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Sawubona! Yebo sawubona.", english: "Hello! Yes, hello." }
                ],
                culturalContext: "Greeting response",
                frequency: 8
            },
            {
                id: 19,
                word: "Ingoma",
                translation: "Song",
                pos: "noun",
                genre: "song",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Ingoma yabantu iyavuselela.", english: "The people's song revives." }
                ],
                culturalContext: "Traditional Zulu song",
                frequency: 6
            },
            {
                id: 20,
                word: "Intombi",
                translation: "Girl",
                pos: "noun",
                genre: "narrative",
                languages: ["isizulu"],
                examples: [
                    { isizulu: "Intombi yaseZululand iyinhloko yomuzi.", english: "The girl from Zululand is the head of the home." }
                ],
                culturalContext: "Role of women in stories",
                frequency: 5
            }
        ];
        localStorage.setItem('corpusData', JSON.stringify(initialData));
        console.log('Data seeded successfully');
    } catch (error) {
        handleError('seedData', error, 'Failed to initialize data storage');
    }
}

// Get all entries from DB
function getCorpusData() {
    if (!isStorageAvailable()) {
        return []; // Return empty array if no storage
    }
    
    seedData(); // Ensure seeded
    try {
        return JSON.parse(localStorage.getItem('corpusData') || '[]');
    } catch (error) {
        handleError('getCorpusData', error, 'Error loading data');
        return [];
    }
}

// Save entry to DB
function saveEntry(entry) {
    try {
        // Validate entry
        const validationErrors = validateEntry(entry);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }
        
        const data = getCorpusData();
        const maxId = data.length > 0 ? Math.max(...data.map(e => e.id)) : 0;
        entry.id = maxId + 1;
        entry.frequency = 1;
        
        // Sanitize inputs
        entry.word = sanitizeInput(entry.word);
        entry.translation = sanitizeInput(entry.translation);
        entry.culturalContext = sanitizeInput(entry.culturalContext);
        
        data.unshift(entry);
        localStorage.setItem('corpusData', JSON.stringify(data));
        logActivity(`Added entry: ${entry.word}`);
        
        cleanupOldData(); // Clean up after save
        
        return entry;
    } catch (error) {
        handleError('saveEntry', error, 'Failed to save entry');
        throw error; // Re-throw for caller to handle
    }
}

// Log activity
function logActivity(action) {
    try {
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.unshift({ action, timestamp: new Date().toISOString() });
        if (logs.length > 50) logs.pop(); // Keep last 50
        localStorage.setItem('activityLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

// Get logs
function getActivityLogs() {
    try {
        return JSON.parse(localStorage.getItem('activityLogs') || '[]');
    } catch (error) {
        console.error('Failed to get activity logs:', error);
        return [];
    }
}

// Get users
function getUsers() {
    const users = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('corpusUser_')) {
                const user = JSON.parse(localStorage.getItem(key));
                users.push(user);
            }
        }
    } catch (error) {
        console.error('Failed to get users:', error);
    }
    return users;
}

// ===== SEARCH FUNCTIONALITY =====
function performSearch(term = null) {
    try {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (!searchInput) {
            localStorage.setItem('pendingSearch', term || '');
            window.location.href = 'search.html';
            return;
        }
        
        let searchTerm = term || searchInput.value;
        if (!searchTerm.trim()) {
            alert('Please enter a search term');
            return;
        }
        
        searchTerm = sanitizeInput(searchTerm.trim().toLowerCase());
        
        // Set loading state
        if (searchButton) {
            setLoadingState(searchButton, true);
        }
        
        const data = getCorpusData();
        let filteredData = performEnhancedSearch(searchTerm, data);
        
        // Apply filters
        const langChecks = document.querySelectorAll('input[name="language"]:checked');
        const selectedLangs = Array.from(langChecks).map(cb => cb.value);
        if (selectedLangs.length > 0) {
            filteredData = filteredData.filter(entry => 
                selectedLangs.some(lang => entry.languages.includes(lang))
            );
        }
        
        const posFilter = document.getElementById('posFilter')?.value;
        if (posFilter) {
            filteredData = filteredData.filter(entry => entry.pos === posFilter);
        }
        
        const genreFilter = document.getElementById('genreFilter')?.value;
        if (genreFilter) {
            filteredData = filteredData.filter(entry => entry.genre === genreFilter);
        }
        
        // Update frequency for searched terms
        filteredData.forEach(entry => {
            entry.frequency += 1;
        });
        localStorage.setItem('corpusData', JSON.stringify(data));
        
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p>Searching...</p>';
        }
        
        // Simulate search delay for better UX
        setTimeout(() => {
            displaySearchResults(filteredData);
            if (searchButton) {
                setLoadingState(searchButton, false);
            }
            addToSearchHistory(searchTerm);
        }, 300);
        
    } catch (error) {
        handleError('performSearch', error, 'Search failed');
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            setLoadingState(searchButton, false);
        }
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found. Try a different search term or adjust filters.</p>';
        return;
    }

    let resultsHTML = `<h3>Search Results (${results.length})</h3>`;
    results.forEach(result => {
        resultsHTML += `
            <div class="result-card">
                <div class="result-header">
                    <h4>${result.word}</h4>
                    <span class="frequency-badge">Frequency: ${result.frequency}</span>
                </div>
                <p><strong>Translation:</strong> ${result.translation}</p>
                <p><strong>Part of Speech:</strong> <span class="pos-tag">${result.pos}</span></p>
                <div class="cultural-context">
                    <strong>Cultural Context:</strong> ${result.culturalContext}
                </div>
                <div class="examples">
                    <strong>Examples:</strong>
                    ${result.examples.map(example => `
                        <div class="example">
                            <p><strong>isiZulu:</strong> ${example.isizulu}</p>
                            <p><strong>English:</strong> ${example.english}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    resultsContainer.innerHTML = resultsHTML;
}

function displaySearchHistory() {
    const historyContainer = document.getElementById('searchHistory');
    if (!historyContainer) return;

    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (searchHistory.length === 0) {
        historyContainer.innerHTML = '<p class="sr-only">No recent searches.</p>';
        return;
    }

    historyContainer.innerHTML = searchHistory.map(term => `
        <a href="#" class="search-tag" aria-label="Recent search: ${term}">${term}</a>
    `).join('');
}

function addToSearchHistory(term) {
    try {
        let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        if (!searchHistory.includes(term)) {
            searchHistory.unshift(term);
            if (searchHistory.length > 10) {
                searchHistory = searchHistory.slice(0, 10);
            }
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
        if (window.location.pathname.includes('search.html')) {
            displaySearchHistory();
        }
    } catch (error) {
        console.error('Failed to add to search history:', error);
    }
}

function clearSearchHistory() {
    localStorage.removeItem('searchHistory');
    displaySearchHistory();
    alert('Search history cleared.');
}

// ===== BROWSE FUNCTIONALITY =====
function browseCategory(category) {
    const contentContainer = document.getElementById('browseContent');
    if (!contentContainer) return;

    contentContainer.innerHTML = `<p>Loading ${category}...</p>`;
    const data = getCorpusData();
    const filtered = data.filter(entry => entry.genre === category);
    let contentHTML = `<h3>${category.charAt(0).toUpperCase() + category.slice(1)} (${filtered.length})</h3>`;

    filtered.forEach(entry => {
        contentHTML += `
            <div class="browse-item">
                <h4>${entry.word}</h4>
                <p><strong>Translation:</strong> ${entry.translation}</p>
                <p><strong>Meaning:</strong> ${entry.culturalContext}</p>
            </div>
        `;
    });

    if (filtered.length === 0) {
        contentHTML += `<p>No content for ${category} yet. Add via Admin.</p>`;
    }

    contentContainer.innerHTML = contentHTML;
}

// ===== ANALYSIS & CHARTS =====
function initializeCharts() {
    try {
        const data = getCorpusData();
        const wordFreqCtx = document.getElementById('wordFrequencyChart')?.getContext('2d');
        if (wordFreqCtx) {
            const topWords = data.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
            new Chart(wordFreqCtx, {
                type: 'bar',
                data: {
                    labels: topWords.map(w => w.word),
                    datasets: [{
                        label: 'Frequency in Corpus',
                        data: topWords.map(w => w.frequency),
                        backgroundColor: '#3498db'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }

        const posCtx = document.getElementById('posChart')?.getContext('2d');
        if (posCtx) {
            const posCounts = data.reduce((acc, entry) => {
                acc[entry.pos] = (acc[entry.pos] || 0) + 1;
                return acc;
            }, {});
            new Chart(posCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(posCounts),
                    datasets: [{
                        data: Object.values(posCounts),
                        backgroundColor: ['#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#f1c40f']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        const usageCtx = document.getElementById('usageOverTimeChart')?.getContext('2d');
        if (usageCtx) {
            const years = ['2018', '2019', '2020', '2021', '2022', '2023'];
            const growth = years.map((_, i) => data.filter(e => e.id <= (i + 1) * 5).length);
            new Chart(usageCtx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [{
                        label: 'Corpus Growth',
                        data: growth,
                        borderColor: '#3498db',
                        tension: 0.1,
                        fill: true,
                        backgroundColor: 'rgba(52, 152, 219, 0.1)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }

        const collocationsCtx = document.getElementById('collocationsChart')?.getContext('2d');
        if (collocationsCtx) {
            const collocations = data.slice(0, 5).map(e => ({
                phrase: e.word.split(' ').slice(0, 2).join(' '),
                count: e.frequency
            }));
            new Chart(collocationsCtx, {
                type: 'bar',
                data: {
                    labels: collocations.map(c => c.phrase),
                    datasets: [{
                        label: 'Frequency',
                        data: collocations.map(c => c.count),
                        backgroundColor: '#e67e22'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }
    } catch (error) {
        handleError('initializeCharts', error, 'Failed to initialize charts');
    }
}

// ===== AUTHENTICATION =====
function handleLogin(e) {
    e.preventDefault();
    
    try {
        let username = document.getElementById('username').value;
        let password = document.getElementById('password').value;
        
        // Sanitize and validate inputs
        username = sanitizeInput(username.trim());
        password = sanitizeInput(password.trim());
        
        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }
        
        // Basic validation
        if (username.length < 3) {
            alert('Username must be at least 3 characters');
            return;
        }
        
        if (password.length < 1) { // In real app, would have proper requirements
            alert('Please enter a password');
            return;
        }
        
        const user = {
            username: username,
            role: username === 'admin' ? 'administrator' : 'user',
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('corpusUser_' + username, JSON.stringify(user));
        localStorage.setItem('corpusUser', JSON.stringify(user));
        isLoggedIn = true;
        updateAuthUI(user);
        closeLoginModal();
        
        if (window.location.pathname.includes('admin.html')) {
            updateAdminPage();
        }
        
        alert(`Welcome back, ${username}!`);
        logActivity(`User login: ${username}`);
        
    } catch (error) {
        handleError('handleLogin', error, 'Login failed');
    }
}

function showLoginModal() {
    const modalHTML = `
        <div class="modal-overlay" id="loginModal" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
            <div class="modal-content">
                <h2 id="loginTitle">Login to CORPUS</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit">Login</button>
                        <button type="button" id="cancelLogin">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const firstInput = document.getElementById('username');
    firstInput?.focus();

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('cancelLogin').addEventListener('click', closeLoginModal);
    document.getElementById('loginModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLoginModal();
        }
    });

    const modal = document.getElementById('loginModal');
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLoginModal();
            return;
        }
        if (e.key === 'Tab') {
            const focusable = modal.querySelectorAll('input, button');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    });
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.remove();
    }
}

function logout() {
    localStorage.removeItem('corpusUser');
    isLoggedIn = false;
    document.getElementById('loginBtn').textContent = 'Login';
    document.getElementById('loginBtn').onclick = function(e) {
        e.preventDefault();
        showLoginModal();
    };

    if (window.location.pathname.includes('admin.html')) {
        updateAdminPage();
        window.location.href = 'index.html';
    }

    alert('You have been logged out.');
    logActivity('User logged out');
}

function updateAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = user.username;
        loginBtn.onclick = function(e) {
            e.preventDefault();
            logout();
        };
    }
}

// ===== ADMIN FUNCTIONALITY =====
function updateAdminPage() {
    const prompt = document.getElementById('adminLoginPrompt');
    const actions = document.getElementById('adminActions');
    if (prompt && actions) {
        if (isLoggedIn) {
            prompt.style.display = 'none';
            actions.style.display = 'grid';
        } else {
            prompt.style.display = 'block';
            actions.style.display = 'none';
        }
    }
}

function showAddEntryForm() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = `
        <h3>Add New Entry</h3>
        <form class="admin-form" id="addEntryForm">
            <label for="entryWord">Word/Phrase:</label>
            <input type="text" id="entryWord" placeholder="Enter isiZulu term" required>
            <label for="entryTranslation">Translation:</label>
            <input type="text" id="entryTranslation" placeholder="English translation" required>
            <label for="entryPOS">Part of Speech:</label>
            <select id="entryPOS" required>
                <option value="">Select</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="proverb">Proverb</option>
                <option value="idiom">Idiom</option>
            </select>
            <label for="entryGenre">Genre:</label>
            <select id="entryGenre" required>
                <option value="">Select</option>
                <option value="proverb">Proverb</option>
                <option value="idiom">Idiom</option>
                <option value="narrative">Narrative</option>
                <option value="song">Song</option>
                <option value="greeting">Greeting</option>
                <option value="cultural">Cultural</option>
            </select>
            <label for="entryLanguages">Languages (comma-separated, e.g., isizulu,english):</label>
            <input type="text" id="entryLanguages" value="isizulu" required>
            <label for="entryExamples">Examples (JSON format, e.g., [{"isizulu":"...", "english":"..."}]):</label>
            <textarea id="entryExamples" rows="3" placeholder='[{"isizulu": "Example in isiZulu", "english": "English translation"}]' required></textarea>
            <label for="entryContext">Cultural Context:</label>
            <textarea id="entryContext" rows="3" placeholder="Describe cultural significance" required></textarea>
            <button type="submit">Add Entry</button>
        </form>
    `;
    const form = document.getElementById('addEntryForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        try {
            const entry = {
                word: document.getElementById('entryWord').value,
                translation: document.getElementById('entryTranslation').value,
                pos: document.getElementById('entryPOS').value,
                genre: document.getElementById('entryGenre').value,
                languages: document.getElementById('entryLanguages').value.split(',').map(l => l.trim()),
                examples: JSON.parse(document.getElementById('entryExamples').value),
                culturalContext: document.getElementById('entryContext').value
            };
            saveEntry(entry);
            alert('Entry added successfully! Refresh search/browse to see it.');
            form.reset();
        } catch (err) {
            alert('Error: Invalid JSON in examples. Use valid format.');
        }
    });
}

function handleImport(e) {
    e.preventDefault();
    
    try {
        const fileInput = document.getElementById('importFile');
        const file = fileInput?.files[0];
        
        if (!file) {
            alert('Please select a file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const newEntries = JSON.parse(e.target.result);
                validateImportedData(newEntries);
                
                let importedCount = 0;
                newEntries.forEach(entry => {
                    try {
                        saveEntry(entry);
                        importedCount++;
                    } catch (saveError) {
                        console.warn('Failed to import entry:', entry.word, saveError);
                    }
                });
                
                alert(`Successfully imported ${importedCount} out of ${newEntries.length} entries!`);
                
            } catch (parseError) {
                handleError('handleImport', parseError, 'Invalid file format. Please check the JSON structure.');
            }
        };
        
        reader.onerror = function() {
            handleError('handleImport', new Error('File reading failed'), 'Failed to read file');
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        handleError('handleImport', error, 'Import failed');
    }
}

function showImportDataForm() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = `
        <h3>Import Data</h3>
        <form class="admin-form" id="importForm">
            <label for="importFile">Upload JSON File:</label>
            <input type="file" id="importFile" accept=".json" required>
            <button type="submit">Import</button>
        </form>
        <div class="import-info">
            <h4>File Format Requirements:</h4>
            <ul>
                <li>Must be valid JSON array</li>
                <li>Each entry must have: word, translation, pos, genre, languages, examples, culturalContext</li>
                <li>Examples must be array of objects with isizulu and english properties</li>
                <li>Languages must be array of strings</li>
            </ul>
        </div>
    `;
    const form = document.getElementById('importForm');
    form.addEventListener('submit', handleImport);
}

function exportData() {
    try {
        const data = getCorpusData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'corpus-data.json';
        a.click();
        URL.revokeObjectURL(url);
        logActivity('Data exported');
    } catch (error) {
        handleError('exportData', error, 'Export failed');
    }
}

function showUserManagement() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    const users = getUsers();
    let html = '<h3>User Management (View Only)</h3><ul>';
    users.forEach(user => {
        html += `<li>${user.username} (Role: ${user.role}) - Last login: ${user.lastLogin || 'Unknown'}</li>`;
    });
    html += '</ul><p>No edit/delete allowed.</p>';
    content.innerHTML = html;
}

function showActivityLog() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    const logs = getActivityLogs();
    let html = '<h3>Activity Log (View Only)</h3><ul>';
    logs.slice(0, 20).forEach(log => { // Last 20
        html += `<li>${log.action} - ${new Date(log.timestamp).toLocaleString()}</li>`;
    });
    html += '</ul>';
    content.innerHTML = html;
}

function showSystemSettings() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    
    content.innerHTML = `
        <h3>System Settings</h3>
        <form class="admin-form" id="systemSettingsForm">
            <div class="form-group">
                <label>
                    <input type="checkbox" id="publicStats" ${localStorage.getItem('publicStats') === 'true' ? 'checked' : ''}>
                    Enable Public Statistics
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="autoBackup" ${localStorage.getItem('autoBackup') === 'true' ? 'checked' : ''}>
                    Enable Auto Backup (Weekly)
                </label>
            </div>
            <div class="form-group">
                <label for="searchLimit">Search Results Limit:</label>
                <input type="number" id="searchLimit" value="${localStorage.getItem('searchLimit') || '50'}" min="10" max="200">
            </div>
            <div class="form-actions">
                <button type="submit">Save Settings</button>
                <button type="button" onclick="resetSystemSettings()">Reset to Defaults</button>
            </div>
        </form>
        <div class="system-info">
            <h4>System Information</h4>
            <p>Total Entries: ${getCorpusData().length}</p>
            <p>Storage Used: ${calculateStorageUsage()} KB</p>
            <p>Last Backup: ${localStorage.getItem('lastBackup') || 'Never'}</p>
        </div>
    `;
    
    document.getElementById('systemSettingsForm').addEventListener('submit', saveSystemSettings);
}

function saveSystemSettings(e) {
    e.preventDefault();
    
    try {
        const publicStats = document.getElementById('publicStats').checked;
        const autoBackup = document.getElementById('autoBackup').checked;
        const searchLimit = document.getElementById('searchLimit').value;
        
        localStorage.setItem('publicStats', publicStats.toString());
        localStorage.setItem('autoBackup', autoBackup.toString());
        localStorage.setItem('searchLimit', searchLimit);
        
        alert('System settings saved successfully!');
        logActivity('System settings updated');
        
    } catch (error) {
        handleError('saveSystemSettings', error, 'Failed to save settings');
    }
}

function resetSystemSettings() {
    if (confirm('Reset all system settings to defaults?')) {
        localStorage.removeItem('publicStats');
        localStorage.removeItem('autoBackup');
        localStorage.removeItem('searchLimit');
        showSystemSettings();
        alert('Settings reset to defaults');
    }
}

function calculateStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length;
        }
    }
    return (total / 1024).toFixed(2);
}

function backupData() {
    try {
        const backup = {
            data: getCorpusData(),
            logs: getActivityLogs(),
            users: getUsers(),
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `corpus-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        localStorage.setItem('lastBackup', new Date().toLocaleString());
        logActivity('System backup created');
        alert('Backup created successfully!');
    } catch (error) {
        handleError('backupData', error, 'Backup failed');
    }
}

// ===== UTILITY FUNCTIONS =====
function toggleMobileMenu() {
    document.getElementById('primaryNav').classList.toggle('active');
}

function openQuickSearch() {
    window.location.href = 'search.html';
}

// ===== INITIALIZATION =====
function setupEnhancedEventListeners() {
    // Debounced search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            if (e.target.value.length >= 2) { // Search after 2 characters
                performSearch();
            }
        }, 500));
    }
    
    // Global error handler
    window.addEventListener('error', function(e) {
        handleError('Global', e.error, 'A unexpected error occurred');
    });
    
    // Handle promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        handleError('Promise', e.reason, 'A system error occurred');
    });
    
    // Existing event listeners...
    document.getElementById('hamburger')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('openSearchBtn')?.addEventListener('click', openQuickSearch);
    document.getElementById('loginBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (isLoggedIn) {
            logout();
        } else {
            showLoginModal();
        }
    });
    
    // Enhanced tag clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('search-tag')) {
            e.preventDefault();
            const searchTerm = e.target.textContent;
            if (window.location.pathname.includes('search.html')) {
                performSearch(searchTerm);
            } else {
                localStorage.setItem('pendingSearch', searchTerm);
                window.location.href = 'search.html';
            }
        }
    });
}

function initializeApp() {
    if (!isStorageAvailable()) {
        console.warn('LocalStorage not available - some features may be limited');
        // Could implement fallback storage or warn user
    }
    
    seedData();
    const userData = localStorage.getItem('corpusUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            isLoggedIn = true;
            updateAuthUI(user);
        } catch (error) {
            console.error('Invalid user data:', error);
            localStorage.removeItem('corpusUser');
        }
    }
    console.log('CORPUS System initialized');
}

function initializePage() {
    const path = window.location.pathname;
    document.getElementById('main')?.focus();
    
    if (path.includes('search.html')) {
        document.getElementById('searchButton')?.addEventListener('click', () => performSearch());
        document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        document.getElementById('clearHistoryBtn')?.addEventListener('click', clearSearchHistory);
        displaySearchHistory();
        
        const pendingSearch = localStorage.getItem('pendingSearch');
        if (pendingSearch) {
            document.getElementById('searchInput').value = pendingSearch;
            performSearch(pendingSearch);
            localStorage.removeItem('pendingSearch');
        }
    } else if (path.includes('browse.html')) {
        document.querySelectorAll('.browse-button').forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                browseCategory(category);
            });
        });
    } else if (path.includes('analysis.html')) {
        initializeCharts();
    } else if (path.includes('admin.html')) {
        updateAdminPage();
        document.getElementById('adminLoginButton')?.addEventListener('click', showLoginModal);
        if (isLoggedIn) {
            document.getElementById('addEntryBtn')?.addEventListener('click', showAddEntryForm);
            document.getElementById('importDataBtn')?.addEventListener('click', showImportDataForm);
            document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
            document.getElementById('manageUsersBtn')?.addEventListener('click', showUserManagement);
            document.getElementById('viewActivityBtn')?.addEventListener('click', showActivityLog);
            document.getElementById('systemSettingsBtn')?.addEventListener('click', showSystemSettings);
            document.getElementById('backupDataBtn')?.addEventListener('click', backupData);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeApp();
        setupEnhancedEventListeners();
        initializePage();
        
        // Initial cleanup
        cleanupOldData();
        
    } catch (error) {
        handleError('DOMContentLoaded', error, 'Failed to initialize application');
    }
});

// ===== GLOBAL EXPORTS =====
window.CORPUS = {
    performSearch,
    browseCategory,
    showLoginModal,
    logout,
    sanitizeInput,
    validateEntry,
    getCorpusData,
    // Expose for debugging
    _debug: {
        clearAllData: function() {
            if (confirm('Clear ALL data? This cannot be undone!')) {
                localStorage.clear();
                location.reload();
            }
        },
        exportAll: function() {
            const allData = {
                corpus: getCorpusData(),
                logs: getActivityLogs(),
                users: getUsers(),
                settings: {
                    publicStats: localStorage.getItem('publicStats'),
                    searchLimit: localStorage.getItem('searchLimit')
                },
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `corpus-full-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
};

console.log('CORPUS System Enhanced JS loaded');
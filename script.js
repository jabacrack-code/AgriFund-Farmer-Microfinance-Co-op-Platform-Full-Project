// AgriFund Main JavaScript File
class AgriFund {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserSession();
        this.initializeEventListeners();
        this.updateImpactStats();
        this.initializeNavigation();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Mobile menu toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Form submissions
        const farmerForm = document.getElementById('farmerRegistrationForm');
        if (farmerForm) {
            farmerForm.addEventListener('submit', this.handleFarmerRegistration.bind(this));
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleUserRegistration.bind(this));
        }

        // Investment buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('invest-btn')) {
                this.handleInvestment(e.target.dataset.farmerId);
            }
            if (e.target.classList.contains('repayment-btn')) {
                this.handleRepaymentUpdate(e.target.dataset.loanId);
            }
        });
    }

    // Navigation management
    initializeNavigation() {
        // Check authentication status and update nav
        this.updateNavigationState();
    }

    updateNavigationState() {
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn && this.currentUser) {
            loginBtn.textContent = `${this.currentUser.name} (${this.currentUser.type})`;
            loginBtn.href = '#';
            loginBtn.onclick = () => this.logout();
        }
    }

    // User session management
    loadUserSession() {
        const session = localStorage.getItem('agrifund_session');
        if (session) {
            this.currentUser = JSON.parse(session);
        }
    }

    saveUserSession() {
        localStorage.setItem('agrifund_session', JSON.stringify(this.currentUser));
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('agrifund_session');
        window.location.href = 'index.html';
    }

    // Authentication
    handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const userType = formData.get('userType');

        // Get users from localStorage
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password && u.type === userType);

        if (user) {
            this.currentUser = user;
            this.saveUserSession();
            this.showAlert('Login successful!', 'success');
            
            // Redirect based on user type
            setTimeout(() => {
                if (userType === 'farmer') {
                    window.location.href = 'farmer-registration.html';
                } else {
                    window.location.href = 'investor-dashboard.html';
                }
            }, 1000);
        } else {
            this.showAlert('Invalid credentials. Please try again.', 'error');
        }
    }

    handleUserRegistration(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const userData = {
            id: this.generateId(),
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            type: formData.get('userType'),
            phone: formData.get('phone'),
            createdAt: new Date().toISOString()
        };

        // Validate email uniqueness
        const users = this.getUsers();
        if (users.find(u => u.email === userData.email)) {
            this.showAlert('Email already registered. Please use a different email.', 'error');
            return;
        }

        // Save user
        users.push(userData);
        localStorage.setItem('agrifund_users', JSON.stringify(users));
        
        this.showAlert('Registration successful! Please login to continue.', 'success');
        
        // Switch to login tab
        setTimeout(() => {
            document.getElementById('loginTab').click();
        }, 1500);
    }

    // Farmer registration
    handleFarmerRegistration(event) {
        event.preventDefault();
        
        if (!this.currentUser || this.currentUser.type !== 'farmer') {
            this.showAlert('Please login as a farmer to submit loan requests.', 'error');
            return;
        }

        const formData = new FormData(event.target);
        
        const farmerData = {
            id: this.generateId(),
            farmerId: this.currentUser.id,
            farmerName: this.currentUser.name,
            farmerEmail: this.currentUser.email,
            farmSize: parseFloat(formData.get('farmSize')),
            location: formData.get('location'),
            cropType: formData.get('cropType'),
            loanAmount: parseFloat(formData.get('loanAmount')),
            purpose: formData.get('purpose'),
            repaymentPeriod: parseInt(formData.get('repaymentPeriod')),
            experience: parseInt(formData.get('experience')),
            previousLoans: formData.get('previousLoans'),
            currentFunding: 0,
            targetAmount: parseFloat(formData.get('loanAmount')),
            status: 'active',
            riskScore: this.calculateRiskScore({
                farmSize: parseFloat(formData.get('farmSize')),
                experience: parseInt(formData.get('experience')),
                previousLoans: formData.get('previousLoans'),
                cropType: formData.get('cropType')
            }),
            createdAt: new Date().toISOString(),
            investors: [],
            repaymentProgress: 0
        };

        // Save farmer data
        const farmers = this.getFarmers();
        farmers.push(farmerData);
        localStorage.setItem('agrifund_farmers', JSON.stringify(farmers));

        this.showAlert('Loan request submitted successfully!', 'success');
        event.target.reset();
        
        // Redirect to investor dashboard to view submission
        setTimeout(() => {
            window.location.href = 'investor-dashboard.html';
        }, 2000);
    }

    // Investment handling
    handleInvestment(farmerId) {
        if (!this.currentUser || this.currentUser.type !== 'investor') {
            this.showAlert('Please login as an investor to make investments.', 'error');
            return;
        }

        const amount = prompt('Enter investment amount ($):');
        if (!amount || isNaN(amount) || amount <= 0) {
            this.showAlert('Please enter a valid investment amount.', 'error');
            return;
        }

        const farmers = this.getFarmers();
        const farmerIndex = farmers.findIndex(f => f.id === farmerId);
        
        if (farmerIndex === -1) {
            this.showAlert('Farmer not found.', 'error');
            return;
        }

        const farmer = farmers[farmerIndex];
        const investmentAmount = parseFloat(amount);
        
        // Check if investment would exceed target
        if (farmer.currentFunding + investmentAmount > farmer.targetAmount) {
            const remaining = farmer.targetAmount - farmer.currentFunding;
            this.showAlert(`Investment amount exceeds remaining funding needed. Maximum: $${remaining.toFixed(2)}`, 'error');
            return;
        }

        // Create investment record
        const investment = {
            id: this.generateId(),
            investorId: this.currentUser.id,
            investorName: this.currentUser.name,
            amount: investmentAmount,
            date: new Date().toISOString(),
            status: 'active'
        };

        // Update farmer data
        farmer.currentFunding += investmentAmount;
        farmer.investors.push(investment);
        
        if (farmer.currentFunding >= farmer.targetAmount) {
            farmer.status = 'funded';
        }

        farmers[farmerIndex] = farmer;
        localStorage.setItem('agrifund_farmers', JSON.stringify(farmers));

        // Save investment to investor's portfolio
        this.addInvestorRecord(investment, farmer);

        this.showAlert(`Successfully invested $${investmentAmount.toFixed(2)}!`, 'success');
        
        // Refresh the page to show updated data
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    // Repayment handling
    handleRepaymentUpdate(loanId) {
        if (!this.currentUser || this.currentUser.type !== 'farmer') {
            this.showAlert('Only farmers can update repayment progress.', 'error');
            return;
        }

        const progress = prompt('Enter repayment progress (0-100%):');
        if (!progress || isNaN(progress) || progress < 0 || progress > 100) {
            this.showAlert('Please enter a valid progress percentage (0-100).', 'error');
            return;
        }

        const farmers = this.getFarmers();
        const farmerIndex = farmers.findIndex(f => f.id === loanId && f.farmerId === this.currentUser.id);
        
        if (farmerIndex === -1) {
            this.showAlert('Loan not found or unauthorized.', 'error');
            return;
        }

        farmers[farmerIndex].repaymentProgress = parseInt(progress);
        if (progress == 100) {
            farmers[farmerIndex].status = 'completed';
        }

        localStorage.setItem('agrifund_farmers', JSON.stringify(farmers));
        
        this.showAlert('Repayment progress updated successfully!', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    // Risk scoring algorithm
    calculateRiskScore(data) {
        let score = 70; // Base score

        // Farm size factor
        if (data.farmSize >= 5) score += 15;
        else if (data.farmSize >= 2) score += 10;
        else score += 5;

        // Experience factor
        if (data.experience >= 10) score += 15;
        else if (data.experience >= 5) score += 10;
        else score += 5;

        // Previous loans factor
        if (data.previousLoans === 'excellent') score += 15;
        else if (data.previousLoans === 'good') score += 10;
        else if (data.previousLoans === 'fair') score += 5;

        // Crop type factor (some crops are more stable)
        const stableCrops = ['maize', 'beans', 'potatoes'];
        if (stableCrops.includes(data.cropType.toLowerCase())) score += 10;

        return Math.min(100, Math.max(30, score));
    }

    // Data management functions
    getUsers() {
        return JSON.parse(localStorage.getItem('agrifund_users')) || [];
    }

    getFarmers() {
        return JSON.parse(localStorage.getItem('agrifund_farmers')) || [];
    }

    addInvestorRecord(investment, farmer) {
        const portfolios = JSON.parse(localStorage.getItem('agrifund_portfolios')) || {};
        
        if (!portfolios[this.currentUser.id]) {
            portfolios[this.currentUser.id] = [];
        }

        portfolios[this.currentUser.id].push({
            ...investment,
            farmerName: farmer.farmerName,
            cropType: farmer.cropType,
            expectedReturn: investment.amount * 1.1, // 10% expected return
            repaymentProgress: farmer.repaymentProgress
        });

        localStorage.setItem('agrifund_portfolios', JSON.stringify(portfolios));
    }

    getInvestorPortfolio(investorId) {
        const portfolios = JSON.parse(localStorage.getItem('agrifund_portfolios')) || {};
        return portfolios[investorId] || [];
    }

    // Update impact statistics on homepage
    updateImpactStats() {
        const farmers = this.getFarmers();
        const users = this.getUsers();
        
        const totalFarmers = farmers.length;
        const totalInvested = farmers.reduce((sum, f) => sum + f.currentFunding, 0);
        const totalAcres = farmers.reduce((sum, f) => sum + f.farmSize, 0);

        // Update DOM elements if they exist
        const farmersElement = document.getElementById('farmersSupported');
        const investedElement = document.getElementById('totalInvested');
        const acresElement = document.getElementById('acresSupported');

        if (farmersElement) farmersElement.textContent = totalFarmers.toLocaleString();
        if (investedElement) investedElement.textContent = `$${totalInvested.toLocaleString()}`;
        if (acresElement) acresElement.textContent = totalAcres.toLocaleString();
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
        `;

        // Insert at top of main content
        const main = document.querySelector('main') || document.body;
        main.insertBefore(alert, main.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Form validation
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.agrifund = new AgriFund();
});

// Global utility functions for specific pages
function loadDashboardData() {
    if (!window.agrifund) return;
    
    const farmers = window.agrifund.getFarmers();
    const currentUser = window.agrifund.currentUser;
    
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    if (currentUser.type === 'investor') {
        displayInvestorDashboard(farmers, currentUser);
    } else if (currentUser.type === 'farmer') {
        displayFarmerDashboard(farmers, currentUser);
    }
}

function displayInvestorDashboard(farmers, investor) {
    const activeFarmers = farmers.filter(f => f.status === 'active');
    const portfolio = window.agrifund.getInvestorPortfolio(investor.id);
    
    // Update investor stats
    const totalInvested = portfolio.reduce((sum, p) => sum + p.amount, 0);
    const activeInvestments = portfolio.filter(p => p.status === 'active').length;
    
    document.getElementById('totalInvested').textContent = window.agrifund.formatCurrency(totalInvested);
    document.getElementById('activeInvestments').textContent = activeInvestments;
    document.getElementById('avgReturn').textContent = '12%'; // Mock average return
    document.getElementById('farmersSupported').textContent = portfolio.length;

    // Display available opportunities
    const opportunitiesContainer = document.getElementById('investmentOpportunities');
    if (opportunitiesContainer) {
        opportunitiesContainer.innerHTML = activeFarmers.map(farmer => `
            <div class="card farmer-card">
                <h3>${farmer.farmerName}</h3>
                <div class="farmer-info">
                    <div><strong>Crop:</strong> ${farmer.cropType}</div>
                    <div><strong>Location:</strong> ${farmer.location}</div>
                    <div><strong>Farm Size:</strong> ${farmer.farmSize} acres</div>
                    <div><strong>Experience:</strong> ${farmer.experience} years</div>
                </div>
                <div class="risk-score risk-${farmer.riskScore >= 80 ? 'low' : farmer.riskScore >= 60 ? 'medium' : 'high'}">
                    Risk Score: ${farmer.riskScore}/100
                </div>
                <div>
                    <strong>Funding Progress:</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(farmer.currentFunding / farmer.targetAmount * 100)}%"></div>
                    </div>
                    ${window.agrifund.formatCurrency(farmer.currentFunding)} / ${window.agrifund.formatCurrency(farmer.targetAmount)}
                </div>
                <button class="btn btn-primary invest-btn" data-farmer-id="${farmer.id}">
                    <i class="fas fa-hand-holding-usd"></i> Invest Now
                </button>
            </div>
        `).join('');
    }

    // Display portfolio
    const portfolioContainer = document.getElementById('investorPortfolio');
    if (portfolioContainer && portfolio.length > 0) {
        portfolioContainer.innerHTML = portfolio.map(investment => `
            <div class="card">
                <h4>${investment.farmerName}</h4>
                <div class="farmer-info">
                    <div><strong>Invested:</strong> ${window.agrifund.formatCurrency(investment.amount)}</div>
                    <div><strong>Expected Return:</strong> ${window.agrifund.formatCurrency(investment.expectedReturn)}</div>
                    <div><strong>Crop:</strong> ${investment.cropType}</div>
                    <div><strong>Date:</strong> ${window.agrifund.formatDate(investment.date)}</div>
                </div>
                <div>
                    <strong>Repayment Progress:</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${investment.repaymentProgress || 0}%"></div>
                    </div>
                    ${investment.repaymentProgress || 0}% Complete
                </div>
            </div>
        `).join('');
    }
}

function displayFarmerDashboard(farmers, farmer) {
    const farmerLoans = farmers.filter(f => f.farmerId === farmer.id);
    
    // Update farmer stats
    const totalRequested = farmerLoans.reduce((sum, l) => sum + l.targetAmount, 0);
    const totalReceived = farmerLoans.reduce((sum, l) => sum + l.currentFunding, 0);
    const activeLoans = farmerLoans.filter(l => l.status === 'active' || l.status === 'funded').length;
    
    const statsContainer = document.querySelector('.dashboard-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card-small">
                <h3>${farmerLoans.length}</h3>
                <p>Total Loan Requests</p>
            </div>
            <div class="stat-card-small">
                <h3>${window.agrifund.formatCurrency(totalRequested)}</h3>
                <p>Total Requested</p>
            </div>
            <div class="stat-card-small">
                <h3>${window.agrifund.formatCurrency(totalReceived)}</h3>
                <p>Total Received</p>
            </div>
            <div class="stat-card-small">
                <h3>${activeLoans}</h3>
                <p>Active Loans</p>
            </div>
        `;
    }

    // Display loan requests
    const loansContainer = document.getElementById('farmerLoans');
    if (loansContainer) {
        loansContainer.innerHTML = farmerLoans.map(loan => `
            <div class="card">
                <h4>${loan.cropType} - ${loan.location}</h4>
                <div class="farmer-info">
                    <div><strong>Amount:</strong> ${window.agrifund.formatCurrency(loan.targetAmount)}</div>
                    <div><strong>Purpose:</strong> ${loan.purpose}</div>
                    <div><strong>Status:</strong> <span class="status-${loan.status}">${loan.status.toUpperCase()}</span></div>
                    <div><strong>Created:</strong> ${window.agrifund.formatDate(loan.createdAt)}</div>
                </div>
                <div>
                    <strong>Funding Progress:</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(loan.currentFunding / loan.targetAmount * 100)}%"></div>
                    </div>
                    ${window.agrifund.formatCurrency(loan.currentFunding)} / ${window.agrifund.formatCurrency(loan.targetAmount)}
                </div>
                ${loan.status === 'funded' ? `
                    <div style="margin-top: 1rem;">
                        <strong>Repayment Progress:</strong>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${loan.repaymentProgress || 0}%"></div>
                        </div>
                        ${loan.repaymentProgress || 0}% Complete
                        <button class="btn btn-secondary repayment-btn" data-loan-id="${loan.id}" style="margin-top: 0.5rem;">
                            Update Progress
                        </button>
                    </div>
                ` : ''}
                <div style="margin-top: 1rem;">
                    <small><strong>Investors:</strong> ${loan.investors.length}</small>
                </div>
            </div>
        `).join('');
    }
}

class MultiProfileFinanceTracker {
    constructor() {
        this.profiles = JSON.parse(localStorage.getItem('financeProfiles')) || {};
        this.currentProfile = null;
        this.init();
    }

    init() {
        this.populateProfileDropdown();
        this.bindEvents();
        this.updateDisplay();
    }

    populateProfileDropdown() {
        const select = document.getElementById('profile-select');
        select.innerHTML = '<option value="">Select a profile</option>';
        
        Object.keys(this.profiles).forEach(profileName => {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            select.appendChild(option);
        });
    }

    bindEvents() {
        document.getElementById('profile-select').addEventListener('change', (e) => {
            this.currentProfile = e.target.value;
            this.updateDisplay();
            this.renderTransactions();
        });
        
        document.getElementById('add-profile').addEventListener('click', () => {
            const newProfileName = document.getElementById('new-profile-name').value.trim();
            
            if (!newProfileName) {
                alert('Please enter a profile name');
                return;
            }
            
            if (this.profiles[newProfileName]) {
                alert('Profile already exists');
                return;
            }
            
            this.profiles[newProfileName] = [];
            this.currentProfile = newProfileName;
            this.saveProfiles();
            this.populateProfileDropdown();
            
            document.getElementById('profile-select').value = this.currentProfile;
            document.getElementById('new-profile-name').value = '';
            
            this.updateDisplay();
            this.renderTransactions();
            this.showNotification(`Profile "${newProfileName}" created successfully!`);
        });

        document.getElementById('delete-profile').addEventListener('click', () => {
            if (!this.currentProfile) return;
            
            if (confirm(`Are you sure you want to delete profile "${this.currentProfile}" and all its data?`)) {
                delete this.profiles[this.currentProfile];
                this.currentProfile = null;
                this.saveProfiles();
                this.populateProfileDropdown();
                
                document.getElementById('profile-select').value = '';
                this.updateDisplay();
                this.showNotification('Profile deleted successfully!');
            }
        });

        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            this.handleTransactionSubmit(e);
        });
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        if (!this.currentProfile) {
            alert('Please select a profile first');
            return;
        }
        
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;

        if (!description || !amount || !type) {
            alert('Please fill in all fields');
            return;
        }

        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        const transaction = {
            id: Date.now(),
            description,
            amount,
            type,
            date: new Date().toLocaleDateString()
        };

        this.profiles[this.currentProfile].unshift(transaction);
        this.saveProfiles();
        this.updateDisplay();
        this.renderTransactions();
        
        e.target.reset();
        this.showNotification('Transaction added successfully!');
    }

    deleteTransaction(id) {
        if (!this.currentProfile) return;
        
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.profiles[this.currentProfile] = this.profiles[this.currentProfile].filter(t => t.id !== id);
            this.saveProfiles();
            this.updateDisplay();
            this.renderTransactions();
            this.showNotification('Transaction deleted successfully!');
        }
    }

    updateDisplay() {
        const mainContent = document.getElementById('main-content');
        const noProfileMessage = document.getElementById('no-profile-message');
        const profileInfo = document.getElementById('profile-info');
        const currentProfileEl = document.getElementById('current-profile');
        const deleteBtn = document.getElementById('delete-profile');

        if (this.currentProfile) {
            mainContent.style.display = 'block';
            noProfileMessage.style.display = 'none';
            profileInfo.style.display = 'block';
            currentProfileEl.textContent = `Current Profile: ${this.currentProfile}`;
            deleteBtn.disabled = false;

            const transactions = this.profiles[this.currentProfile];
            const balance = this.calculateBalance(transactions);
            const totalIncome = this.calculateTotal(transactions, 'income');
            const totalExpense = this.calculateTotal(transactions, 'expense');

            const balanceEl = document.getElementById('balance');
            balanceEl.textContent = `$${balance.toFixed(2)}`;
            balanceEl.className = balance >= 0 ? 'balance' : 'balance negative';

            document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
            document.getElementById('total-expense').textContent = `$${totalExpense.toFixed(2)}`;
            document.getElementById('transaction-count').textContent = transactions.length;
        } else {
            mainContent.style.display = 'none';
            noProfileMessage.style.display = 'block';
            profileInfo.style.display = 'none';
            deleteBtn.disabled = true;
        }
    }

    calculateBalance(transactions) {
        return transactions.reduce((balance, transaction) => {
            return transaction.type === 'income' 
                ? balance + transaction.amount 
                : balance - transaction.amount;
        }, 0);
    }

    calculateTotal(transactions, type) {
        return transactions
            .filter(t => t.type === type)
            .reduce((total, t) => total + t.amount, 0);
    }

    renderTransactions() {
        const container = document.getElementById('transactions-list');
        
        if (!this.currentProfile) {
            container.innerHTML = '<div class="no-transactions">Please select a profile first.</div>';
            return;
        }

        const transactions = this.profiles[this.currentProfile];

        if (transactions.length === 0) {
            container.innerHTML = '<div class="no-transactions">No transactions yet. Add your first transaction above!</div>';
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction">
                <div class="transaction-info">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-date">${transaction.date}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
                <button class="delete-btn" onclick="tracker.deleteTransaction(${transaction.id})" title="Delete transaction">
                    ×
                </button>
            </div>
        `).join('');
    }

    saveProfiles() {
        localStorage.setItem('financeProfiles', JSON.stringify(this.profiles));
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            z-index: 1000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}

const tracker = new MultiProfileFinanceTracker();

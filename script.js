// --- 1. Smooth Scrolling ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

// --- 2. Scroll Animation (Fade In Elements) ---
const faders = document.querySelectorAll('.fade-in, .fade-in-section, .animated-card, .animated-text, .skill-category ul li');
const appearOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    observer.unobserve(entry.target);
  });
}, appearOptions);

faders.forEach(fader => appearOnScroll.observe(fader));

// --- 3. Animate Hero Section on Load ---
window.addEventListener('load', function() {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        setTimeout(() => {
            heroSection.classList.add('visible');
        }, 100);
    }
});

// --- 4. Animate Skill List Items with Staggered Delay ---
function animateSkillItems() {
    const skillCategories = document.querySelectorAll('.skill-category');
    skillCategories.forEach(category => {
        const items = category.querySelectorAll('ul li');
        items.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
            item.classList.add('visible');
        });
    });
}

const skillsSection = document.querySelector('#skills');
if (skillsSection) {
    const skillsObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkillItems();
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    skillsObserver.observe(skillsSection);
}

// --- 5. Header Animation on Scroll ---
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    } else {
        header.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    }
});

// ========== SECURE GOAL TRACKER (Admin Password Protected) ==========
(() => {
    // 🔐 CONFIG: Set your hashed password here (DO NOT PUT PLAIN TEXT!)
    // Generate your hash at: https://emn178.github.io/online-tools/sha256.html
    // Example: "mypassword" → "d74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f"
    const HASHED_PASSWORD = "Youngking@2002"; // ← REPLACE THIS!

    // DOM Elements
    const progressFill = document.getElementById('progressFill');
    const phaseText = document.getElementById('phaseText');
    const percentText = document.getElementById('percentText');
    const goalList = document.getElementById('goalList');
    const unlockButton = document.getElementById('unlockButton');
    const passwordForm = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('passwordInput');
    const addGoalForm = document.getElementById('addGoalForm');
    const goalInput = document.getElementById('goalInput');
    const cancelUnlock = document.getElementById('cancelUnlock');
    const lockButton = document.getElementById('lockButton');

    if (!unlockButton) return; // Exit if section not present

    // Load goals from localStorage or use defaults
    let goals = JSON.parse(localStorage.getItem('motakeGoals')) || [
        { id: Date.now(), text: "Complete BSc in IT", completed: false },
        { id: Date.now() + 1, text: "Build portfolio website", completed: true },
        { id: Date.now() + 2, text: "Learn React.js", completed: false },
        { id: Date.now() + 3, text: "Land internship", completed: false }
    ];

    // SHA-256 hashing (pure JS, no external lib)
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Save goals
    function saveGoals() {
        localStorage.setItem('motakeGoals', JSON.stringify(goals));
        updateProgress();
    }

    // Update progress bar & phase text
    function updateProgress() {
        const total = goals.length;
        const completed = goals.filter(g => g.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        progressFill.style.width = `${percent}%`;
        percentText.textContent = `${percent}%`;

        if (completed === 0) {
            phaseText.textContent = "Just getting started!";
        } else if (completed === total) {
            phaseText.textContent = "🎉 All goals achieved!";
        } else {
            phaseText.textContent = `${completed} of ${total} goals completed`;
        }

        renderGoals();
    }

    // Render goals (read-only for visitors)
    function renderGoals() {
        goalList.innerHTML = '';
        goals.forEach(goal => {
            const item = document.createElement('div');
            item.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <input type="checkbox" class="goal-checkbox" data-id="${goal.id}" ${goal.completed ? 'checked' : ''} ${isUnlocked ? '' : 'disabled'}>
                <span class="goal-text">${goal.text}</span>
            `;
            goalList.appendChild(item);

            if (isUnlocked) {
                const checkbox = item.querySelector('.goal-checkbox');
                checkbox.addEventListener('change', () => {
                    const goalToUpdate = goals.find(g => g.id == goal.id);
                    if (goalToUpdate) {
                        goalToUpdate.completed = checkbox.checked;
                        saveGoals();
                    }
                });
            }
        });
    }

    // 🔐 Admin State
    let isUnlocked = false;

    // Show/hide forms
    function showPasswordForm() {
        passwordForm.classList.remove('hidden');
        unlockButton.style.display = 'none';
    }

    function showGoalForm() {
        isUnlocked = true;
        passwordForm.classList.add('hidden');
        addGoalForm.classList.remove('hidden');
        renderGoals(); // Re-render with interactive checkboxes
    }

    function lockEditor() {
        isUnlocked = false;
        addGoalForm.classList.add('hidden');
        unlockButton.style.display = 'inline-block';
        renderGoals(); // Re-render with disabled checkboxes
    }

    // Events
    unlockButton.addEventListener('click', showPasswordForm);
    cancelUnlock.addEventListener('click', () => {
        passwordForm.classList.add('hidden');
        unlockButton.style.display = 'inline-block';
        passwordInput.value = '';
        document.querySelectorAll('.password-error').forEach(el => el.remove());
    });

    lockButton.addEventListener('click', lockEditor);

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = passwordInput.value.trim();
        if (!input) return;

        try {
            const hash = await sha256(input);
            if (hash === HASHED_PASSWORD) {
                showGoalForm();
                passwordInput.value = '';
                document.querySelectorAll('.password-error').forEach(el => el.remove());
            } else {
                // Show error
                let error = document.querySelector('.password-error');
                if (!error) {
                    error = document.createElement('p');
                    error.className = 'password-error';
                    passwordForm.appendChild(error);
                }
                error.textContent = "❌ Incorrect password. Try again.";
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (err) {
            console.error("Hashing failed:", err);
        }
    });

    addGoalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = goalInput.value.trim();
        if (text) {
            goals.push({
                id: Date.now(),
                text: text,
                completed: false
            });
            saveGoals();
            goalInput.value = '';
            goalInput.focus();
        }
    });

    // Initialize
    updateProgress();
})();

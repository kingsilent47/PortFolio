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

// ========== SECURE GOAL TRACKER WITH SUBGOALS ==========
(() => {
    // 🔐 CONFIG: Replace with YOUR SHA-256 hash (https://emn178.github.io/online-tools/sha256.html)
    const HASHED_PASSWORD = "d74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f"; // ← CHANGE ME!

    // DOM
    const progressFill = document.getElementById('progressFill');
    const phaseText = document.getElementById('phaseText');
    const percentText = document.getElementById('percentText');
    const goalList = document.getElementById('goalList');
    const unlockButton = document.getElementById('unlockButton');
    const passwordForm = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('passwordInput');
    const addGoalForm = document.getElementById('addGoalForm');
    const goalInput = document.getElementById('goalInput');
    const isMainGoalCheck = document.getElementById('isMainGoal');
    const allowSubgoalsCheck = document.getElementById('allowSubgoals');
    const cancelUnlock = document.getElementById('cancelUnlock');
    const lockButton = document.getElementById('lockButton');

    if (!unlockButton) return;

    // Load goals
    let goals = JSON.parse(localStorage.getItem('motakeGoals')) || [
        {
            id: 'g1',
            text: "Complete BSc in IT",
            completed: false,
            isMain: true,
            allowSubgoals: true,
            subgoals: [
                { id: 'sg1', text: "Pass Algorithms module", completed: true },
                { id: 'sg2', text: "Pass Databases module", completed: false },
                { id: 'sg3', text: "Submit final project", completed: false }
            ]
        },
        {
            id: 'g2',
            text: "Build professional portfolio",
            completed: true,
            isMain: true,
            allowSubgoals: false,
            subgoals: []
        },
        {
            id: 'g3',
            text: "Learn React.js",
            completed: false,
            isMain: false,
            allowSubgoals: false,
            subgoals: []
        }
    ];

    let isUnlocked = false;

    // SHA-256
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Save
    function saveGoals() {
        localStorage.setItem('motakeGoals', JSON.stringify(goals));
        updateProgress();
    }

    // Calculate total progress (main + subgoals weighted equally)
    function calculateProgress() {
        let totalTasks = 0;
        let completedTasks = 0;

        goals.forEach(goal => {
            // Each main goal counts as 1 task
            totalTasks += 1;
            if (goal.completed) completedTasks += 1;

            // Each subgoal also counts as 1 task
            goal.subgoals.forEach(sub => {
                totalTasks += 1;
                if (sub.completed) completedTasks += 1;
            });
        });

        return {
            percent: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
            completed: completedTasks,
            total: totalTasks
        };
    }

    function updateProgress() {
        const { percent, completed, total } = calculateProgress();

        progressFill.style.width = `${percent}%`;
        percentText.textContent = `${percent}%`;

        if (completed === 0) {
            phaseText.textContent = "Just getting started!";
        } else if (completed === total) {
            phaseText.textContent = "🎉 All goals & subgoals achieved!";
        } else {
            phaseText.textContent = `${completed} of ${total} tasks done`;
        }

        renderGoals();
    }

    // Toggle subgoal visibility
    function toggleSubgoals(goalId) {
        const container = document.querySelector(`#subgoals-${goalId}`);
        if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
            const btn = document.querySelector(`[data-goal-id="${goalId}"] .toggle-subgoals`);
            if (btn) btn.textContent = container.style.display === 'none' ? '➕' : '➖';
        }
    }

    // Render goals
    function renderGoals() {
        goalList.innerHTML = '';

        goals.forEach(goal => {
            const isMain = goal.isMain || false;
            const hasSubgoals = goal.subgoals && goal.subgoals.length > 0;

            const goalEl = document.createElement('div');
            goalEl.className = `goal-item ${isMain ? 'main' : ''} ${goal.completed ? 'completed' : ''}`;
            goalEl.innerHTML = `
                <div class="goal-header">
                    <input type="checkbox" class="goal-checkbox" data-id="${goal.id}" ${goal.completed ? 'checked' : ''} ${isUnlocked ? '' : 'disabled'}>
                    <span class="goal-text">${goal.text}</span>
                    ${isMain && goal.allowSubgoals && hasSubgoals ? 
                        `<button class="toggle-subgoals" onclick="toggleSubgoals('${goal.id}')">➖</button>` : ''}
                </div>
                ${isMain && goal.allowSubgoals ? `
                    <div id="subgoals-${goal.id}" class="subgoals" style="display: block;">
                        ${goal.subgoals.map(sub => `
                            <div class="subgoal-item ${sub.completed ? 'completed' : ''}">
                                <input type="checkbox" class="subgoal-checkbox" data-parent="${goal.id}" data-id="${sub.id}" ${sub.completed ? 'checked' : ''} ${isUnlocked ? '' : 'disabled'}>
                                <span class="subgoal-text">${sub.text}</span>
                            </div>
                        `).join('')}
                        ${isUnlocked ? `
                            <button class="add-subgoal-btn" onclick="showSubgoalInput('${goal.id}')">
                                <i class="fas fa-plus"></i> Add Subgoal
                            </button>
                            <div id="subgoal-input-${goal.id}" class="subgoal-input-form">
                                <input type="text" class="subgoal-input" placeholder="e.g., Read chapter 3">
                                <div class="subgoal-input-btns">
                                    <button type="button" onclick="addSubgoal('${goal.id}')">Add</button>
                                    <button type="button" onclick="hideSubgoalInput('${goal.id}')">Cancel</button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            `;

            goalList.appendChild(goalEl);

            // Attach event listeners (if unlocked)
            if (isUnlocked) {
                const mainCheckbox = goalEl.querySelector('.goal-checkbox');
                mainCheckbox?.addEventListener('change', (e) => {
                    const g = goals.find(g => g.id == e.target.dataset.id);
                    if (g) {
                        g.completed = e.target.checked;
                        saveGoals();
                    }
                });

                goalEl.querySelectorAll('.subgoal-checkbox').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        const parentId = e.target.dataset.parent;
                        const subId = e.target.dataset.id;
                        const g = goals.find(g => g.id == parentId);
                        if (g) {
                            const sub = g.subgoals.find(s => s.id == subId);
                            if (sub) {
                                sub.completed = e.target.checked;
                                saveGoals();
                            }
                        }
                    });
                });
            }
        });
    }

    // Subgoal UI helpers (exposed globally for onclick)
    window.toggleSubgoals = toggleSubgoals;
    window.showSubgoalInput = (goalId) => {
        document.getElementById(`subgoal-input-${goalId}`)?.classList.add('visible');
    };
    window.hideSubgoalInput = (goalId) => {
        const el = document.getElementById(`subgoal-input-${goalId}`);
        if (el) {
            el.classList.remove('visible');
            el.querySelector('.subgoal-input').value = '';
        }
    };
    window.addSubgoal = (goalId) => {
        const input = document.querySelector(`#subgoal-input-${goalId} .subgoal-input`);
        const text = input.value.trim();
        if (text) {
            const goal = goals.find(g => g.id == goalId);
            if (goal) {
                goal.subgoals.push({
                    id: `sg_${Date.now()}`,
                    text: text,
                    completed: false
                });
                saveGoals();
                input.value = '';
                hideSubgoalInput(goalId);
            }
        }
    };

    // 🔐 Unlock/Lock
    function showPasswordForm() {
        passwordForm.classList.remove('hidden');
        unlockButton.style.display = 'none';
    }

    function showGoalForm() {
        isUnlocked = true;
        passwordForm.classList.add('hidden');
        addGoalForm.classList.remove('hidden');
        renderGoals();
    }

    function lockEditor() {
        isUnlocked = false;
        addGoalForm.classList.add('hidden');
        unlockButton.style.display = 'inline-block';
        renderGoals();
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
        const isMain = isMainGoalCheck.checked;
        const allowSub = allowSubgoalsCheck.checked && isMain;

        if (text) {
            goals.push({
                id: `g_${Date.now()}`,
                text: text,
                completed: false,
                isMain: isMain,
                allowSubgoals: allowSub,
                subgoals: []
            });
            saveGoals();
            goalInput.value = '';
            goalInput.focus();
        }
    });

    // Initialize
    updateProgress();
})();

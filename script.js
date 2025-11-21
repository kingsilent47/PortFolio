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

// ========== GOAL TRACKER: Edit, Delete, Subgoals, Undo ========
(() => {
    // 🔐 CONFIG: Replace with YOUR SHA-256 hash (https://emn178.github.io/online-tools/sha256.html)
    const HASHED_PASSWORD = "102bcf6065c621f0a55827fb0c2ee44d4acb97b1685928b25fcbe56ec17c83f4"; // ← CHANGE ME!

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

    // State
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
        }
    ];

    let isUnlocked = false;
    let deletedGoal = null; // For undo
    let deletedSubgoal = null; // For undo

    // SHA-256
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Save
    function saveGoals() {
        localStorage.setItem('motakeGoals', JSON.stringify(goals));
        updateProgress();
    }

    // Progress calc (main + subgoals)
    function calculateProgress() {
        let total = 0, completed = 0;
        goals.forEach(g => {
            total += 1; if (g.completed) completed += 1;
            g.subgoals.forEach(s => { total += 1; if (s.completed) completed += 1; });
        });
        return { percent: total ? Math.round((completed / total) * 100) : 0, completed, total };
    }

    function updateProgress() {
        const { percent, completed, total } = calculateProgress();
        progressFill.style.width = `${percent}%`;
        percentText.textContent = `${percent}%`;
        phaseText.textContent = completed === total ? "🎉 All done!" : `${completed} of ${total} tasks`;
        renderGoals();
    }

    // ===== UI Helpers (exposed globally) =====
    window.toggleSubgoals = (goalId) => {
        const el = document.getElementById(`subgoals-${goalId}`);
        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    };

    window.showSubgoalInput = (goalId) => {
        document.getElementById(`subgoal-input-${goalId}`)?.classList.add('visible');
    };
    window.hideSubgoalInput = (goalId) => {
        const el = document.getElementById(`subgoal-input-${goalId}`);
        if (el) { el.classList.remove('visible'); el.querySelector('.subgoal-input').value = ''; }
    };

    window.addSubgoal = (goalId) => {
        const input = document.querySelector(`#subgoal-input-${goalId} .subgoal-input`);
        const text = input.value.trim();
        if (text) {
            const goal = goals.find(g => g.id == goalId);
            if (goal) {
                goal.subgoals.push({ id: `sg_${Date.now()}`, text, completed: false });
                saveGoals();
                input.value = '';
                hideSubgoalInput(goalId);
            }
        }
    };

    // ===== Edit/Delete Logic =====
    function showToast(message, onUndo) {
        let toast = document.getElementById('undoToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'undoToast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `${message} <button onclick="undoDelete()">↩ Undo</button>`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 5000);
    }

    window.undoDelete = () => {
        if (deletedGoal) {
            goals.splice(deletedGoal.index, 0, deletedGoal.goal);
            deletedGoal = null;
        } else if (deletedSubgoal) {
            const goal = goals.find(g => g.id === deletedSubgoal.goalId);
            if (goal) {
                goal.subgoals.splice(deletedSubgoal.index, 0, deletedSubgoal.subgoal);
            }
            deletedSubgoal = null;
        }
        saveGoals();
        document.getElementById('undoToast')?.remove();
    };

    window.editGoal = (goalId) => {
        const goal = goals.find(g => g.id == goalId);
        if (!goal || !isUnlocked) return;

        const goalEl = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (!goalEl) return;

        const textSpan = goalEl.querySelector('.goal-text');
        const controls = goalEl.querySelector('.goal-controls');

        // Hide text & controls, show form
        textSpan.style.display = 'none';
        controls.style.display = 'none';

        const form = document.createElement('div');
        form.className = 'edit-form';
        form.innerHTML = `
            <input type="text" class="edit-input" value="${goal.text.replace(/"/g, '&quot;')}" required>
            <div class="edit-btns">
                <button type="button" class="save-btn">💾 Save</button>
                <button type="button" class="cancel-btn">✖ Cancel</button>
            </div>
        `;
        textSpan.parentNode.insertBefore(form, textSpan.nextSibling);

        const input = form.querySelector('.edit-input');
        input.focus();
        input.selectionStart = input.selectionEnd = input.value.length;

        form.querySelector('.save-btn').onclick = () => {
            const newText = input.value.trim();
            if (newText) {
                goal.text = newText;
                saveGoals();
            }
            cleanup();
        };

        form.querySelector('.cancel-btn').onclick = cleanup;

        function cleanup() {
            form.remove();
            textSpan.style.display = 'block';
            controls.style.display = 'flex';
            textSpan.textContent = goal.text;
        }
    };

    window.deleteGoal = (goalId) => {
        if (!confirm("Delete this goal and all its subgoals?")) return;
        const index = goals.findIndex(g => g.id == goalId);
        if (index !== -1) {
            deletedGoal = { goal: goals[index], index };
            goals.splice(index, 1);
            saveGoals();
            showToast("Goal deleted.", undoDelete);
        }
    };

    window.editSubgoal = (goalId, subId) => {
        const goal = goals.find(g => g.id == goalId);
        const sub = goal?.subgoals.find(s => s.id == subId);
        if (!sub || !isUnlocked) return;

        const subEl = document.querySelector(`[data-sub-id="${subId}"]`);
        if (!subEl) return;

        const textSpan = subEl.querySelector('.subgoal-text');
        const controls = subEl.querySelector('.subgoal-controls');

        textSpan.style.display = 'none';
        controls.style.display = 'none';

        const form = document.createElement('div');
        form.className = 'edit-form';
        form.innerHTML = `
            <input type="text" class="edit-input" value="${sub.text.replace(/"/g, '&quot;')}" required>
            <div class="edit-btns">
                <button type="button" class="save-btn">💾 Save</button>
                <button type="button" class="cancel-btn">✖ Cancel</button>
            </div>
        `;
        textSpan.parentNode.insertBefore(form, textSpan.nextSibling);

        const input = form.querySelector('.edit-input');
        input.focus();
        input.selectionStart = input.selectionEnd = input.value.length;

        form.querySelector('.save-btn').onclick = () => {
            const newText = input.value.trim();
            if (newText) {
                sub.text = newText;
                saveGoals();
            }
            cleanup();
        };

        form.querySelector('.cancel-btn').onclick = cleanup;

        function cleanup() {
            form.remove();
            textSpan.style.display = 'block';
            controls.style.display = 'flex';
            textSpan.textContent = sub.text;
        }
    };

    window.deleteSubgoal = (goalId, subId) => {
        if (!confirm("Delete this subgoal?")) return;
        const goal = goals.find(g => g.id == goalId);
        if (!goal) return;
        const index = goal.subgoals.findIndex(s => s.id == subId);
        if (index !== -1) {
            deletedSubgoal = { subgoal: goal.subgoals[index], goalId, index };
            goal.subgoals.splice(index, 1);
            saveGoals();
            showToast("Subgoal deleted.", undoDelete);
        }
    };

    // Drag & Drop for subgoals
    function makeSubgoalsSortable(goalId) {
        const container = document.getElementById(`subgoals-${goalId}`);
        if (!container) return;

        let draggedItem = null;

        container.querySelectorAll('.subgoal-item').forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', () => {
                draggedItem = item;
                setTimeout(() => item.classList.add('dragging'), 0);
            });
            item.addEventListener('dragend', () => {
                draggedItem = null;
                item.classList.remove('dragging');
            });

            item.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = getDragAfterElement(container, e.clientY);
                const currentItem = document.querySelector(`[data-sub-id="${item.dataset.subId}"]`);
                if (afterElement == null) {
                    container.appendChild(currentItem);
                } else {
                    container.insertBefore(currentItem, afterElement);
                }
                item.classList.add('over');
            });

            item.addEventListener('dragleave', () => item.classList.remove('over'));
            item.addEventListener('drop', () => {
                item.classList.remove('over');
                if (!draggedItem) return;
                const fromId = draggedItem.dataset.subId;
                const toId = item.dataset.subId;
                reorderSubgoals(goalId, fromId, toId);
            });
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.subgoal-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function reorderSubgoals(goalId, fromId, toId) {
        const goal = goals.find(g => g.id == goalId);
        if (!goal) return;
        const fromIndex = goal.subgoals.findIndex(s => s.id == fromId);
        const toIndex = goal.subgoals.findIndex(s => s.id == toId);
        if (fromIndex === -1 || toIndex === -1) return;

        const [moved] = goal.subgoals.splice(fromIndex, 1);
        goal.subgoals.splice(toIndex, 0, moved);
        saveGoals();
    }

    // ===== Render =====
    function renderGoals() {
        goalList.innerHTML = '';

        goals.forEach(goal => {
            const isMain = goal.isMain || false;
            const hasSubgoals = goal.subgoals.length > 0;

            const goalEl = document.createElement('div');
            goalEl.className = `goal-item ${isMain ? 'main' : ''} ${goal.completed ? 'completed' : ''}`;
            goalEl.dataset.goalId = goal.id;
            goalEl.innerHTML = `
                <div class="goal-header">
                    <input type="checkbox" class="goal-checkbox" data-id="${goal.id}" ${goal.completed ? 'checked' : ''} ${isUnlocked ? '' : 'disabled'}>
                    <span class="goal-text">${goal.text}</span>
                    ${isMain && goal.allowSubgoals && hasSubgoals ? 
                        `<button class="toggle-subgoals" onclick="toggleSubgoals('${goal.id}')">➖</button>` : ''}
                    ${isUnlocked ? `
                        <div class="goal-controls">
                            <button class="goal-action-btn edit-btn" title="Edit" onclick="editGoal('${goal.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="goal-action-btn delete-btn" title="Delete" onclick="deleteGoal('${goal.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                ${isMain && goal.allowSubgoals ? `
                    <div id="subgoals-${goal.id}" class="subgoals" style="display: block;">
                        ${goal.subgoals.map(sub => `
                            <div class="subgoal-item ${sub.completed ? 'completed' : ''}" 
                                 data-sub-id="${sub.id}" 
                                 draggable="${isUnlocked}">
                                <input type="checkbox" class="subgoal-checkbox" 
                                       data-parent="${goal.id}" data-id="${sub.id}" 
                                       ${sub.completed ? 'checked' : ''} ${isUnlocked ? '' : 'disabled'}>
                                <span class="subgoal-text">${sub.text}</span>
                                ${isUnlocked ? `
                                    <div class="subgoal-controls">
                                        <button class="subgoal-action-btn" title="Edit" 
                                                onclick="editSubgoal('${goal.id}', '${sub.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="subgoal-action-btn" title="Delete" 
                                                onclick="deleteSubgoal('${goal.id}', '${sub.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ` : ''}
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

            // Event listeners (if unlocked)
            if (isUnlocked) {
                goalEl.querySelector('.goal-checkbox')?.addEventListener('change', e => {
                    const g = goals.find(g => g.id == e.target.dataset.id);
                    if (g) { g.completed = e.target.checked; saveGoals(); }
                });

                goalEl.querySelectorAll('.subgoal-checkbox').forEach(cb => {
                    cb.addEventListener('change', e => {
                        const parentId = e.target.dataset.parent;
                        const subId = e.target.dataset.id;
                        const g = goals.find(g => g.id == parentId);
                        if (g) {
                            const sub = g.subgoals.find(s => s.id == subId);
                            if (sub) { sub.completed = e.target.checked; saveGoals(); }
                        }
                    });
                });

                // Enable drag & drop
                if (isMain && goal.allowSubgoals && goal.subgoals.length > 1) {
                    setTimeout(() => makeSubgoalsSortable(goal.id), 100);
                }
            }
        });
    }

    // ===== Admin Unlock =====
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
                error.textContent = "❌ Incorrect password.";
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (err) {
            console.error(err);
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
                text,
                completed: false,
                isMain,
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

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

// ========== GOAL TRACKER ==========
(() => {
    // DOM Elements
    const progressFill = document.getElementById('progressFill');
    const phaseText = document.getElementById('phaseText');
    const percentText = document.getElementById('percentText');
    const goalList = document.getElementById('goalList');
    const addGoalForm = document.getElementById('addGoalForm');
    const goalInput = document.getElementById('goalInput');

    // Load goals from localStorage or use defaults
    let goals = JSON.parse(localStorage.getItem('motakeGoals')) || [
        { id: Date.now(), text: "Complete BSc in IT", completed: false },
        { id: Date.now() + 1, text: "Build portfolio website", completed: true },
        { id: Date.now() + 2, text: "Learn React.js", completed: false },
        { id: Date.now() + 3, text: "Land internship", completed: false }
    ];

    // Save goals to localStorage
    function saveGoals() {
        localStorage.setItem('motakeGoals', JSON.stringify(goals));
        updateProgress();
    }

    // Calculate & update progress
    function updateProgress() {
        const total = goals.length;
        const completed = goals.filter(g => g.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        // Animate fill
        progressFill.style.width = `${percent}%`;
        percentText.textContent = `${percent}%`;

        // Update phase text
        if (completed === 0) {
            phaseText.textContent = "Just getting started!";
        } else if (completed === total) {
            phaseText.textContent = "🎉 All goals achieved!";
        } else {
            phaseText.textContent = `${completed} of ${total} goals completed`;
        }

        renderGoals();
    }

    // Render goal list
    function renderGoals() {
        goalList.innerHTML = '';
        goals.forEach(goal => {
            const item = document.createElement('div');
            item.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <input type="checkbox" class="goal-checkbox" data-id="${goal.id}" ${goal.completed ? 'checked' : ''}>
                <span class="goal-text">${goal.text}</span>
            `;
            goalList.appendChild(item);

            // Add event listener
            const checkbox = item.querySelector('.goal-checkbox');
            checkbox.addEventListener('change', () => {
                const goalToUpdate = goals.find(g => g.id == goal.id);
                if (goalToUpdate) {
                    goalToUpdate.completed = checkbox.checked;
                    saveGoals();
                }
            });
        });
    }

    // Add new goal
    addGoalForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = goalInput.value.trim();
        if (text) {
            const newGoal = {
                id: Date.now(),
                text: text,
                completed: false
            };
            goals.push(newGoal);
            saveGoals();
            goalInput.value = '';
            goalInput.focus();
        }
    });

    // Initialize
    updateProgress();
})();

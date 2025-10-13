// Demo clothing data with women's fashion examples
const demoTops = [
    {
        id: 1,
        url: 'clothing examples/tops/shopping.webp',
        name: 'Top 1'
    },
    {
        id: 2,
        url: 'clothing examples/tops/shopping (1).webp',
        name: 'Top 2'
    },
    {
        id: 3,
        url: 'clothing examples/tops/shopping (2).webp',
        name: 'Top 3'
    },
    {
        id: 4,
        url: 'clothing examples/tops/shopping (3).webp',
        name: 'Top 4'
    },
    {
        id: 5,
        url: 'clothing examples/tops/shopping (4).webp',
        name: 'Top 5'
    }
];

const demoBottoms = [
    {
        id: 1,
        url: 'clothing examples/bottoms/images.jpeg',
        name: 'Bottom 1'
    },
    {
        id: 2,
        url: 'clothing examples/bottoms/images (1).jpeg',
        name: 'Bottom 2'
    },
    {
        id: 3,
        url: 'clothing examples/bottoms/images (2).jpeg',
        name: 'Bottom 3'
    },
    {
        id: 4,
        url: 'clothing examples/bottoms/images (3).jpeg',
        name: 'Bottom 4'
    },
    {
        id: 5,
        url: 'clothing examples/bottoms/images (4).jpeg',
        name: 'Bottom 5'
    }
];

let userTops = [];
let userBottoms = [];
let currentTopIndex = 0;
let currentBottomIndex = 0;

// Initialize demo
function initDemo() {
    loadClothingCarousel('tops', demoTops);
    loadClothingCarousel('bottoms', demoBottoms);
}

// Load clothing items into carousel
function loadClothingCarousel(type, items) {
    const carousel = document.getElementById(type === 'tops' ? 'topsCarousel' : 'bottomsCarousel');
    carousel.innerHTML = '';
    
    items.forEach((item, index) => {
        const clothingDiv = document.createElement('div');
        clothingDiv.className = 'clothing-item';
        clothingDiv.innerHTML = `
            <img src="${item.url}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGNUY1RjUiLz48dGV4dCB4PSIxNTAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4ke2l0ZW0ubmFtZX08L3RleHQ+PC9zdmc+Jz==">
            <div style="position: absolute; bottom: 10px; left: 10px; right: 10px; background: rgba(255,255,255,0.9); padding: 5px; border-radius: 5px; font-size: 0.8rem; text-align: center;">${item.name}</div>
        `;
        carousel.appendChild(clothingDiv);
    });
}

// Handle image upload
function handleImageUpload(input, type) {
    const files = input.files;
    const targetArray = type === 'tops' ? userTops : userBottoms;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const newItem = {
                id: Date.now() + i,
                url: e.target.result,
                name: file.name.replace(/\.[^/.]+$/, "")
            };
            targetArray.push(newItem);
            
            // Reload carousel with combined demo + user items
            const allItems = type === 'tops' ? 
                [...demoTops, ...userTops] : 
                [...demoBottoms, ...userBottoms];
            loadClothingCarousel(type, allItems);
        };
        
        reader.readAsDataURL(file);
    }
}

// Change slide in carousel
function changeSlide(type, direction) {
    const carousel = document.getElementById(type === 'tops' ? 'topsCarousel' : 'bottomsCarousel');
    const items = carousel.children;
    
    if (items.length === 0) return;
    
    if (type === 'tops') {
        currentTopIndex = (currentTopIndex + direction + items.length) % items.length;
        carousel.style.transform = `translateX(-${currentTopIndex * 100}%)`;
    } else {
        currentBottomIndex = (currentBottomIndex + direction + items.length) % items.length;
        carousel.style.transform = `translateX(-${currentBottomIndex * 100}%)`;
    }
}

// Save current outfit combination
function saveOutfit() {
    const topName = getCurrentItemName('tops');
    const bottomName = getCurrentItemName('bottoms');
    
    alert(`Outfit Saved! 📸\n\nTop: ${topName}\nBottom: ${bottomName}\n\nThis combination has been added to your favorites!`);
}

// Get current item name for display
function getCurrentItemName(type) {
    const allTops = [...demoTops, ...userTops];
    const allBottoms = [...demoBottoms, ...userBottoms];
    
    if (type === 'tops') {
        return allTops[currentTopIndex]?.name || 'Unknown Top';
    } else {
        return allBottoms[currentBottomIndex]?.name || 'Unknown Bottom';
    }
}

// Random outfit combination
function randomMatch() {
    const topsCarousel = document.getElementById('topsCarousel');
    const bottomsCarousel = document.getElementById('bottomsCarousel');
    
    const topItems = topsCarousel.children.length;
    const bottomItems = bottomsCarousel.children.length;
    
    if (topItems > 0) {
        currentTopIndex = Math.floor(Math.random() * topItems);
        topsCarousel.style.transform = `translateX(-${currentTopIndex * 100}%)`;
    }
    
    if (bottomItems > 0) {
        currentBottomIndex = Math.floor(Math.random() * bottomItems);
        bottomsCarousel.style.transform = `translateX(-${currentBottomIndex * 100}%)`;
    }

    // Show random match notification
    setTimeout(() => {
        const topName = getCurrentItemName('tops');
        const bottomName = getCurrentItemName('bottoms');
        alert(`🎲 Random Match!\n\n${topName} + ${bottomName}\n\nHow does this combination look?`);
    }, 500);
}

// Add more clothing prompt
function addMoreClothing() {
    alert('💡 Tip: Click the upload areas above to add more tops and bottoms from your wardrobe!\n\nYou can upload multiple images at once to expand your virtual closet.');
}

// Drag and drop functionality
function setupDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.upload-area');
    
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.style.background = '#e8e8e8';
        });
        
        area.addEventListener('dragleave', (e) => {
            e.preventDefault();
            area.style.background = '#fafafa';
        });
        
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.style.background = '#fafafa';
            
            const files = e.dataTransfer.files;
            const input = area.querySelector('input[type="file"]');
            input.files = files;
            
            const type = area.querySelector('h3').textContent.includes('Tops') ? 'tops' : 'bottoms';
            handleImageUpload(input, type);
        });
    });
}

// Initialize the demo when page loads
document.addEventListener('DOMContentLoaded', function() {
    initDemo();
    setupDragAndDrop();
});

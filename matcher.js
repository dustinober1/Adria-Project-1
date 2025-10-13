// Demo clothing data with women's fashion examples
const demoTops = [
    {
        id: 1,
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=300&h=400&fit=crop&crop=top',
        name: 'White Button Blouse'
    },
    {
        id: 2,
        url: 'https://images.unsplash.com/photo-1571445992736-26b95c77b515?w=300&h=400&fit=crop&crop=center',
        name: 'Black Turtleneck'
    },
    {
        id: 3,
        url: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=300&h=400&fit=crop&crop=center',
        name: 'Striped Long Sleeve'
    },
    {
        id: 4,
        url: 'https://images.unsplash.com/photo-1582142306909-195724d33567?w=300&h=400&fit=crop&crop=center',
        name: 'Cream Sweater'
    },
    {
        id: 5,
        url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=400&fit=crop&crop=center',
        name: 'Pink Silk Blouse'
    }
];

const demoBottoms = [
    {
        id: 1,
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop&crop=center',
        name: 'High Waist Jeans'
    },
    {
        id: 2,
        url: 'https://images.unsplash.com/photo-1506629905877-dee2de9c8f8c?w=300&h=400&fit=crop&crop=center',
        name: 'Black Pencil Skirt'
    },
    {
        id: 3,
        url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&h=400&fit=crop&crop=center',
        name: 'Wide Leg Trousers'
    },
    {
        id: 4,
        url: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=300&h=400&fit=crop&crop=center',
        name: 'Pleated Midi Skirt'
    },
    {
        id: 5,
        url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=400&fit=crop&crop=center',
        name: 'Denim Shorts'
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

// User-uploaded clothing data only - no default demo images
const userTops = [];
const userBottoms = [];
let currentTopIndex = 0;
let currentBottomIndex = 0;

// Initialize matcher (starts empty, waits for user uploads)
function initDemo() {
    loadClothingCarousel('tops', userTops);
    loadClothingCarousel('bottoms', userBottoms);
}

// Load clothing items into carousel
function loadClothingCarousel(type, items) {
    const carousel = document.getElementById(type === 'tops' ? 'topsCarousel' : 'bottomsCarousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    
    items.forEach((item, index) => {
        const clothingDiv = document.createElement('div');
        clothingDiv.className = 'clothing-item';
        clothingDiv.innerHTML = `
            <img src="${item.url}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGNUY1RjUiLz48dGV4dCB4PSIxNTAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4ke2l0ZW0ubmFtZX08L3RleHQ+PC9zdmc+Jw==">`;
        carousel.appendChild(clothingDiv);
    });
}

// Handle image upload
function handleImageUpload(input, type) {
    if (!input) return;
    processUploadedFiles(input.files, type);
    // Reset the file input so the same file can be uploaded again if needed
    input.value = '';
}

// Shared file processing for click-to-upload and drag-and-drop
function processUploadedFiles(files, type) {
    if (!files || files.length === 0) return;
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
            if (type === 'tops') {
                currentTopIndex = targetArray.length - 1;
            } else {
                currentBottomIndex = targetArray.length - 1;
            }

            loadClothingCarousel(type, targetArray);
            updateCarouselPosition(type);
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

// Ensure carousel shows the active item after uploads or randomization
function updateCarouselPosition(type) {
    const carousel = document.getElementById(type === 'tops' ? 'topsCarousel' : 'bottomsCarousel');
    if (!carousel) return;

    if (type === 'tops') {
        carousel.style.transform = `translateX(-${currentTopIndex * 100}%)`;
    } else {
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
    if (type === 'tops') {
        return userTops[currentTopIndex]?.name || 'Unknown Top';
    } else {
        return userBottoms[currentBottomIndex]?.name || 'Unknown Bottom';
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
            const type = area.querySelector('h3').textContent.includes('Tops') ? 'tops' : 'bottoms';
            processUploadedFiles(files, type);
        });
    });
}

// Initialize the demo when page loads
document.addEventListener('DOMContentLoaded', function() {
    initDemo();
    setupDragAndDrop();
});

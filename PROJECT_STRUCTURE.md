# Adria Style Studio - Project Structure

## File Organization

The project has been reorganized into separate pages with modular CSS and JavaScript files:

### HTML Files

1. **index.html** - Redirect page
   - Automatically redirects visitors to `landing.html`
   - Provides a fallback link if redirect doesn't work

2. **landing.html** - Main landing/splash page
   - Contact form for inquiries
   - Features and services overview
   - Calendar booking button
   - Link to demo page
   - Uses: `landing.css` and `landing.js`

3. **matcher.html** - Interactive outfit matcher demo
   - Upload functionality for tops and bottoms
   - Carousel to browse clothing items
   - Mix and match interface
   - Demo with 5 sample tops and 5 sample bottoms
   - Uses: `styles.css` and `matcher.js`

### CSS Files

1. **landing.css** - Styles for landing page
   - Hero section with gradient background
   - Form styling
   - Features grid
   - Responsive design

2. **styles.css** - Styles for matcher demo page
   - Upload areas with drag & drop styling
   - Carousel controls
   - Outfit container grid
   - Button styles
   - Responsive layout

### JavaScript Files

1. **landing.js** - Landing page functionality
   - Contact form submission handler
   - Calendar booking integration
   - Success message display

2. **matcher.js** - Outfit matcher functionality
   - Demo clothing data (10 items total)
   - Image upload handling
   - Carousel navigation
   - Random outfit generator
   - Save outfit feature
   - Drag and drop support

### Image Assets

1. **clothing examples/tops/** - Demo top clothing images
   - 5 webp images (shopping.webp through shopping (4).webp)

2. **clothing examples/bottoms/** - Demo bottom clothing images
   - 5 jpeg images (images.jpeg through images (4).jpeg)

## Features

### Landing Page (landing.html)
- ✨ Professional splash page with Adria's branding
- 📝 Contact form with validation
- 📅 Calendar booking integration
- 🎨 Elegant gradient design
- 📱 Fully responsive
- 🔗 Link to interactive demo

### Outfit Matcher Demo (matcher.html)
- 👚 Upload tops (multiple images supported)
- 👖 Upload bottoms (multiple images supported)
- 🔄 Carousel navigation with arrows
- 🎲 Random outfit generator
- 💾 Save favorite combinations
- 📸 Pre-loaded with 10 demo items (women's clothing)
- 🖱️ Drag & drop file upload
- 📱 Mobile-friendly responsive design

## Demo Clothing Items

### Tops (5 items):
- Top 1 (shopping.webp)
- Top 2 (shopping (1).webp)
- Top 3 (shopping (2).webp)
- Top 4 (shopping (3).webp)
- Top 5 (shopping (4).webp)

### Bottoms (5 items):
- Bottom 1 (images.jpeg)
- Bottom 2 (images (1).jpeg)
- Bottom 3 (images (2).jpeg)
- Bottom 4 (images (3).jpeg)
- Bottom 5 (images (4).jpeg)

All demo images are stored locally in the `clothing examples/` folder and feature actual women's clothing items.

## Navigation

- Landing page has a link to the demo at the bottom of the contact form
- Demo page has a "Back to Home" button in the top-right corner
- index.html automatically redirects to landing.html

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Uses CSS Grid and Flexbox
- FileReader API for image uploads
- Drag & Drop API support

## Future Enhancements

Potential additions for the full version:
- Backend integration for form submissions
- Database to store saved outfits
- AI-powered outfit recommendations
- User accounts and wardrobe management
- Social sharing features
- Shopping integration
- Color coordination suggestions
- Seasonal outfit recommendations

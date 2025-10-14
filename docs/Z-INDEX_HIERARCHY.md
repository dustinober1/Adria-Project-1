# Z-Index Hierarchy Documentation

## Overview
This document outlines the z-index values used across the Adria Style Studio website to prevent visual stacking conflicts.

## Z-Index Levels

### Level 1: Page Content (z-index: 1)
- **Location**: `css/landing.css` - `.container`
- **Purpose**: Main content area on landing page
- **Elements**: Hero section content

### Level 2: Carousel Controls (z-index: 10)
- **Location**: `css/styles.css` - `.carousel-controls`
- **Purpose**: Previous/Next buttons on outfit matcher carousel
- **Elements**: Arrow buttons for navigating clothing items

### Level 3: Navigation Elements (z-index: 999)
- **Location**: `css/styles.css` - `.nav-link`
- **Purpose**: "Back to Home" button on matcher.html
- **Position**: Fixed to top-left (20px, 20px)
- **Note**: Moved to left side to avoid conflict with user info

### Level 4: Top Navigation Bar (z-index: 1000)
- **Location**: `index.html` - `.nav-bar`
- **Purpose**: Login/Register buttons on homepage
- **Position**: Fixed to top-right
- **Elements**: Authentication navigation

### Level 5: User Info Panel (z-index: 1001)
- **Location**: `matcher.html` - `.user-info`
- **Purpose**: Logged-in user information and logout button
- **Position**: Fixed to top-right (1rem, 1rem)
- **Elements**: Username display and logout button
- **Note**: Highest z-index to ensure always visible

## Pages and Their Z-Index Usage

### index.html (Landing Page)
- Navigation bar: z-index 1000
- Container content: z-index 1
- No conflicts expected

### matcher.html (Outfit Matcher)
- User info panel: z-index 1001 (top-right)
- Back to Home button: z-index 999 (top-left)
- Carousel controls: z-index 10
- **Fix Applied**: User info raised to 1001, back button moved to left

### blog.html
- Back to Home link: No fixed positioning, no z-index needed
- Regular flow element

### login.html & register.html
- Back to Home links: Inside content flow, no z-index needed
- No fixed positioning elements

## Best Practices

1. **Avoid Arbitrary High Values**: Don't use z-index values like 9999 unless absolutely necessary
2. **Maintain Clear Hierarchy**: Each layer should have a distinct purpose
3. **Document Changes**: Update this file when adding new z-index values
4. **Test Responsively**: Check all breakpoints to ensure no overlapping occurs

## Recent Fixes (October 2025)

### Issue: Back to Home Button Covering User Info
- **Problem**: Both elements had z-index 1000 and were positioned in top-right corner
- **Solution**: 
  - Moved "Back to Home" button to top-left
  - Increased User Info z-index to 1001
  - Decreased "Back to Home" z-index to 999
- **Files Modified**:
  - `css/styles.css` - Updated `.nav-link` positioning and z-index
  - `matcher.html` - Updated `.user-info` z-index

## Mobile Considerations

On mobile devices (max-width: 768px):
- Fixed positioned elements should have adequate spacing
- Touch targets should not overlap
- Currently no mobile-specific z-index overrides needed

## Future Recommendations

If adding new overlays or fixed elements:
- **Modals/Dialogs**: Use z-index 2000+
- **Notifications/Toasts**: Use z-index 1500-1999
- **Dropdowns**: Use z-index 1100-1499
- **Tooltips**: Use z-index 1050-1099

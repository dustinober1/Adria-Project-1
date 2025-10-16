# Customer Management System Documentation

## Overview

The Customer Management System allows Adria (the site owner) to:
- Classify customers into **Free** or **Paid** tiers
- Rank prospects with color-coded status indicators
- Add personal notes for each customer
- Manage persistent image storage based on customer tier

## Features

### 1. Customer Tier System

**Two tier levels:**
- **Free Tier** 📝
  - Images stored in browser session only (localStorage)
  - Wardrobe cleared when user logs out
  - No server-side storage

- **Paid Tier** 💎
  - Images saved to server permanently
  - Wardrobe persists across login sessions
  - Unlimited image storage
  - Automatic loading on page refresh

### 2. Prospect Ranking (Status System)

Use this to categorize and track prospects:

- **🟢 Green Prospect** - Hot lead, likely to convert
- **🟡 Yellow Prospect** - Warm lead, potential conversion
- **🔴 Red Prospect** - Cold lead, low priority
- **🟢 Active Customer** - Current paying customer

### 3. Admin Notes

Add private notes for each customer to track:
- Previous consultations
- Style preferences
- Contact history
- Special requests
- Follow-up reminders

---

## Admin Dashboard Usage

### Access Admin Panel

1. Navigate to `/admin.html`
2. Log in with your admin account
3. Click **"Users"** in the sidebar

### Managing Customers

#### View Customer Details
1. Find the customer in the Users table
2. Click the **"View"** button

#### Update Customer Tier
1. Open customer details
2. In the **"Customer Tier"** dropdown, select:
   - `Free` - For free tier users
   - `Paid` - For paying customers
3. Images will persist after tier change

#### Set Prospect Status
1. Open customer details
2. In the **"Prospect Status"** dropdown, select one:
   - 🟢 **Active Customer** - Current paying customer
   - 🟢 **Green Prospect** - Hot lead
   - 🟡 **Yellow Prospect** - Warm lead
   - 🔴 **Red Prospect** - Cold lead

#### Add/Edit Admin Notes
1. Open customer details
2. In the **"Admin Notes"** text area, enter your notes
3. Examples:
   - "Prefers classic style, interested in seasonal wardrobe"
   - "Follow up after discount expires"
   - "Referred by Jane Doe"

#### Save Changes
1. After making updates, click **"Save Changes"**
2. Confirmation message will appear
3. User list updates automatically

---

## User Experience

### For Free Tier Users

When a free tier user visits the matcher:
- ✅ Can upload images (20-50 items recommended)
- ✅ Mix and match during their session
- ✅ Save outfit combinations
- ❌ Wardrobe NOT saved after logout
- ℹ️ Badge shows: "📝 Free - Unsaved (Session Only)"

On page refresh or logout:
- Wardrobe is cleared from browser
- User sees message about upgrading to paid tier

### For Paid Tier Users

When a paid tier user visits the matcher:
- ✅ Can upload unlimited images
- ✅ Wardrobe automatically saved
- ✅ Images persist across sessions
- ✅ Automatic loading on next login
- ℹ️ Badge shows: "💎 Paid - Wardrobe Saved"

On page refresh or logout:
- **All images are retained**
- Wardrobe automatically loads on next login
- User can continue from where they left off

---

## Technical Details

### Database Schema Updates

**User CSV now includes:**
```
id, email, password_hash, first_name, last_name, is_admin, 
customer_tier, customer_status, admin_notes, created_at, last_login
```

### API Endpoints

#### Customer Management (Admin Only)
```
PUT /api/admin/users/:id/tier
  Body: { tier: "free" | "paid" }
  
PUT /api/admin/users/:id/status
  Body: { status: "active_customer" | "green" | "yellow" | "red" }
  
PUT /api/admin/users/:id/notes
  Body: { notes: "string" }
```

#### Wardrobe Management (Authenticated)
```
GET /api/wardrobe/wardrobe
  Response: { tops: [...], bottoms: [...], tier: "free" | "paid" }

POST /api/wardrobe/wardrobe/save
  Body: { 
    type: "tops" | "bottoms",
    items: [{ name: "string", data: "base64_image" }]
  }

DELETE /api/wardrobe/:type/:filename
  Deletes individual item

DELETE /api/wardrobe/:type
  Clears all items of that type

GET /api/wardrobe/image/:userId/:type/:filename
  Retrieves saved image
```

### File Storage

Wardrobe images are stored at:
```
/data/wardrobes/
  └── {userId}/
      ├── tops/
      │   ├── clothing_item_1_timestamp.jpg
      │   └── clothing_item_2_timestamp.jpg
      └── bottoms/
          ├── pants_item_1_timestamp.jpg
          └── skirt_item_2_timestamp.jpg
```

---

## User Interface Elements

### Admin Panel - Users Table

Columns now include:
- **Email** - User email address
- **Name** - First and last name
- **Tier** 💎/📝 - Customer tier indicator
- **Status** 🟢🟡🔴 - Prospect ranking with emoji
- **Admin** - Admin status
- **Joined** - Registration date
- **Actions** - View button

### User Details Modal

New fields:
- **Customer Tier** - Dropdown to set free/paid
- **Prospect Status** - Dropdown for 4 prospect levels
- **Admin Notes** - Text area for private notes
- **Save Changes** - Button to persist changes

### Matcher Page

New elements:
- **Tier Badge** - Shows current user tier
- **Info Button** - Explains tier system to user
- **Wardrobe Persistence** - Automatic based on tier

---

## Best Practices

### Managing Prospects

1. **Initial Contact (Green)**
   - Set status to "Green Prospect"
   - Add notes about their style interests
   - Note: "First consultation - interested in seasonal update"

2. **Follow-up (Yellow)**
   - Change status to "Yellow Prospect" after contact
   - Add follow-up date in notes
   - Note: "Sent style guide - awaiting feedback"

3. **No Response (Red)**
   - Change status to "Red Prospect" if unresponsive
   - Add date when to revisit
   - Note: "No response for 30 days - revisit next quarter"

4. **Conversion (Active Customer)**
   - Change status to "Active Customer"
   - Set tier to "Paid"
   - Update notes with service details
   - Note: "Paid package starting 10/15 - seasonal wardrobe"

### Tier Management

**Upgrade to Paid:**
1. After customer makes first purchase
2. Set tier to "Paid"
3. Images now save permanently
4. Add note: "Upgraded to paid - activation date: [date]"

**Downgrade to Free:**
1. If customer subscription expires
2. Set tier to "Free"
3. Existing images remain saved
4. New images will be session-only
5. Add note: "Downgraded from paid on [date]"

---

## Troubleshooting

### Images Not Saving

**Free Tier User:**
- ✓ Expected behavior
- Images clear after logout
- User needs to upgrade

**Paid Tier User:**
- Check browser console for errors
- Verify user tier is "Paid" in admin panel
- Verify wardrobe directory permissions: `/data/wardrobes/`

### User Can't See Saved Images

1. Verify user tier is "Paid" in admin
2. Refresh the page
3. Check browser network tab for 404 errors
4. Verify image files exist in `/data/wardrobes/{userId}/`

### Admin Notes Not Saving

1. Click "Save Changes" button (required)
2. Check for confirmation message
3. Verify admin permissions
4. Try refreshing admin page

---

## Future Enhancements

Potential features to add:
- 📁 Shared wardrobes between users
- 🏷️ Clothing item tags/categories
- 📊 Usage analytics per customer
- 💳 Automatic tier upgrades via payment
- 📧 Email notifications for status changes
- 🎯 Customer segmentation reports
- 📱 Mobile app for admin management

---

## Summary

This system gives you complete control over customer tiers and image persistence:

| Feature | Free | Paid |
|---------|------|------|
| Image uploads | ✅ | ✅ |
| Mix & match | ✅ | ✅ |
| Session storage | ✅ | ✅ |
| Persistent storage | ❌ | ✅ |
| Across-session access | ❌ | ✅ |
| Unlimited items | ❌ | ✅ |
| Cross-device sync | ❌ | ✅ |

Track prospects with color-coded status and personal notes for better follow-up strategy!

# Quick Reference: Admin Customer Management

## 🎯 Quick Start

1. **Go to Admin Panel** → `/admin.html`
2. **Click "Users"** tab
3. **Click "View"** on any user
4. **Edit fields:**
   - 💎 **Tier** → Select "Free" or "Paid"
   - 📊 **Status** → Select prospect ranking
   - 📝 **Notes** → Add your notes
5. **Click "Save Changes"**

---

## 👥 Customer Tiers

### Free Tier (📝)
```
User can upload images
Images cleared after logout
For: Trial users, free consultations
```

### Paid Tier (💎)
```
User uploads images
Images saved permanently to server
Auto-loaded on next login
For: Paying customers
```

**Change tier when:**
- User makes first payment → "Paid"
- Subscription expires → "Free"
- Downgrading service → "Free"

---

## 📊 Prospect Status

### 🟢 Green Prospect
**Best leads - highest priority**
- Show strong interest
- High conversion probability
- Action: Schedule followup

### 🟡 Yellow Prospect
**Warm leads - medium priority**
- Showed interest but hesitant
- Possible future conversion
- Action: Send info/discount

### 🔴 Red Prospect
**Cold leads - low priority**
- No response or low interest
- May convert later
- Action: Revisit quarterly

### 🟢 Active Customer
**Current paying customers**
- Already purchased
- Retention focus
- Action: Provide premium support

---

## 📝 Admin Notes Examples

### Initial Contact
```
"First consultation 10/15 - interested in seasonal wardrobe"
```

### Prospect Tracking
```
"Hot lead! Prefers classic style. Follow up with summer collection."
```

### Customer Service
```
"Paid member since 10/1. Prefers video consultations. TZ: PST"
```

### Follow-up Reminders
```
"Yellow prospect - revisit 11/1 with fall discount offer"
```

### Conversion History
```
"Converted from free → paid on 10/15. Referred by Jane Doe."
```

---

## 📋 Status Workflow Example

```
DAY 1: New user signs up
├─ Tier: Free
├─ Status: Green Prospect
└─ Notes: "First contact - style assessment pending"

DAY 3: User engaged, interest shown
├─ Status: Green Prospect ✓
└─ Notes: "Very interested - sent style guide"

DAY 7: User ready to purchase
├─ Tier: Free → Paid ✓
├─ Status: Green → Active Customer ✓
└─ Notes: "Converted! First paid session 10/22"

ONGOING:
├─ Tier: Paid ✓
├─ Status: Active Customer ✓
└─ Notes: "Regular client - seasonal updates"
```

---

## ⚙️ Common Tasks

### Upgrade User to Paid
```
1. Open user details
2. Change Tier: Free → Paid
3. Change Status: Green → Active Customer
4. Add note: "Upgraded to paid on [date]"
5. Save Changes
```

### Track a Prospect
```
1. Open user details
2. Set Status: Green/Yellow/Red
3. Add note: "Next follow-up: [date]"
4. Save Changes
5. Review weekly/monthly
```

### Add Service Notes
```
1. Open user details
2. In Notes field, add details:
   - Preferred communication style
   - Style preferences
   - Budget range
   - Previous services
3. Save Changes
```

### Delete User
```
1. Open user details
2. Click red "Delete User" button
3. Confirm deletion (irreversible!)
4. User removed from system
```

---

## 💡 Tips

✅ **DO:**
- Update status regularly
- Add notes for each interaction
- Keep notes specific and actionable
- Review prospects monthly
- Upgrade users as they convert

❌ **DON'T:**
- Leave notes empty
- Forget to upgrade tier on purchase
- Confuse tier with status
- Delete active customers by accident

---

## 🎯 Prospect Conversion Funnel

```
┌─────────────────┐
│ New Signup      │
│ Status: Green   │
│ Tier: Free      │
└────────┬────────┘
         │
         ├─→ No Interest      Status: Red   (revisit later)
         │   (auto-reply)
         │
         ├─→ Shows Interest   Status: Green (send proposal)
         │   
         └─→ Ready to Buy     Tier: Paid   Status: Active
                             (send invoice)
```

---

## 📞 User Support Integration

Use notes to track:
- **Issue date:** "Support ticket 10/15"
- **Resolution:** "Fixed wardrobe sync issue"
- **Preferences:** "Prefers email contact"
- **Timezone:** "TZ: EST"
- **VIP status:** "Frequent buyer - priority support"

---

## 📊 Reporting Example

```
MONTHLY PROSPECT REPORT

Green Prospects (🟢): 8
├─ Sarah C. (2 days, ready to purchase)
├─ John D. (5 days, asking questions)
└─ ... (6 more)

Yellow Prospects (🟡): 12
├─ Lisa M. (2 weeks, follow-up needed)
├─ Mike T. (1 month, send discount)
└─ ... (10 more)

Red Prospects (🔴): 24
└─ [Revisit next quarter]

Active Customers (🟢): 6
└─ [Ongoing support & retention]
```

---

## 🔐 Important

- ⚠️ Only admins can manage customer data
- 🔒 Notes are private (admins only)
- 💾 Changes save immediately
- 📊 Free tier images clear on logout
- 💎 Paid tier images persist on server

---

**Last Updated:** October 15, 2025
**For detailed documentation:** See `CUSTOMER_MANAGEMENT.md`

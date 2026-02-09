# Water Station System - Feature Specification

## Overview

A **marketplace platform** connecting water station businesses with customers. Water business owners can register, promote their services, and manage deliveries. Customers can discover nearby stations, compare prices, and order water with features like loyalty programs and bulk ordering.

---

## System Architecture

### Multi-Tenant Structure

```
Platform (SaaS)
  └── Water Station (Tenant/Business)
        ├── Admin/Staff
        ├── Delivery Personnel
        └── Customers
```

### User Roles

| Role | Description |
|------|-------------|
| **Super Admin** | Platform owner, manages all stations |
| **Station Owner** | Water business owner, full control of their station |
| **Station Staff** | Limited admin access (orders, inventory) |
| **Delivery Personnel** | Mobile app access for deliveries |
| **Customer** | Orders water, tracks deliveries |

---

## Module 1: Public Pages & Business Registration

### Public Landing Page
- Platform introduction and benefits
- How it works (for customers and business owners)
- Pricing plans for water station owners
- Testimonials/success stories
- Contact and support

### Water Station Owner Application

**Application Form:**
- Business name
- Owner name and contact info
- Business address
- Business permit/registration number
- Type of water services offered
- Service area coverage
- Expected monthly orders
- How did you hear about us?

**Application Flow:**
```
1. Owner fills application form
2. Uploads business documents (permit, DTI, etc.)
3. Application status: Pending Review
4. Super Admin reviews and approves/rejects
5. If approved: Owner receives credentials
6. Owner completes station setup (services, zones, etc.)
7. Station goes live
```

**Station Subscription Plans (Optional):**
| Plan | Features |
|------|----------|
| Basic | Up to 100 customers, 1 staff account |
| Pro | Up to 500 customers, 5 staff accounts, analytics |
| Enterprise | Unlimited, API access, custom branding |

---

## Module 2: Service/Product Management

### Water Products
- **Container Sizes:** 5 gallon, 10 gallon, slim bottle, etc.
- **Water Types:** Purified, mineral, alkaline, distilled
- **Pricing:** Per container, subscription rate, bulk rate
- **Stock Management:** Track inventory levels

### Additional Products
- Water dispensers (hot/cold)
- Manual pumps
- Bottle caps
- Cleaning services for dispensers

### Service Configuration
```
Product Fields:
- Name
- Description
- SKU/Code
- Category (water, equipment, accessory)
- Price (regular)
- Price (subscription)
- Price (bulk - with quantity tiers)
- Container deposit amount (if applicable)
- Stock quantity
- Low stock threshold
- Is active
- Image
```

---

## Module 3: Location & Mapping

### Service Area Hierarchy

```
Service Area (City/Region)
  └── Zone (Barangay/District)
        └── Location Type
              ├── Subdivision
              │     └── Blocks/Phases → Lots/Houses
              ├── Condominium
              │     └── Towers/Buildings → Floors → Units
              └── Commercial Area
                    └── Buildings → Offices
```

### Zone Management

**Zone Fields:**
- Zone name
- Parent area
- Polygon coordinates (map boundary)
- Delivery fee
- Minimum order amount
- Estimated delivery time
- Available delivery days
- Is active

### Subdivision Management

**Subdivision Fields:**
- Name
- Zone (FK)
- Address
- Coordinates (lat/lng for map pin)
- Entry points (main gate, back gate)
- Access type (open, guarded, strict)
- Access instructions
- Guard contact number
- HOA contact (optional)
- Delivery schedule restrictions
- Special notes

**Subdivision Units:**
- Phases/Blocks/Streets
- Lot numbers within each block

### Condominium Management

**Condominium Fields:**
- Name
- Zone (FK)
- Address
- Coordinates
- Number of towers/buildings
- Lobby contact number
- Reception hours
- Parking/loading instructions
- Elevator access notes
- Delivery schedule restrictions

**Condominium Units:**
- Tower/Building name
- Floor count
- Unit format (e.g., "Unit 8A", "Room 801")

### Customer Address

**Address Fields:**
- Address type (house, subdivision, condo, commercial)
- Zone (FK)
- Location (FK) - subdivision/condo if applicable
- Location unit (FK) - block/tower if applicable
- Street address / Unit number
- Floor (for condos)
- Landmarks
- Delivery instructions
- Coordinates (optional, for pin drop)
- Is default address

---

## Module 4: Order Management

### Order Types

| Type | Description |
|------|-------------|
| **One-Time** | Single delivery order |
| **Subscription** | Recurring auto-order |
| **Bulk Order** | Large quantity with discount |

### Order Flow

```
1. Customer places order
2. Status: Pending
3. Station confirms order
4. Status: Confirmed
5. Assigned to delivery personnel
6. Status: Out for Delivery
7. Delivered and confirmed
8. Status: Completed
9. Customer can rate/review
```

### Order Statuses

- `pending` - Awaiting confirmation
- `confirmed` - Accepted by station
- `preparing` - Being prepared
- `out_for_delivery` - With delivery personnel
- `delivered` - Completed successfully
- `cancelled` - Cancelled by customer or station
- `failed` - Delivery failed (reschedule)

### Order Fields

```
Order:
- Order number (auto-generated)
- Customer (FK)
- Station (FK)
- Order type (one-time, subscription, bulk)
- Delivery address (FK)
- Delivery date
- Delivery time slot
- Items (order_items relation)
- Subtotal
- Delivery fee
- Discount amount
- Loyalty discount
- Total amount
- Payment method
- Payment status
- Order status
- Assigned driver (FK)
- Notes
- Rated (boolean)
- Rating (1-5)
- Review text
```

### Delivery Time Slots

- Admin defines available time slots per zone
- Example: 8AM-10AM, 10AM-12PM, 1PM-3PM, 3PM-5PM
- Capacity limit per slot (max deliveries)

---

## Module 5: Bulk Orders

### Bulk Order Features

**Quantity-Based Pricing Tiers:**
```
Example for 5-gallon purified water (Base price: ₱40):
- 1-9 containers: ₱40 each
- 10-19 containers: ₱38 each (5% off)
- 20-49 containers: ₱36 each (10% off)
- 50+ containers: ₱34 each (15% off)
```

**Bulk Order Fields:**
- Minimum quantity for bulk pricing
- Pricing tiers (quantity ranges and prices)
- Advance notice required (days)
- Bulk delivery schedule (specific days only)

**Bulk Customer Types:**
- Offices
- Restaurants
- Schools
- Events/Catering
- Retail resellers

**Bulk Order Workflow:**
```
1. Customer requests bulk quote
2. Station reviews and sends quotation
3. Customer accepts quote
4. Order confirmed with delivery schedule
5. Recurring bulk orders (optional)
```

---

## Module 6: Subscription Orders

### Subscription Features

**Frequency Options:**
- Weekly (every 7 days)
- Bi-weekly (every 14 days)
- Monthly (every 30 days)
- Custom interval

**Subscription Fields:**
```
Subscription:
- Customer (FK)
- Products and quantities
- Frequency
- Preferred delivery day
- Preferred time slot
- Delivery address (FK)
- Start date
- Next delivery date
- Status (active, paused, cancelled)
- Auto-renew
- Payment method
```

**Subscription Management:**
- Pause subscription (vacation mode)
- Resume subscription
- Skip next delivery
- Modify products/quantities
- Change delivery schedule
- Cancel subscription

---

## Module 7: Loyalty Program

### Loyalty Card System

**Concept:** Complete X transactions/orders to earn 1 free refill

**Loyalty Program Fields:**
```
Loyalty Program (per station):
- Program name
- Required transactions for reward
- Reward type (free product, discount, points)
- Reward value (product ID or discount %)
- Qualifying minimum order amount
- Qualifying products (all or specific)
- Expiry (days after earning)
- Is active
```

**Customer Loyalty Card:**
```
Loyalty Card:
- Customer (FK)
- Station (FK)
- Program (FK)
- Current stamps/transactions
- Total stamps earned (lifetime)
- Rewards earned
- Rewards redeemed
```

### Loyalty Flow

```
Example: "Buy 10, Get 1 Free"

1. Customer places qualifying order
2. System adds 1 stamp to loyalty card
3. Customer can view progress (7/10 stamps)
4. On 10th order, reward is unlocked
5. Reward added to customer's available rewards
6. Customer redeems on next order
7. Card resets, new cycle begins
```

### Loyalty Card UI (Customer)

```
┌─────────────────────────────────────┐
│  🎉 Aqua Station Loyalty Card       │
│                                     │
│  ● ● ● ● ● ● ● ○ ○ ○               │
│  7 / 10 stamps                      │
│                                     │
│  3 more orders for FREE 5-gal refill│
│                                     │
│  Available Rewards: 1               │
│  [Redeem Now]                       │
└─────────────────────────────────────┘
```

### Additional Loyalty Features

- **Bonus Stamps:** Double stamps on birthdays or promos
- **Tier Levels:** Bronze, Silver, Gold customers
- **Points System:** Alternative to stamps (1 peso = 1 point)
- **Referral Bonus:** Stamps for referring new customers
- **Expiring Stamps Warning:** Notify before stamps expire

---

## Module 8: Customer Management

### Customer Profile

**Customer Fields:**
```
Customer:
- Name (first, last)
- Email
- Phone number
- Profile photo
- Date of birth (for birthday promos)
- Customer type (residential, commercial)
- Company name (if commercial)
- Addresses (multiple)
- Default payment method
- Registered date
- Status (active, inactive, blocked)
- Notes (internal)
```

### Customer Features

- **Multiple Addresses:** Home, office, etc.
- **Order History:** View all past orders
- **Reorder:** Quick reorder from history
- **Favorites:** Save frequently ordered items
- **Notifications:** Order updates, promos, loyalty
- **Referral Code:** Share to earn rewards

---

## Module 9: Delivery Management

### Delivery Personnel

**Driver Fields:**
```
Driver:
- Name
- Phone number
- Email
- Photo
- Vehicle type (motorcycle, tricycle, truck)
- Vehicle plate number
- License number
- Assigned zones
- Status (available, on_delivery, offline)
- Rating (average)
```

### Delivery Assignment

**Manual Assignment:**
- Admin assigns orders to drivers

**Auto-Assignment (Future):**
- Based on zone, driver availability, load capacity

### Driver Mobile App Features

- View assigned deliveries
- Delivery route/navigation
- Mark as delivered
- Collect payment (if COD)
- Capture proof of delivery (photo)
- Customer signature (optional)
- Report issues (customer not available, wrong address)
- View earnings

### Delivery Tracking (Customer)

- Real-time status updates
- Driver info and contact
- Estimated arrival time
- Map view of driver location (optional)

---

## Module 10: Payment Management

### Payment Methods

| Method | Description |
|--------|-------------|
| **COD** | Cash on delivery |
| **E-Wallet** | GCash, Maya, etc. |
| **Bank Transfer** | Manual verification |
| **Card** | Credit/debit via payment gateway |
| **Credit/Tab** | For trusted bulk customers |

### Payment Features

- **Container Deposit:** Charged on first order, refunded on return
- **Wallet System:** Customer can load credits
- **Invoice Generation:** For commercial customers
- **Payment Reminders:** For pending payments

---

## Module 11: Notifications

### Notification Channels

- **Push Notifications:** Mobile app
- **SMS:** Order confirmations, delivery updates
- **Email:** Receipts, promotions, reports

### Notification Triggers

**Customer:**
- Order confirmed
- Order out for delivery
- Order delivered
- Loyalty reward earned
- Subscription reminder
- Promo/discount available
- Subscription payment due

**Station Admin:**
- New order received
- New customer registered
- Low stock alert
- Driver issue reported
- New business application (super admin)

---

## Module 12: Reports & Analytics

### Station Owner Reports

- **Sales Report:** Daily, weekly, monthly revenue
- **Orders Report:** Order count, average order value
- **Product Report:** Best sellers, slow movers
- **Customer Report:** New vs returning, top customers
- **Delivery Report:** On-time rate, failed deliveries
- **Loyalty Report:** Rewards issued vs redeemed
- **Zone Report:** Revenue by area

### Super Admin Reports

- Total registered stations
- Active stations
- Platform-wide order volume
- Revenue by subscription plan
- Application conversion rate

---

## Module 13: Promotions & Discounts

### Promotion Types

| Type | Example |
|------|---------|
| **Percentage Off** | 10% off all orders |
| **Fixed Discount** | ₱50 off orders over ₱500 |
| **Free Delivery** | No delivery fee |
| **Buy X Get Y** | Buy 5 get 1 free |
| **Bundle Deal** | Water + dispenser combo |
| **First Order** | Discount for new customers |

### Promo Code Fields

```
Promo Code:
- Code (unique)
- Description
- Discount type (percentage, fixed, free_delivery)
- Discount value
- Minimum order amount
- Maximum discount amount
- Valid from
- Valid until
- Usage limit (total)
- Usage limit per customer
- Applicable products (all or specific)
- Applicable zones
- Is active
```

---

## Module 14: Container/Bottle Deposit System

### Deposit Tracking

**Concept:** Customers pay deposit for containers, get refund on return

**Container Deposit Fields:**
```
Container Deposit:
- Customer (FK)
- Container type
- Quantity borrowed
- Deposit amount per unit
- Total deposit paid
- Date borrowed
- Expected return date
- Actual return date
- Status (borrowed, returned, overdue)
```

### Deposit Workflow

```
1. Customer orders 5-gallon container (first time)
2. Charged: Water ₱40 + Deposit ₱100
3. On refill: Customer returns empty container
4. No deposit charged on exchange
5. If customer wants to stop: Returns container, gets ₱100 back
```

---

## Module 15: Station Discovery & Map

### Customer Discovery Page

**"Find Water Stations Near Me"**

```
┌─────────────────────────────────────────────────────────┐
│  📍 Your Location: BGC, Taguig                    [📍]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     [MAP VIEW]                                          │
│     - Shows all stations as pins                        │
│     - Customer location marker                          │
│     - Delivery coverage zones (shaded)                  │
│     - Click pin → Station preview card                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Filter: [Water Type ▼] [Price ▼] [Rating ▼] [Open Now] │
├─────────────────────────────────────────────────────────┤
│  ⭐ FEATURED                                            │
│  ┌─────────────────────────────────────┐               │
│  │ 🏪 Aqua Pure Station                │               │
│  │ ⭐ 4.8 (245 reviews) • 1.2 km away  │               │
│  │ 5-gal Purified: ₱35 | Alkaline: ₱45 │               │
│  │ 🚚 Free delivery over ₱200          │               │
│  │ [View Menu]  [Order Now]            │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  NEARBY STATIONS                                        │
│  ┌─────────────────────────────────────┐               │
│  │ 🏪 Crystal Clear Water              │               │
│  │ ⭐ 4.5 (120 reviews) • 1.8 km away  │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Station Profile Page

**Public-facing station page:**
- Station name, logo, cover photo
- Description and story
- Operating hours
- Service areas (map visualization)
- Product catalog with prices
- Photo gallery
- Customer reviews and ratings
- Promotions/announcements
- Contact information
- Social media links
- **[Order from this Station]** CTA

### Discovery Features

| Feature | Description |
|---------|-------------|
| **Geolocation** | Auto-detect customer location |
| **Search** | Search by station name, area, or product |
| **Filters** | Water type, price range, rating, delivery time |
| **Sort** | Distance, rating, price, popularity |
| **Favorites** | Save preferred stations |
| **Compare** | Side-by-side station comparison |
| **Recently Viewed** | Quick access to visited stations |

### Map Features

- **Cluster markers** for dense areas
- **Coverage overlay** showing delivery zones
- **Directions** to physical station location
- **Street view** of station
- **Real-time availability** indicator

---

## Module 16: Advertising & Promotions (Business Owners)

### Ad Types

| Ad Type | Placement | Description |
|---------|-----------|-------------|
| **Featured Listing** | Discovery page top | Priority placement in search results |
| **Banner Ad** | Home page, discovery | Image/video banner |
| **Video Ad** | Station profile, discovery | Promotional video |
| **Sponsored Post** | Customer feed | Promoted announcement |
| **Push Notification Ad** | Customer app | Targeted notification |

### Video Advertising

**Station Owner Video Upload:**
```
Video Ad Fields:
- Title
- Video file (MP4, max 60 seconds)
- Thumbnail image
- Description/caption
- Target audience (zones, customer type)
- Call-to-action button text
- CTA link (station page, promo, product)
- Schedule (start date, end date)
- Budget (if pay-per-view)
```

**Video Placements:**
- Station profile header (auto-play muted)
- Discovery page carousel
- Pre-roll before order confirmation
- Customer app home feed

### Featured Listings

**Boost Station Visibility:**
```
Featured Listing Options:
- Duration: 1 day, 7 days, 30 days
- Placement: Top of search, category page, map pins
- Targeting: Specific zones, customer segments
- Pricing: Fixed daily rate or auction-based
```

**Featured Badge:**
- "⭐ Featured" label on station card
- Highlighted pin on map
- Priority in search results

### Banner Advertising

**Banner Fields:**
```
Banner Ad:
- Image (horizontal: 1200x400, square: 600x600)
- Alt text
- Click URL
- Target zones
- Schedule
- Impressions limit
- Budget
```

**Banner Placements:**
- Home page hero
- Discovery page sidebar
- Between search results
- Order confirmation page

### Ad Campaign Management (Station Owner)

**Dashboard:**
- Create new campaign
- Set budget and schedule
- Target audience selection
- Upload creatives (image/video)
- Preview before publishing
- Track performance (views, clicks, orders)
- Pause/resume campaigns

**Campaign Analytics:**
- Impressions
- Click-through rate (CTR)
- Cost per click (CPC)
- Orders generated
- Return on ad spend (ROAS)

### Platform Ad Revenue (Super Admin)

**Pricing Models:**
| Model | Description |
|-------|-------------|
| **Fixed Rate** | ₱500/day for featured listing |
| **CPM** | ₱50 per 1,000 impressions |
| **CPC** | ₱5 per click |
| **Commission** | % of orders from ad clicks |

**Ad Approval Workflow:**
```
1. Station owner creates ad
2. Status: Pending Review
3. Super Admin reviews content
4. Approve / Reject with reason
5. If approved: Ad goes live on schedule
6. Monitor for policy violations
```

---

## Module 17: Ratings & Reviews

### Order Reviews

**After Delivery:**
- Prompt customer to rate (1-5 stars)
- Review categories:
  - Water quality
  - Delivery speed
  - Driver courtesy
  - Overall experience
- Written review (optional)
- Photo upload (optional)

**Review Fields:**
```
Review:
- Order (FK)
- Customer (FK)
- Station (FK)
- Overall rating (1-5)
- Water quality rating
- Delivery rating
- Service rating
- Review text
- Photos
- Is anonymous
- Station response
- Helpful votes
- Report count
- Status (pending, published, hidden)
- Created at
```

### Station Response

- Owner can reply to reviews
- Public response shown below review
- Professional response templates

### Review Moderation

**Auto-moderation:**
- Profanity filter
- Spam detection
- Fake review detection (same IP, suspicious patterns)

**Manual moderation:**
- Customer can report inappropriate reviews
- Super Admin can hide/remove reviews
- Station owner can flag for review

### Rating Display

```
⭐ 4.7 Overall (328 reviews)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Water Quality    ⭐⭐⭐⭐⭐ 4.9
Delivery Speed   ⭐⭐⭐⭐☆ 4.5
Service          ⭐⭐⭐⭐⭐ 4.8
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Module 18: Social & Community Features

### Customer Feed

**Home Feed Content:**
- New stations in your area
- Promotional posts from followed stations
- Friend activity (if enabled)
- Platform announcements
- Water tips and articles

### Social Features

| Feature | Description |
|---------|-------------|
| **Follow Station** | Get updates from favorite stations |
| **Share Order** | Share purchase on social media |
| **Invite Friends** | Referral with rewards |
| **Community Posts** | Stations post updates, tips |
| **Reactions** | Like, heart posts |
| **Comments** | Comment on station posts |

### Station Social Page

**Station can post:**
- Announcements (new products, hours change)
- Promotions and flash sales
- Behind-the-scenes content
- Water quality certifications
- Customer appreciation posts
- Tips for water storage

### Referral Program

**Customer Referral:**
```
Referral Program:
- Unique referral code per customer
- Reward for referrer (₱50 credit or stamps)
- Reward for referee (₱50 off first order)
- Track referral conversions
- Limit referrals per customer (optional)
- Referral leaderboard
```

---

## Module 19: Gamification

### Achievement Badges

| Badge | Criteria |
|-------|----------|
| 💧 First Drop | Complete first order |
| 🏃 Speed Demon | Order delivered in under 30 mins |
| 🔄 Loyal Customer | 10 orders from same station |
| 🌍 Explorer | Order from 5 different stations |
| 📅 Subscriber | Active subscription for 3 months |
| ⭐ Reviewer | Write 10 reviews |
| 🎯 Bulk Buyer | Place order of 20+ containers |
| 🎂 Birthday Order | Order on your birthday |
| 🌙 Night Owl | Order after 10 PM |
| 🌅 Early Bird | Order before 7 AM |

### Customer Levels

```
Level System:
- Level 1: Newbie (0-99 points)
- Level 2: Regular (100-499 points)
- Level 3: Hydrated (500-999 points)
- Level 4: Water Champion (1000-2499 points)
- Level 5: Aqua Legend (2500+ points)

Points Earning:
- Order completed: 10 points
- Review written: 5 points
- Referral signup: 20 points
- Badge unlocked: varies
```

### Level Benefits

| Level | Benefit |
|-------|---------|
| Level 2 | 2% discount on all orders |
| Level 3 | Free delivery on orders over ₱300 |
| Level 4 | Early access to promotions |
| Level 5 | VIP support, exclusive deals |

### Leaderboards

- Top customers (by orders)
- Top reviewers
- Referral champions
- Station rankings (by rating, orders)

### Challenges & Quests

**Weekly Challenges:**
- "Order 3 times this week for bonus points"
- "Try a new station for 20 bonus points"
- "Write 2 reviews for 15 bonus points"

---

## Module 20: Advanced Search & Recommendations

### Smart Search

**Search Capabilities:**
- Station name
- Water type (alkaline, mineral, etc.)
- Product name
- Location/area
- Price range
- Tags/keywords

**Search Suggestions:**
- Auto-complete
- Recent searches
- Popular searches
- "Did you mean...?" corrections

### Personalized Recommendations

**AI-Powered Suggestions:**
- Based on order history
- Similar customers also ordered
- Trending in your area
- Seasonal recommendations
- Reorder reminders

**Recommendation Placements:**
- Home page "For You" section
- "You might also like" on product pages
- Post-order suggestions
- Email recommendations

### Smart Notifications

**Triggered Messages:**
- "Running low? Your last order was 2 weeks ago"
- "Flash sale at your favorite station!"
- "New station opened near you"
- "Price drop on your usual order"

---

## Module 21: Station Verification & Trust

### Verification Levels

| Level | Badge | Requirements |
|-------|-------|--------------|
| **Basic** | ✓ | Registered, email verified |
| **Verified** | ✓✓ | Business docs approved |
| **Premium** | ✓✓✓ | Quality inspection passed |
| **Certified** | 🏆 | 6+ months, 100+ orders, 4.5+ rating |

### Trust Signals

**Displayed on Station Profile:**
- Verification badge
- Years in business
- Total orders fulfilled
- Response rate
- Average delivery time
- Quality certifications (FDA, etc.)
- "Top Rated" badge (if applicable)
- "Fast Responder" badge
- Customer satisfaction rate

### Quality Assurance

**Platform Quality Checks:**
- Random quality inspections
- Customer complaint monitoring
- Automated fraud detection
- Mystery shopper program

---

## Module 22: Multi-Language & Accessibility

### Language Support

- English (default)
- Filipino/Tagalog
- Cebuano (future)
- Other regional languages

### Accessibility Features

- Screen reader compatible
- High contrast mode
- Large text option
- Voice search
- Simple mode (reduced animations)

---

## Module 23: Customer Support & Help Center

### Support Channels

| Channel | Description |
|---------|-------------|
| **In-App Chat** | Live chat with support |
| **Help Center** | FAQs, guides, tutorials |
| **Email Support** | support@waterstation.ph |
| **Phone Hotline** | For urgent issues |
| **Social Media** | FB Messenger, etc. |

### Ticket System

**Support Ticket Fields:**
```
Ticket:
- Ticket number
- Customer (FK)
- Station (FK) - if station-related
- Order (FK) - if order-related
- Category (order issue, refund, complaint, etc.)
- Subject
- Description
- Attachments
- Priority (low, medium, high, urgent)
- Status (open, in_progress, resolved, closed)
- Assigned to
- Resolution notes
```

### Help Center Content

- Getting started guide
- How to order
- Payment methods
- Delivery tracking
- Subscription management
- Loyalty program FAQ
- Troubleshooting
- Contact information

---

## Module 24: Analytics Dashboard (Station Owner)

### Overview Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard - January 2026                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Today          This Week       This Month             │
│  ₱12,450        ₱78,320         ₱324,500              │
│  +15% ↑         +8% ↑           +12% ↑                 │
│                                                         │
│  Orders: 45     Rating: 4.8     New Customers: 12      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Sales Chart - Line graph showing daily revenue]       │
├─────────────────────────────────────────────────────────┤
│  Top Products          Top Zones                       │
│  1. 5-gal Purified     1. BGC - ₱45,000               │
│  2. 5-gal Alkaline     2. Makati CBD - ₱38,000        │
│  3. Dispenser Rental   3. Ortigas - ₱28,000           │
└─────────────────────────────────────────────────────────┘
```

### Available Reports

| Report | Metrics |
|--------|---------|
| **Sales** | Revenue, orders, average order value |
| **Products** | Best/worst sellers, stock levels |
| **Customers** | New vs returning, lifetime value |
| **Zones** | Revenue by area, delivery performance |
| **Delivery** | On-time rate, driver performance |
| **Loyalty** | Stamps issued, rewards redeemed |
| **Marketing** | Ad performance, promo effectiveness |
| **Reviews** | Rating trends, sentiment analysis |

### Export Options

- PDF reports
- Excel/CSV export
- Scheduled email reports (daily, weekly, monthly)

---

## Module 25: Platform Admin (Super Admin)

### Super Admin Dashboard

**Platform-wide Metrics:**
- Total registered stations
- Total customers
- Platform GMV (Gross Merchandise Value)
- Active subscriptions
- Pending applications
- Support tickets
- Ad revenue

### Management Features

| Feature | Description |
|---------|-------------|
| **Station Management** | View, suspend, feature stations |
| **User Management** | Customers, admins, support staff |
| **Application Review** | Approve/reject new stations |
| **Content Moderation** | Reviews, posts, ads |
| **Promo Management** | Platform-wide promotions |
| **Settings** | Platform configuration |
| **Announcements** | System-wide notices |

### Revenue Management

- Station subscription billing
- Ad revenue tracking
- Commission calculation (if applicable)
- Payout management
- Financial reports

---

## Module 26: SMS/Text Ordering System

### Overview

Allows customers to place orders via SMS text message using simple codes. Ideal for:
- Customers without smartphones
- Areas with poor internet connectivity
- Quick reorders without opening the app
- Elderly customers who prefer SMS

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│  SMS ORDERING FLOW                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Customer sends SMS to: 0917-WATER-PH (0917-928-3774)  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ To: 0917-WATER-PH                                │  │
│  │                                                  │  │
│  │ ORDER AQP 5GAL 3                                 │  │
│  │                                                  │  │
│  │ (Station code + Product code + Quantity)        │  │
│  └──────────────────────────────────────────────────┘  │
│                           ↓                             │
│  System receives SMS → Validates → Creates Order        │
│                           ↓                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ From: 0917-WATER-PH                              │  │
│  │                                                  │  │
│  │ Order confirmed! #ORD-12345                      │  │
│  │ 3x 5-Gal Purified = P120                        │  │
│  │ Delivery: Today 2-4PM                           │  │
│  │ Station: Aqua Pure BGC                          │  │
│  │                                                  │  │
│  │ Reply CANCEL to cancel.                         │  │
│  │ Reply HELP for commands.                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### SMS Commands

| Command | Format | Example | Description |
|---------|--------|---------|-------------|
| **ORDER** | `ORDER [station] [product] [qty]` | `ORDER AQP 5GAL 3` | Place new order |
| **REORDER** | `REORDER` or `REORDER [order#]` | `REORDER` | Repeat last order |
| **STATUS** | `STATUS [order#]` | `STATUS 12345` | Check order status |
| **CANCEL** | `CANCEL [order#]` | `CANCEL 12345` | Cancel pending order |
| **BALANCE** | `BALANCE` | `BALANCE` | Check wallet/loyalty |
| **MENU** | `MENU [station]` | `MENU AQP` | Get station menu |
| **STATIONS** | `STATIONS [area]` | `STATIONS BGC` | Find nearby stations |
| **REGISTER** | `REGISTER [name]` | `REGISTER Juan` | Register new account |
| **HELP** | `HELP` | `HELP` | List all commands |
| **STOP** | `STOP` | `STOP` | Unsubscribe from SMS |

### Product Codes

**Station Owner Defines Codes:**
```
Product Code Setup:
- Code: Short alphanumeric (3-6 chars)
- Product: Linked product
- Station: Owner's station
- Is active

Examples:
- 5GAL → 5-Gallon Purified Water
- 5ALK → 5-Gallon Alkaline Water
- 10GAL → 10-Gallon Purified Water
- DISP → Water Dispenser Rental
```

**Station Codes:**
```
Station Code:
- Unique 3-4 letter code per station
- Example: AQP = Aqua Pure Station
- Example: CRY = Crystal Clear Water
- Auto-generated or owner chooses
```

### Order Formats

**Basic Order:**
```
ORDER [station] [product] [qty]
ORDER AQP 5GAL 2

→ Orders 2x 5-gallon from Aqua Pure
→ Delivers to default address
```

**Order with Address:**
```
ORDER [station] [product] [qty] [address_code]
ORDER AQP 5GAL 2 HOME
ORDER AQP 5GAL 2 OFFICE

→ Customer pre-saves addresses with codes
```

**Order with Schedule:**
```
ORDER [station] [product] [qty] TOMORROW
ORDER [station] [product] [qty] PM

→ Schedule for tomorrow or afternoon slot
```

**Multiple Products:**
```
ORDER AQP 5GAL 2 5ALK 1

→ Orders 2x purified + 1x alkaline
```

**Quick Reorder:**
```
REORDER
→ Repeats exact last order

REORDER 12345
→ Repeats specific past order
```

### Customer Registration via SMS

**New Customer Flow:**
```
Customer: REGISTER Juan Dela Cruz
System: Welcome Juan! Reply with your delivery address to complete registration.
Customer: 123 Main St, BGC, Taguig
System: Address saved! You can now order. Text HELP for commands. Your customer code: JDC001
```

**Linking Phone to Existing Account:**
```
Customer: LINK [email]
System: Verification code sent to your email. Reply with the code.
Customer: 123456
System: Phone linked to your account successfully!
```

### Address Management via SMS

```
ADDADDR HOME 456 New Address, Makati
→ Adds new address with code "HOME"

SETDEFAULT OFFICE
→ Sets OFFICE as default delivery address

MYADDR
→ Lists saved addresses with codes
```

### Subscription via SMS

```
SUBSCRIBE AQP 5GAL 2 WEEKLY
→ Subscribe to weekly delivery

PAUSE
→ Pause active subscription

RESUME
→ Resume paused subscription

SKIP
→ Skip next delivery
```

### SMS Responses

**Success Response:**
```
Order confirmed! #ORD-12345
3x 5-Gal Purified = P120
Delivery fee: P20
Total: P140 (COD)
Delivery: Today 2-4PM
Driver: Mario (0917-XXX-XXXX)

Reply CANCEL 12345 to cancel.
```

**Error Responses:**
```
Invalid command. Text HELP for list of commands.

Unknown product code "5GALX". Text MENU AQP for product list.

Station AQP does not deliver to your area. Text STATIONS MAKATI to find nearby stations.

Order #12345 cannot be cancelled (already out for delivery).
```

**Status Updates (Auto-sent):**
```
Your order #12345 is out for delivery! Driver Mario is on the way. Track: bit.ly/track12345

Your order #12345 has been delivered. Thank you! Rate us: bit.ly/rate12345
```

### Two-Way Communication

**Customer to Station:**
```
MSG AQP Please deliver after 3pm
→ Sends message to station about pending order
```

**Station Broadcast:**
```
Station can send promo SMS to opted-in customers:
"Flash sale! 20% off all products today. Order now: ORDER AQP 5GAL 2. Reply STOP to unsubscribe."
```

### Technical Implementation

**SMS Gateway Options:**
| Provider | Coverage | Features |
|----------|----------|----------|
| **Semaphore** | Philippines | 2-way SMS, keywords |
| **Twilio** | Global | Programmable SMS, webhooks |
| **Globe Labs** | Philippines | Local, cheaper |
| **Smart DevNet** | Philippines | Local, cheaper |

**System Architecture:**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Customer  │ SMS  │ SMS Gateway │ HTTP │  Laravel    │
│   Phone     │ ──── │ (Semaphore) │ ──── │  Webhook    │
└─────────────┘      └─────────────┘      └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ SMS Parser  │
                                          │ Service     │
                                          └─────────────┘
                                                 │
                           ┌─────────────────────┼─────────────────────┐
                           ▼                     ▼                     ▼
                    ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
                    │ Order       │       │ Customer    │       │ Station     │
                    │ Service     │       │ Service     │       │ Service     │
                    └─────────────┘       └─────────────┘       └─────────────┘
```

**Webhook Handler:**
```php
// Example Laravel webhook for incoming SMS
Route::post('/webhook/sms', [SmsController::class, 'handleIncoming']);

// SmsController parses message and routes to appropriate handler:
// - OrderSmsHandler
// - StatusSmsHandler
// - RegisterSmsHandler
// - HelpSmsHandler
// etc.
```

### SMS Order Database Fields

```
SMS Orders Table:
- id
- phone_number
- raw_message (original SMS text)
- parsed_command
- parsed_params (JSON)
- customer_id (FK, nullable if unregistered)
- station_id (FK)
- order_id (FK, if order created)
- status (received, parsed, processed, failed)
- error_message
- response_sent
- created_at
```

### Security Considerations

- **Phone verification:** OTP to verify phone ownership
- **Rate limiting:** Max 10 SMS per hour per number
- **Fraud detection:** Unusual patterns trigger review
- **Opt-in required:** Customers must opt-in for SMS ordering
- **Command confirmation:** Large orders require confirmation

### Offline Capability

If customer has no data but has SMS:
- Full ordering capability
- Order tracking via SMS
- Balance/loyalty check
- Basic customer support

### Cost Considerations

| Direction | Cost (Philippines) |
|-----------|-------------------|
| Incoming SMS | Usually free |
| Outgoing SMS | ₱0.35-0.50 per SMS |
| Toll-free number | ₱5,000-10,000/month |

**Cost Optimization:**
- Combine multiple updates in one SMS
- Use URL shorteners for tracking links
- Batch non-urgent notifications

---

## Module 27: USSD Ordering (Future)

### Overview

USSD (Unstructured Supplementary Service Data) for feature phones without SMS credits.

**How It Works:**
```
Customer dials: *123*WATER#

Menu appears:
1. Order Water
2. Check Status
3. My Account
4. Find Stations

Select 1 →
1. Aqua Pure (AQP)
2. Crystal Clear (CRY)
3. More stations...

Select 1 →
1. 5-Gal Purified - P40
2. 5-Gal Alkaline - P50
3. More products...

etc.
```

**Benefits:**
- Works on any phone (even basic)
- No SMS cost to customer
- Real-time session
- Menu-driven (easier than SMS commands)

**Note:** Requires partnership with telcos (Globe, Smart).

---

## Module 28: Messaging App Integration (Future)

### Supported Platforms

| Platform | Features |
|----------|----------|
| **Facebook Messenger** | Chatbot ordering, notifications |
| **Viber** | Chatbot, broadcasts |
| **WhatsApp Business** | Catalog, quick replies |
| **Telegram** | Bot commands |

### Messenger Bot Flow

```
Customer: Hi
Bot: Welcome to WaterStation! What would you like to do?
     [Order Water] [Track Order] [Find Stations]

Customer: [Order Water]
Bot: Which station? (showing nearby)
     [Aqua Pure - 1.2km] [Crystal Clear - 1.8km]

Customer: [Aqua Pure]
Bot: What would you like to order?
     [5-Gal Purified ₱40] [5-Gal Alkaline ₱50] [View All]

Customer: [5-Gal Purified ₱40]
Bot: How many?
     [1] [2] [3] [4] [5+]

Customer: [3]
Bot: Deliver to: 123 Main St, BGC?
     [Yes] [Change Address]

Customer: [Yes]
Bot: Order summary:
     3x 5-Gal Purified = ₱120
     Delivery: ₱20
     Total: ₱140

     [Confirm Order] [Cancel]

Customer: [Confirm Order]
Bot: Order placed! #ORD-12345
     Delivery: Today 2-4PM
     Payment: Cash on delivery

     I'll notify you when it's on the way!
```

### Chatbot Features

- Natural language understanding
- Quick reply buttons
- Product carousels with images
- Location sharing for address
- Payment links (GCash, Maya)
- Order status updates
- Customer support handoff

---

## Module 29: QR Code System (Gallon Advertising)

### Overview

Physical QR codes placed on water gallons/containers that customers can scan to:
- **Reorder** water instantly
- **Pay** for their order
- **Review** the station/product
- **Access promotions** and loyalty rewards
- **Register** as new customer

This creates a direct bridge between physical product and digital platform.

### QR Code Types

| Type | Purpose | Unique Per |
|------|---------|------------|
| **Station QR** | General station page | Station |
| **Product QR** | Quick reorder specific product | Product |
| **Container QR** | Track individual container | Container |
| **Promo QR** | Special campaign/discount | Campaign |
| **Driver QR** | Rate delivery/tip driver | Driver |

### QR Code Placements

```
┌─────────────────────────────────────────────────────────┐
│  PHYSICAL QR PLACEMENTS                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🫙 On Gallon/Container:                               │
│     ┌──────────────────┐                               │
│     │  ┌────┐          │                               │
│     │  │ QR │  AQUA    │                               │
│     │  └────┘  PURE    │                               │
│     │                  │                               │
│     │  Scan to:        │                               │
│     │  • Reorder       │                               │
│     │  • Pay           │                               │
│     │  • Review        │                               │
│     └──────────────────┘                               │
│                                                         │
│  🧾 On Receipt/Sticker:                                │
│     - Order-specific QR for payment/review              │
│                                                         │
│  🚚 On Delivery Vehicle:                               │
│     - Station QR for new customer acquisition           │
│                                                         │
│  📋 On Flyers/Posters:                                 │
│     - Promo QR with special discount                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### QR Scan Flow

**Scenario 1: Existing Customer Scans Gallon QR**
```
┌─────────────────────────────────────────────────────────┐
│  Customer scans QR on empty gallon                      │
│                     ↓                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📱 Smart Landing Page                          │   │
│  │                                                 │   │
│  │  🫙 5-Gallon Purified Water                    │   │
│  │  Aqua Pure Station                              │   │
│  │                                                 │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │  🔄 REORDER NOW                         │   │   │
│  │  │  Same as last time: 3x 5-Gal = ₱120    │   │   │
│  │  │  [Order Now - Deliver Today]            │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │                                                 │   │
│  │  [💳 Pay Balance: ₱240]                        │   │
│  │                                                 │   │
│  │  [⭐ Rate Last Order]                          │   │
│  │                                                 │   │
│  │  [🎁 Your Rewards: 7/10 stamps]                │   │
│  │                                                 │   │
│  │  ─────────────────────────────────────────     │   │
│  │  📢 PROMO: Free delivery this week!            │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Scenario 2: New Customer Scans QR**
```
┌─────────────────────────────────────────────────────────┐
│  New person scans QR (saw gallon at friend's house)     │
│                     ↓                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📱 Welcome Page                                │   │
│  │                                                 │   │
│  │  🫙 5-Gallon Purified Water                    │   │
│  │  From: Aqua Pure Station                        │   │
│  │  ⭐ 4.8 rating (245 reviews)                   │   │
│  │                                                 │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │  🎉 FIRST ORDER DISCOUNT!               │   │   │
│  │  │  Get ₱50 off your first order           │   │   │
│  │  │  [Sign Up & Order]                      │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │                                                 │   │
│  │  [View Station Menu]                           │   │
│  │  [See Reviews]                                 │   │
│  │  [Check if We Deliver to You]                  │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### QR Actions

| Action | URL Format | Result |
|--------|------------|--------|
| **Station Page** | `/s/AQP` | Station profile |
| **Quick Reorder** | `/r/AQP/5GAL` | Pre-filled order |
| **Pay Order** | `/pay/ORD12345` | Payment page |
| **Review** | `/review/ORD12345` | Review form |
| **Promo** | `/promo/SUMMER50` | Apply discount |
| **Container** | `/c/CNT-789456` | Container details |
| **Referral** | `/ref/JUAN123` | Referral signup |

### Smart QR Landing Page

**Dynamic Content Based On:**
- Is user logged in?
- Has user ordered from this station before?
- Does user have pending payment?
- Does user have unredeemed rewards?
- Is there an active promo?
- Container deposit status

**Personalized Actions:**
```
Logged-in returning customer:
- "Reorder: 3x 5-Gal (same as last time)" ← Primary CTA
- Pay outstanding balance
- Claim rewards
- Rate last order

Logged-in new-to-station:
- "Order from this station" ← Primary CTA
- View menu and prices
- Read reviews

Not logged in:
- "Sign up for ₱50 off" ← Primary CTA
- View station info
- Quick guest checkout
```

### Container-Specific QR (Tracking)

**Unique QR Per Container:**
```
Container QR Fields:
- Container ID (unique)
- Container type (5-gal, 10-gal)
- Station owner (FK)
- Manufacturing date
- QR code URL
- Current holder (customer FK, nullable)
- Status (in_station, with_customer, returned, lost, damaged)
- Deposit paid by
- Last scanned at
- Last scanned location
- Scan history
```

**Benefits:**
- Track container lifecycle
- Know which customer has which container
- Manage deposits accurately
- Identify lost containers
- Quality control (retire old containers)

**Container Scan History:**
```
Timeline for Container #CNT-789456:
- Jan 15: Created, assigned to Aqua Pure Station
- Jan 18: Delivered to Customer Juan (Order #12345)
- Jan 25: Scanned by Juan (Reorder triggered)
- Jan 25: Returned, delivered new container
- Jan 28: Delivered to Customer Maria (Order #12350)
```

### Gallon Advertising Features

**Station Owner Creates QR Stickers:**
```
QR Sticker Generator:
- Select QR type (station, product, promo)
- Choose design template
- Add station logo
- Add call-to-action text
- Select size (small label, large sticker)
- Preview
- Download PDF for printing
- Order printed stickers (optional service)
```

**Sticker Templates:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   ┌────────┐    │  │  SCAN FOR       │  │  ★ PROMO ★     │
│   │   QR   │    │  │  FREE DELIVERY  │  │   ┌────────┐   │
│   └────────┘    │  │   ┌────────┐    │  │   │   QR   │   │
│                 │  │   │   QR   │    │  │   └────────┘   │
│   AQUA PURE     │  │   └────────┘    │  │  SCAN & GET    │
│   Scan to Order │  │   AQUA PURE     │  │  ₱50 OFF       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
     Basic               With Promo           Campaign
```

### QR Payment Integration

**Pay via QR Scan:**
```
Customer scans QR on gallon/receipt
         ↓
Shows pending balance: ₱480
         ↓
Payment options:
[GCash] [Maya] [Card] [Bank Transfer]
         ↓
Payment processed
         ↓
Receipt sent via SMS/email
Balance updated in real-time
```

**Payment QR on Receipt:**
```
┌─────────────────────────────────────────┐
│  Order #12345                           │
│  Date: Jan 25, 2026                     │
│                                         │
│  3x 5-Gal Purified      ₱120           │
│  Delivery                ₱20           │
│  ─────────────────────────────         │
│  Total                   ₱140          │
│                                         │
│  Payment: COD (Unpaid)                  │
│                                         │
│  ┌────────┐  Scan to pay online        │
│  │   QR   │  or rate your order        │
│  └────────┘                            │
│                                         │
│  Thank you! - Aqua Pure Station         │
└─────────────────────────────────────────┘
```

### QR Review System

**Post-Delivery Review via QR:**
```
Customer scans QR after delivery
         ↓
┌─────────────────────────────────────────┐
│  How was your order? #12345             │
│                                         │
│  ⭐⭐⭐⭐⭐                              │
│  Tap to rate                            │
│                                         │
│  Water Quality    [1][2][3][4][5]      │
│  Delivery Speed   [1][2][3][4][5]      │
│  Driver Service   [1][2][3][4][5]      │
│                                         │
│  [Write a review...]                    │
│                                         │
│  [📷 Add Photo]                         │
│                                         │
│  [Submit Review]                        │
│                                         │
│  🎁 Get 5 bonus loyalty points for     │
│     completing this review!             │
└─────────────────────────────────────────┘
```

### Driver QR Code

**Tip & Rate Driver:**
```
Driver has personal QR badge
         ↓
Customer scans after delivery
         ↓
┌─────────────────────────────────────────┐
│  Driver: Mario Santos                   │
│  ⭐ 4.9 (120 deliveries)               │
│                                         │
│  How was your delivery?                 │
│  [😊 Great] [😐 Okay] [😞 Poor]        │
│                                         │
│  ─────────────────────────────         │
│  💝 Leave a tip for Mario?             │
│  [₱20] [₱50] [₱100] [Custom]           │
│                                         │
└─────────────────────────────────────────┘
```

### QR Analytics

**Track QR Performance:**
```
QR Analytics Dashboard:
- Total scans
- Unique scanners
- Scans by location (if GPS permitted)
- Scans by time of day
- Conversion rate (scan → order)
- Revenue from QR orders
- Top performing QR codes
- Scan heatmap
```

**Station Owner Report:**
```
┌─────────────────────────────────────────────────────────┐
│  📊 QR Performance - January 2026                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Total Scans: 1,245        Orders from QR: 312         │
│  Conversion Rate: 25%      Revenue: ₱48,500            │
│                                                         │
│  Top QR Codes:                                          │
│  1. 5-Gal Reorder QR    - 580 scans, 180 orders        │
│  2. Station QR          - 420 scans, 85 orders         │
│  3. Summer Promo QR     - 245 scans, 47 orders         │
│                                                         │
│  Peak Scan Times:                                       │
│  ████████████░░░░░░░░░░░░  Morning (6-10 AM)          │
│  ██████░░░░░░░░░░░░░░░░░░  Afternoon (12-3 PM)        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### QR Code Generation

**Technical Implementation:**
```
QR Code Fields:
- id
- type (station, product, container, promo, driver, order)
- reference_id (FK to respective table)
- short_code (unique, for URL)
- full_url
- created_by (station owner)
- is_active
- expires_at (for promo QRs)
- scan_count
- last_scanned_at
- metadata (JSON - campaign info, etc.)
```

**QR Generation API:**
```
POST /api/v1/qr-codes
{
  "type": "product",
  "product_id": 123,
  "campaign": "summer-2026",
  "expires_at": "2026-03-01"
}

Response:
{
  "qr_code_id": 456,
  "short_code": "AQP5G",
  "url": "https://waterstation.ph/r/AQP5G",
  "qr_image_url": "https://cdn.waterstation.ph/qr/AQP5G.png",
  "qr_image_svg": "...",
  "download_pdf": "https://..."
}
```

### Security & Fraud Prevention

- **Rate limiting:** Max scans per minute per IP
- **Geo-validation:** Flag scans from unexpected locations
- **Duplicate detection:** Detect same QR scanned from multiple phones simultaneously
- **Expiring QRs:** Promo QRs auto-expire
- **Scan alerts:** Notify station of unusual activity

### Integration with Other Modules

| Module | QR Integration |
|--------|----------------|
| **Loyalty** | Scan to check stamps, redeem rewards |
| **Orders** | Quick reorder, view order history |
| **Payments** | Pay balance, tip driver |
| **Reviews** | Rate order, rate driver |
| **Referral** | Scan friend's gallon to sign up |
| **Subscription** | Manage subscription via QR |
| **SMS** | QR shows SMS order instructions |
| **Ads** | QR links to promo campaigns |

---

## Module 30: Gallon Commerce & Services

### Overview

Complete gallon/container lifecycle management including:
- **Buy gallons** - Customers purchase new or refurbished containers
- **Sell old gallons** - Customers sell back their old containers
- **Repair services** - Fix damaged gallons
- **Trade-in program** - Exchange old for new at discount

### Gallon Purchase (Customer Buys)

**Products Available for Purchase:**

| Product | Type | Description |
|---------|------|-------------|
| New 5-Gallon Container | New | Brand new PC/PET container |
| New 10-Gallon Container | New | Brand new large container |
| Refurbished 5-Gallon | Refurbished | Cleaned, sanitized, inspected |
| Slim Gallon | New | Slim-type water container |
| Round Container | New | Round-type water container |

**Purchase Options:**
```
┌─────────────────────────────────────────────────────────┐
│  🛒 BUY CONTAINERS                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  NEW CONTAINERS                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🫙 5-Gallon PC Container (New)                 │   │
│  │  ₱350                                           │   │
│  │  • Food-grade polycarbonate                     │   │
│  │  • BPA-free                                     │   │
│  │  • 3-year warranty                              │   │
│  │  [Add to Cart]                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  REFURBISHED (SAVE 40%)                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🫙 5-Gallon Container (Refurbished)            │   │
│  │  ₱200 (was ₱350)                               │   │
│  │  • Professionally cleaned & sanitized           │   │
│  │  • Quality inspected                            │   │
│  │  • 1-year warranty                              │   │
│  │  [Add to Cart]                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  BUNDLES                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🎁 Starter Kit                                 │   │
│  │  ₱599 (Save ₱150)                              │   │
│  │  • 2x 5-Gallon containers                       │   │
│  │  • 1x Manual pump                               │   │
│  │  • Free first refill                            │   │
│  │  [Add to Cart]                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Gallon Buyback (Station Buys from Customer)

**Buyback Program:**
```
"Sell Your Old Gallons"

We buy your old water containers!
Earn cash or store credit.

┌─────────────────────────────────────────────────────────┐
│  💰 SELL YOUR GALLONS                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Container Type          Condition    We Pay            │
│  ───────────────────────────────────────────────       │
│  5-Gallon PC             Good         ₱80              │
│  5-Gallon PC             Fair         ₱50              │
│  5-Gallon PC             Damaged      ₱20              │
│  5-Gallon PET            Good         ₱60              │
│  5-Gallon PET            Fair         ₱35              │
│  10-Gallon               Good         ₱120             │
│  10-Gallon               Fair         ₱70              │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  Condition Guide:                                       │
│  • Good: No cracks, clear, no odor, cap intact         │
│  • Fair: Minor scratches, slight cloudiness            │
│  • Damaged: Cracks, heavy scratches, needs repair      │
│                                                         │
│  [Schedule Pickup]  [Find Drop-off Location]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Buyback Flow:**
```
1. Customer requests buyback (app/SMS/call)
2. Selects container type and quantity
3. Chooses: Pickup or Drop-off
4. If Pickup: Schedule date/time
5. Driver inspects containers on arrival
6. Confirms condition and price
7. Customer receives:
   - Cash payment, OR
   - Store credit (bonus 10%), OR
   - Discount on next order
8. Containers collected for refurbishment
```

**Buyback Request Fields:**
```
Buyback Request:
- Customer (FK)
- Station (FK)
- Container type
- Quantity (estimated)
- Condition (self-assessed)
- Preferred payout (cash, credit, discount)
- Pickup/dropoff
- Scheduled date
- Address (if pickup)
- Status (pending, scheduled, completed, cancelled)
- Actual quantity (after inspection)
- Actual condition
- Final payout amount
- Notes
```

### Trade-In Program

**Exchange Old for New:**
```
┌─────────────────────────────────────────────────────────┐
│  🔄 TRADE-IN PROGRAM                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Upgrade your old gallon!                               │
│                                                         │
│  Trade your old 5-Gallon container                      │
│  Get a NEW 5-Gallon for only ₱250                      │
│  (Regular price: ₱350 - You save ₱100!)                │
│                                                         │
│  Your old container value:    ₱50 - ₱80                │
│  Additional discount:         ₱20 - ₱50                │
│  ─────────────────────────────────────────────────     │
│  Your price:                  ₱250 or less             │
│                                                         │
│  [Trade In Now]                                         │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  ✓ Old container collected during delivery             │
│  ✓ Instant exchange - no waiting                       │
│  ✓ Environmentally friendly                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Repair Services

**Gallon Repair Options:**

| Service | Price | Description |
|---------|-------|-------------|
| Deep Cleaning | ₱50 | Industrial sanitization |
| Cap Replacement | ₱30 | New cap and seal |
| Handle Repair | ₱40 | Fix or replace handle |
| Crack Sealing | ₱80 | Minor crack repair |
| Full Refurbishment | ₱120 | Complete restoration |

**Repair Service Flow:**
```
┌─────────────────────────────────────────────────────────┐
│  🔧 GALLON REPAIR SERVICE                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  What's wrong with your gallon?                         │
│                                                         │
│  [ ] Dirty/Stained - needs deep cleaning               │
│  [ ] Broken cap - won't seal properly                  │
│  [ ] Handle broken - hard to carry                     │
│  [ ] Small crack - leaking                             │
│  [ ] Bad smell - odor inside                           │
│  [ ] Other: _______________                            │
│                                                         │
│  [Get Repair Quote]                                     │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  HOW IT WORKS:                                          │
│  1. Schedule pickup (or drop off)                       │
│  2. We inspect and quote repair cost                   │
│  3. You approve or decline                             │
│  4. Repair completed in 1-3 days                       │
│  5. Delivered back or pickup                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Repair Order Fields:**
```
Repair Order:
- Customer (FK)
- Station (FK)
- Container ID (FK, if tracked)
- Issue description
- Photos (before)
- Pickup date
- Inspection notes
- Repair type(s) needed
- Quoted price
- Customer approved (boolean)
- Repair status (received, inspecting, repairing, ready, delivered)
- Repair completion date
- Photos (after)
- Final price
- Warranty period
```

### Container Rental Program

**Rent Instead of Buy:**
```
┌─────────────────────────────────────────────────────────┐
│  📦 CONTAINER RENTAL                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Don't want to buy? Rent containers!                    │
│                                                         │
│  Monthly Rental:                                        │
│  • 5-Gallon container: ₱30/month                       │
│  • 10-Gallon container: ₱50/month                      │
│                                                         │
│  Benefits:                                              │
│  ✓ No upfront container cost                           │
│  ✓ Free replacement if damaged                         │
│  ✓ Upgrade anytime                                     │
│  ✓ Cancel anytime                                      │
│                                                         │
│  [Start Renting]                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rental Fields:**
```
Container Rental:
- Customer (FK)
- Station (FK)
- Container type
- Quantity
- Monthly rate
- Start date
- End date (nullable)
- Status (active, paused, ended)
- Next billing date
- Auto-renew
```

### Gallon Marketplace (B2B/B2C)

**For Bulk Buyers & Resellers:**
```
┌─────────────────────────────────────────────────────────┐
│  🏭 WHOLESALE CONTAINERS                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Starting a water business? Need bulk containers?       │
│                                                         │
│  WHOLESALE PRICING:                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Quantity          Unit Price    Total          │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  10-49 pcs         ₱320          ₱3,200+       │   │
│  │  50-99 pcs         ₱290          ₱14,500+      │   │
│  │  100-499 pcs       ₱260          ₱26,000+      │   │
│  │  500+ pcs          ₱230          Contact us    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Request Wholesale Quote]                              │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  Also available:                                        │
│  • Custom branding (your logo on containers)           │
│  • Dispenser wholesale                                  │
│  • Pump wholesale                                       │
│  • Complete station starter kits                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Container Inventory Management (Station)

**Station Owner Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│  📦 CONTAINER INVENTORY                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STOCK LEVELS                                           │
│  ─────────────────────────────────────────────────     │
│  5-Gallon (New)           45 pcs    [Reorder]          │
│  5-Gallon (Refurbished)   23 pcs    ⚠️ Low stock      │
│  10-Gallon (New)          12 pcs    [Reorder]          │
│  Caps                     200 pcs   ✓ OK               │
│  Handles                  50 pcs    ✓ OK               │
│                                                         │
│  CONTAINERS OUT                                         │
│  ─────────────────────────────────────────────────     │
│  With customers (deposit): 342 pcs                     │
│  With customers (rental):  28 pcs                      │
│  In repair:                15 pcs                      │
│  Lost/damaged:             8 pcs                       │
│                                                         │
│  INCOMING                                               │
│  ─────────────────────────────────────────────────     │
│  Buyback scheduled:        12 pcs (this week)          │
│  Returns expected:         45 pcs (this week)          │
│  Supplier delivery:        100 pcs (Jan 28)            │
│                                                         │
│  [Add Stock] [Record Loss] [Generate Report]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Refurbishment Process (Internal)

**Container Lifecycle:**
```
┌──────────────────────────────────────────────────────────────┐
│                    CONTAINER LIFECYCLE                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│   │   NEW   │ ──▶ │ IN USE  │ ──▶ │RETURNED │              │
│   │         │     │         │     │         │              │
│   └─────────┘     └─────────┘     └─────────┘              │
│        │               │               │                    │
│        │               │               ▼                    │
│        │               │         ┌─────────┐               │
│        │               │         │INSPECTION│              │
│        │               │         └─────────┘               │
│        │               │               │                    │
│        │               │    ┌──────────┼──────────┐        │
│        │               │    ▼          ▼          ▼        │
│        │               │ ┌─────┐  ┌────────┐  ┌───────┐   │
│        │               │ │GOOD │  │REPAIRABLE│ │DAMAGED│   │
│        │               │ └─────┘  └────────┘  └───────┘   │
│        │               │    │          │          │        │
│        │               │    ▼          ▼          ▼        │
│        │               │ ┌─────┐  ┌────────┐  ┌───────┐   │
│        │               │ │CLEAN│  │ REPAIR │  │RECYCLE│   │
│        │               │ └─────┘  └────────┘  └───────┘   │
│        │               │    │          │                   │
│        │               │    ▼          ▼                   │
│        │               │    └────┬─────┘                   │
│        │               │         ▼                         │
│        │               │   ┌───────────┐                   │
│        │               └──▶│REFURBISHED│                   │
│        │                   └───────────┘                   │
│        │                         │                         │
│        ▼                         ▼                         │
│   ┌─────────────────────────────────────┐                 │
│   │           READY FOR SALE            │                 │
│   │    (New or Refurbished Stock)       │                 │
│   └─────────────────────────────────────┘                 │
│                                                            │
└──────────────────────────────────────────────────────────────┘
```

**Inspection Checklist:**
```
Container Inspection:
☐ Visual check (cracks, scratches, discoloration)
☐ Smell test (no odors)
☐ Leak test (fill with water, check for drips)
☐ Cap seal check
☐ Handle stability
☐ Grade assignment (A/B/C/Reject)

Grade A → Clean only → Sell as refurbished
Grade B → Minor repair → Sell as refurbished
Grade C → Major repair → Evaluate cost vs. value
Reject → Recycle
```

### Environmental Impact Tracking

**Sustainability Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│  🌱 ENVIRONMENTAL IMPACT                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  This Month:                                            │
│  ─────────────────────────────────────────────────     │
│  Containers refurbished:     145                        │
│  Containers recycled:        23                         │
│  Plastic saved:              580 kg                     │
│  CO2 emissions avoided:      1,200 kg                   │
│                                                         │
│  Lifetime:                                              │
│  ─────────────────────────────────────────────────     │
│  Total containers saved:     4,520                      │
│  Plastic diverted:           18,080 kg                  │
│                                                         │
│  🏆 Eco Badge: Gold Level                               │
│                                                         │
│  [Share Impact] [Get Certificate]                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Database Fields

**Container Commerce Tables:**
```
-- Container Products (for sale)
container_products
- id
- station_id (FK)
- name
- type (new, refurbished)
- container_type (5gal, 10gal, slim)
- price
- wholesale_price
- cost
- stock_quantity
- low_stock_threshold
- description
- warranty_months
- is_active

-- Buyback Requests
buyback_requests
- id
- customer_id (FK)
- station_id (FK)
- container_type
- estimated_quantity
- estimated_condition
- payout_method (cash, credit, discount)
- pickup_or_dropoff
- scheduled_date
- address_id (FK)
- status
- actual_quantity
- actual_condition
- final_payout
- completed_at
- notes

-- Trade-Ins
trade_ins
- id
- customer_id (FK)
- order_id (FK)
- old_container_type
- old_container_condition
- trade_value
- new_container_product_id (FK)
- discount_applied
- final_price

-- Repair Orders
repair_orders
- id
- customer_id (FK)
- station_id (FK)
- container_id (FK, nullable)
- issue_description
- photos_before (JSON)
- pickup_date
- inspection_notes
- repair_types (JSON)
- quoted_price
- approved_at
- repair_status
- repaired_by (staff FK)
- photos_after (JSON)
- completed_at
- final_price
- warranty_until
- delivered_at

-- Container Rentals
container_rentals
- id
- customer_id (FK)
- station_id (FK)
- container_type
- quantity
- monthly_rate
- start_date
- end_date
- status
- next_billing_date
- auto_renew

-- Container Inventory (station stock)
container_inventory
- id
- station_id (FK)
- container_type
- condition (new, refurbished)
- quantity
- reorder_threshold
- last_restock_date
- supplier_id (FK)
```

---

## Database Schema Overview

### Core Tables

```
-- Multi-tenant
stations
station_users (admins, staff)
station_subscriptions (platform billing)
station_verifications

-- Products
products
product_categories
product_price_tiers (bulk pricing)

-- Locations
zones
locations (subdivisions, condos)
location_units (blocks, towers)
customer_addresses

-- Users
customers
customer_levels
customer_badges
drivers

-- Orders
orders
order_items
order_status_history
delivery_assignments

-- Subscriptions
customer_subscriptions
subscription_items

-- Loyalty
loyalty_programs
loyalty_cards
loyalty_rewards
loyalty_transactions

-- Payments
payments
container_deposits
customer_wallets

-- Promotions
promo_codes
promo_usage

-- Notifications
notifications
notification_preferences

-- Applications
station_applications
application_documents

-- Advertising (NEW)
ad_campaigns
ad_creatives (images, videos)
ad_placements
ad_impressions
ad_clicks
ad_budgets

-- Reviews (NEW)
reviews
review_photos
review_responses
review_reports
review_helpful_votes

-- Social (NEW)
station_posts
post_reactions
post_comments
customer_follows (follow stations)
referrals
referral_rewards

-- Gamification (NEW)
badges
customer_badges
achievements
challenges
challenge_progress
leaderboards

-- Discovery (NEW)
search_history
customer_favorites
recently_viewed
recommendations

-- Support (NEW)
support_tickets
ticket_messages
help_articles

-- SMS/Text Ordering (NEW)
sms_messages (incoming/outgoing log)
sms_orders (text order tracking)
product_codes (short codes for SMS)
station_codes (station short codes)
customer_phones (verified phone numbers)
customer_address_codes (HOME, OFFICE, etc.)
sms_subscriptions (opt-in status)
sms_templates (response templates)

-- QR Code System (NEW)
qr_codes (all QR code records)
qr_scans (scan history/analytics)
qr_templates (sticker design templates)
containers (individual container tracking)
container_history (container lifecycle)
driver_qr_codes (driver tip/rating QR)
```

---

## Tech Stack (Using Existing Project)

### Backend (Laravel 12)
- RESTful API with existing service-repository pattern
- Laravel Passport for OAuth2 (multi-guard for customer/admin/driver)
- Spatie Media Library for images/documents
- Spatie Query Builder for filtering
- Laravel Notifications for multi-channel
- Laravel Cashier for subscription billing (optional)

### Frontend (Next.js 16)
- Customer portal
- Station admin dashboard
- Super admin dashboard
- Driver mobile web app (or React Native later)

### Additional Services
- **Maps:** Google Maps API or Mapbox
- **SMS:** Semaphore, Twilio
- **Push:** Firebase Cloud Messaging
- **Payments:** PayMongo, Dragonpay

---

## MVP Phases

### Phase 1: Core System
- [ ] Public landing page
- [ ] Station owner application and approval
- [ ] Station setup (profile, services, zones)
- [ ] Product management (CRUD)
- [ ] Basic zone management
- [ ] Customer registration and login
- [ ] Customer address management (with subdivision/condo)
- [ ] One-time order placement
- [ ] Order management for admin
- [ ] Basic order status updates
- [ ] COD payment only

### Phase 2: Discovery & Orders
- [ ] **Station discovery map** (find nearby stations)
- [ ] **Station public profile page**
- [ ] Station search and filters
- [ ] Subscription orders
- [ ] Bulk orders with tiered pricing
- [ ] Driver management
- [ ] Delivery assignment
- [ ] SMS/Email notifications
- [ ] Customer order tracking

### Phase 3: Engagement & Loyalty
- [ ] **Ratings & reviews system**
- [ ] Loyalty program (stamps/rewards)
- [ ] Customer favorites (save stations)
- [ ] Promo codes and discounts
- [ ] Referral program
- [ ] Basic gamification (badges)
- [ ] E-wallet payments
- [ ] Container deposit system

### Phase 4: Marketing & Ads
- [ ] **Station video upload** (profile videos)
- [ ] **Featured listings** (paid promotion)
- [ ] **Banner advertising**
- [ ] Ad campaign management
- [ ] Station posts/announcements
- [ ] Customer feed (followed stations)
- [ ] Push notifications

### Phase 5: Advanced Features
- [ ] Real-time delivery tracking
- [ ] Map integration for delivery zones
- [ ] Reports and analytics dashboard
- [ ] Driver mobile app
- [ ] Advanced gamification (levels, challenges)
- [ ] Personalized recommendations

### Phase 6: QR Code System
- [ ] **QR code generation** (station, product, promo)
- [ ] **Smart landing pages** (dynamic based on user)
- [ ] QR-based quick reorder
- [ ] QR payment integration
- [ ] QR review/rating flow
- [ ] **Container tracking QR** (individual containers)
- [ ] QR sticker generator for station owners
- [ ] QR analytics dashboard
- [ ] Driver QR for tips/ratings

### Phase 7: SMS & Alternative Channels
- [ ] **SMS ordering system** (text-based orders)
- [ ] Product codes and station codes
- [ ] SMS registration and address management
- [ ] SMS order status updates
- [ ] SMS subscription management
- [ ] SMS gateway integration (Semaphore/Twilio)

### Phase 8: Gallon Commerce
- [ ] **Gallon purchase** (new and refurbished)
- [ ] **Buyback program** (sell old gallons)
- [ ] **Trade-in system** (exchange old for new)
- [ ] **Repair services** (cleaning, cap, handle, cracks)
- [ ] Container rental option
- [ ] Wholesale/bulk container orders
- [ ] Container inventory management
- [ ] Refurbishment tracking
- [ ] Environmental impact dashboard

### Phase 9: Scale & Optimize
- [ ] Auto-delivery assignment
- [ ] Route optimization
- [ ] Customer mobile app (native)
- [ ] API for third-party integrations
- [ ] Advanced analytics & AI insights
- [ ] Multi-language support
- [ ] Quality verification program
- [ ] Messenger/Viber/WhatsApp bots (future)
- [ ] USSD ordering (future, requires telco partnership)

---

## Notes

### Platform Considerations
- All features should respect multi-tenant isolation
- Station data must be completely separate
- Customers can order from multiple stations (marketplace model)
- Consider offline capability for drivers
- Plan for high-volume stations (100+ orders/day)

### Marketplace Dynamics
- Balance between platform fees and station profitability
- Fair ad pricing to not disadvantage small stations
- Review authenticity and manipulation prevention
- Competitive pricing transparency

### Technical Considerations
- Video storage and streaming (CDN recommended)
- Map API costs at scale
- Real-time features (WebSockets for tracking, notifications)
- Search optimization (Elasticsearch/Algolia for discovery)
- Mobile-first responsive design
- Image optimization for product photos

### Monetization Options
| Revenue Stream | Description |
|----------------|-------------|
| Station subscription | Monthly platform fee |
| Transaction commission | % per order (optional) |
| Featured listings | Paid promotion |
| Banner ads | CPM/CPC advertising |
| Video ads | Premium ad placement |
| Premium features | Advanced analytics, API access |

---

*Document created: January 2026*
*Last updated: January 2026*

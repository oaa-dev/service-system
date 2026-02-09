# Flower Store System - Feature Specification

## Overview

A **marketplace platform** connecting flower shops with customers. Florists can register, showcase their arrangements, and manage deliveries. Customers can discover nearby shops, customize bouquets with 3D visualization, send gifts, and order flowers for any occasion.

---

## System Architecture

### Multi-Tenant Structure

```
Platform (SaaS)
  └── Flower Shop (Tenant/Business)
        ├── Owner/Florist
        ├── Staff
        ├── Delivery Personnel
        └── Customers
```

### User Roles

| Role | Description |
|------|-------------|
| **Super Admin** | Platform owner, manages all shops |
| **Shop Owner** | Florist/business owner, full control |
| **Shop Staff** | Limited access (orders, inventory) |
| **Delivery Personnel** | Mobile app for deliveries |
| **Customer** | Orders flowers, sends gifts |

---

## Module 1: Public Pages & Business Registration

### Public Landing Page
- Platform introduction and benefits
- How it works (for customers and florists)
- Pricing plans for shop owners
- Featured florists showcase
- Testimonials/success stories
- Contact and support

### Flower Shop Owner Application

**Application Form:**
- Shop name
- Owner name and contact info
- Shop address
- Business permit/registration number
- Types of services (bouquets, events, weddings)
- Service area coverage
- Portfolio/sample photos
- Years in business
- How did you hear about us?

**Application Flow:**
```
1. Owner fills application form
2. Uploads business documents + portfolio
3. Application status: Pending Review
4. Super Admin reviews and approves/rejects
5. If approved: Owner receives credentials
6. Owner completes shop setup (products, zones)
7. Shop goes live
```

**Shop Subscription Plans:**
| Plan | Features |
|------|----------|
| Basic | Up to 50 products, 1 staff account |
| Pro | Up to 200 products, 5 staff, analytics |
| Enterprise | Unlimited, API access, custom branding |

---

## Module 2: Product Management

### Product Categories

| Category | Examples |
|----------|----------|
| **Bouquets** | Hand-tied, wrapped, presentation |
| **Arrangements** | Vase arrangements, basket arrangements |
| **Box Flowers** | Flower boxes, hat boxes |
| **Single Stems** | Individual roses, sunflowers |
| **Plants** | Potted plants, succulents, orchids |
| **Dried/Preserved** | Dried bouquets, preserved roses |
| **Funeral** | Wreaths, standing sprays, casket flowers |
| **Wedding** | Bridal, bridesmaid, centerpieces |

### Product Fields

```
Product:
- Name
- Description
- Category
- SKU/Code
- Base price
- Images (multiple angles)
- 3D model available (boolean)
- Flowers included (relation)
- Customizable (boolean)
- Size options (small, medium, large)
- Colors available
- Occasions (birthday, anniversary, etc.)
- Seasonal availability
- Preparation time (hours)
- Stock status
- Is featured
- Is active
```

### Flower Inventory

```
Flower Stock:
- Flower type (rose, tulip, lily, etc.)
- Color
- Quantity available
- Cost per stem
- Supplier (FK)
- Batch number
- Received date
- Freshness date (best before)
- Days until expiry
- Status (fresh, selling_fast, expiring, expired)
```

### Add-Ons / Extras

| Add-On | Examples |
|--------|----------|
| **Chocolates** | Ferrero Rocher, local brands, artisan |
| **Stuffed Toys** | Teddy bears, plush toys |
| **Balloons** | Helium balloons, balloon bouquets |
| **Cakes** | Partner bakery cakes |
| **Wine/Champagne** | Where permitted |
| **Greeting Cards** | Printed message cards |
| **Vases** | Glass, ceramic vases |
| **Gift Wrapping** | Premium wrapping upgrade |
| **Candles** | Scented candles |
| **Gift Baskets** | Combination packages |

---

## Module 3: Location & Delivery Zones

### Service Area Hierarchy

```
Service Area (City/Region)
  └── Zone (District/Barangay)
        └── Location Type
              ├── Subdivision
              │     └── Blocks/Phases → Lots
              ├── Condominium
              │     └── Towers → Units
              ├── Commercial Area
              │     └── Buildings → Offices
              └── Landmarks
                    └── Hotels, Hospitals, Churches
```

### Zone Management

**Zone Fields:**
- Zone name
- Parent area
- Polygon coordinates (map boundary)
- Delivery fee
- Minimum order amount
- Available delivery times
- Same-day delivery available
- Express delivery available
- Is active

### Special Delivery Locations

**Pre-configured locations for flower delivery:**
- Hospitals (lobby/reception policies)
- Hotels (concierge contact)
- Churches (wedding/funeral coordinator)
- Funeral homes (direct delivery)
- Corporate offices (reception/security)
- Schools/Universities (admin office)
- Restaurants (for surprise deliveries)

### Customer Address

**Address Fields:**
- Address type (home, office, other)
- Recipient name (can differ from customer)
- Zone (FK)
- Location (FK) - subdivision/condo if applicable
- Unit number
- Floor (for condos/buildings)
- Landmarks
- Delivery instructions
- Contact number (recipient)
- Is default

---

## Module 4: Occasion Management

### Supported Occasions

| Occasion | Peak Period | Special Features |
|----------|-------------|------------------|
| **Valentine's Day** | Feb 1-14 | Surge pricing, advance booking |
| **Mother's Day** | May | Mom-themed arrangements |
| **Birthday** | Year-round | Age balloons, cakes |
| **Anniversary** | Year-round | Romantic themes |
| **Wedding** | Year-round | Consultation required |
| **Graduation** | March-May | Congrats themes |
| **Get Well** | Year-round | Hospital delivery |
| **Sympathy/Funeral** | Year-round | Rush processing |
| **Congratulations** | Year-round | Celebration themes |
| **Thank You** | Year-round | Appreciation cards |
| **New Baby** | Year-round | Pink/blue themes |
| **Just Because** | Year-round | No occasion needed |

### Occasion-Based Features

```
┌─────────────────────────────────────────────────────────┐
│  🎂 SHOP BY OCCASION                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [💝 Valentine's]  [👩 Mother's Day]  [🎂 Birthday]    │
│  [💒 Wedding]      [🎓 Graduation]    [🙏 Sympathy]    │
│  [🎉 Congrats]     [💕 Anniversary]   [🏥 Get Well]    │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  📅 UPCOMING DATES                                      │
│                                                         │
│  ⚠️ Valentine's Day in 5 days - Order now!             │
│  🎂 Mom's birthday in 12 days                          │
│  💕 Your anniversary in 30 days                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Important Date Reminders

**Customer saves important dates:**
```
Important Dates:
- Person name (Mom, Wife, Boss, etc.)
- Relationship
- Date (month/day)
- Occasion type
- Reminder days before (7, 3, 1)
- Last gift sent
- Notes/preferences
```

**Reminder notifications:**
- "Mom's birthday is in 7 days! Order her favorite flowers"
- "Your anniversary is tomorrow - same-day delivery available"

---

## Module 5: Gift & Recipient Features

### Gift Order Structure

```
Gift Order:
├── Sender (Customer placing order)
│     ├── Name
│     ├── Email
│     ├── Phone
│     └── Payment info
│
├── Recipient (Person receiving flowers)
│     ├── Name
│     ├── Phone
│     ├── Delivery address
│     └── Relationship to sender
│
├── Gift Details
│     ├── Products ordered
│     ├── Gift message
│     ├── Card type
│     ├── Anonymous (hide sender)
│     └── Surprise (don't notify recipient)
│
└── Delivery
      ├── Preferred date
      ├── Preferred time
      └── Special instructions
```

### Gift Message Card

```
┌─────────────────────────────────────────────────────────┐
│  💌 ADD YOUR MESSAGE                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Card Style:                                            │
│  [🎂 Birthday] [💝 Love] [🙏 Sympathy] [✨ Elegant]     │
│                                                         │
│  Your Message:                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Happy Birthday Mom! Wishing you all the best   │   │
│  │ on your special day. Love always, Maria ❤️     │   │
│  │                                                 │   │
│  │                                    120/200 chars│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ☐ Send anonymously (hide my name)                     │
│  ☐ Keep it a surprise (don't notify recipient)         │
│                                                         │
│  Preview:                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────┐ │   │
│  │  │  🎂                                       │ │   │
│  │  │                                           │ │   │
│  │  │  Happy Birthday Mom! Wishing you          │ │   │
│  │  │  all the best on your special day.        │ │   │
│  │  │  Love always, Maria ❤️                    │ │   │
│  │  │                                           │ │   │
│  │  └───────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Recipient Address Book

```
┌─────────────────────────────────────────────────────────┐
│  📒 MY RECIPIENTS                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👩 Mom                                         │   │
│  │  Maria Santos                                   │   │
│  │  123 Main St, Makati City                      │   │
│  │  🎂 Birthday: March 15                         │   │
│  │  Last sent: Red roses (Dec 25, 2025)           │   │
│  │  [Send Flowers] [Edit]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💕 Wife                                        │   │
│  │  Ana Dela Cruz                                  │   │
│  │  Unit 15A, Tower 1, BGC                        │   │
│  │  💍 Anniversary: June 20                       │   │
│  │  🎂 Birthday: September 8                      │   │
│  │  [Send Flowers] [Edit]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ Add New Recipient]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Photo Confirmation Service

```
Delivery Photo Confirmation:
1. Driver delivers flowers
2. Takes photo (with recipient or at door)
3. Photo immediately sent to sender
4. "Your flowers were delivered! 📸"

Photo Options:
- With smiling recipient (if they agree)
- Flowers at the door/reception
- Flowers on recipient's desk
- Handed over moment
```

---

## Module 6: 3D Bouquet Visualization & AI Recreation

### Overview

Customer uploads/takes a photo of a bouquet → AI analyzes it → System generates a 3D model that can be customized and ordered.

### Use Cases

| Scenario | Description |
|----------|-------------|
| **"I saw this online"** | Upload Pinterest/Instagram photo |
| **"Recreate this"** | Photo of bouquet received before |
| **"Preview before buying"** | See 3D model before ordering |
| **"See in my space"** | AR preview on table/room |
| **"Customize it"** | Modify the 3D version |

### Photo to 3D Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  📸 PHOTO TO 3D BOUQUET                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Upload or Take Photo                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │     [📷 Take Photo]    [🖼️ Upload Image]               │   │
│  │                                                         │   │
│  │     Supported: JPG, PNG, HEIC                          │   │
│  │     Tip: Clear photo, good lighting                    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  STEP 2: AI Analysis                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔍 Analyzing your bouquet...                          │   │
│  │                                                         │   │
│  │  Detected:                                              │   │
│  │  • 12x Red Roses (98% confidence)                      │   │
│  │  • 6x White Lilies (95% confidence)                    │   │
│  │  • Baby's Breath filler                                │   │
│  │  • Eucalyptus leaves                                   │   │
│  │  • Round arrangement style                             │   │
│  │  • Kraft paper wrapping                                │   │
│  │                                                         │   │
│  │  ⚠️ Peonies detected but out of season                 │   │
│  │     Suggestion: Use Garden Roses instead               │   │
│  │                                                         │   │
│  │  [✓ Looks correct]  [✏️ Edit detection]                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  STEP 3: 3D Model Generated                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │         ┌─────────────────────┐                        │   │
│  │         │                     │                        │   │
│  │         │    🌹 3D MODEL      │   ↻ Rotate             │   │
│  │         │    [Interactive]    │   🔍 Zoom              │   │
│  │         │                     │   📐 360° View         │   │
│  │         └─────────────────────┘                        │   │
│  │                                                         │   │
│  │  Estimated Price: ₱2,450                               │   │
│  │                                                         │   │
│  │  [🎨 Customize]  [📱 View in AR]  [🛒 Order This]      │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3D Customization Studio

```
┌─────────────────────────────────────────────────────────────────┐
│  🎨 CUSTOMIZE YOUR 3D BOUQUET                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐  │
│  │                      │  │  FLOWERS                       │  │
│  │                      │  │  ┌────────────────────────┐    │  │
│  │    [3D PREVIEW]      │  │  │ Roses: 12 → [−] [+]   │    │  │
│  │                      │  │  │ Color: 🔴🩷⚪🟡      │    │  │
│  │    ↻ Drag to rotate  │  │  └────────────────────────┘    │  │
│  │                      │  │  ┌────────────────────────┐    │  │
│  │                      │  │  │ Lilies: 6 → [−] [+]   │    │  │
│  └──────────────────────┘  │  │ Color: ⚪🩷🟡         │    │  │
│                            │  └────────────────────────┘    │  │
│  Price: ₱2,450             │                                │  │
│  (updates in real-time)    │  [+ Add More Flowers]          │  │
│                            │                                │  │
│                            │  FILLERS                       │  │
│                            │  ☑️ Baby's Breath              │  │
│                            │  ☑️ Eucalyptus                 │  │
│                            │  ☐ Ferns                       │  │
│                            │  ☐ Ruscus                      │  │
│                            │                                │  │
│                            │  WRAPPING                      │  │
│                            │  ○ Kraft  ● Satin  ○ Box      │  │
│                            │  Color: [Brown ▼]              │  │
│                            │                                │  │
│                            │  EXTRAS                        │  │
│                            │  ☐ Ribbon (+₱50)              │  │
│                            │  ☐ Gift Card (+₱30)           │  │
│                            │  ☐ Vase (+₱350)               │  │
│                            └────────────────────────────────┘  │
│                                                                 │
│  [📱 View in AR]  [💾 Save Design]  [🛒 Add to Cart - ₱2,450]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AR Preview (Augmented Reality)

```
┌─────────────────────────────────────────────────────────────────┐
│  📱 AR PREVIEW - See it in your space                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │     [CAMERA VIEW OF ROOM]                               │   │
│  │                                                         │   │
│  │              🌹                                         │   │
│  │           [3D Bouquet                                   │   │
│  │            placed on                                    │   │
│  │            detected                                     │   │
│  │            table]                                       │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  • Point camera at flat surface                                │
│  • Tap to place bouquet                                        │
│  • Pinch to resize                                             │
│  • Drag to move                                                │
│                                                                 │
│  Size: [Small] [Medium] [Large]                                │
│                                                                 │
│  [📸 Take AR Photo]  [📤 Share]  [🛒 Order This]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AI Recognition Features

| Feature | Description |
|---------|-------------|
| **Flower Detection** | Identify flower types (roses, tulips, lilies, etc.) |
| **Color Detection** | Detect flower colors, suggest matches |
| **Style Analysis** | Round, cascade, hand-tied, box arrangement |
| **Wrapping Detection** | Paper, fabric, box, basket |
| **Size Estimation** | Small, medium, large based on proportions |
| **Price Estimation** | Estimate cost based on detected flowers |
| **Availability Check** | Flag if detected flowers are out of stock |
| **Alternatives** | "Peonies unavailable, try Garden Roses?" |

### 3D Model Features

| Feature | Description |
|---------|-------------|
| **360° Rotation** | View from all angles |
| **Zoom In/Out** | See details up close |
| **Real-time Editing** | Changes reflect instantly |
| **Lighting Simulation** | See in different lighting |
| **Size Reference** | Show with hand/vase for scale |
| **Export/Share** | Share 3D preview link |

### 3D Flower Asset Library

```
Pre-modeled 3D assets:

FLOWERS (multiple colors each):
- Rose, Tulip, Lily, Sunflower
- Carnation, Orchid, Peony, Hydrangea
- Gerbera, Chrysanthemum, Dahlia
- Ranunculus, Anemone, Calla Lily
- Bird of Paradise, Protea, Anthurium

FILLERS:
- Baby's Breath, Eucalyptus, Ferns
- Ruscus, Wax Flower, Hypericum
- Statice, Limonium, Greenery

WRAPPING:
- Kraft paper (various colors)
- Tissue paper, Cellophane
- Burlap, Satin fabric
- Gift box, Hat box
- Basket, Ceramic vase

ACCESSORIES:
- Ribbons, Bows
- Message cards
- Decorative picks
```

### Technical Implementation

```
Tech Stack:
- Image Recognition: TensorFlow / Google Vision AI / Custom ML
- 3D Rendering: Three.js / Babylon.js (web-based)
- AR: AR.js / 8th Wall / Apple ARKit / Google ARCore
- 3D Assets: Pre-modeled GLB/GLTF flower library
- Real-time Preview: WebGL

API Flow:
1. POST /api/v1/3d-bouquet/analyze (upload image)
2. Returns: detected flowers, colors, style
3. POST /api/v1/3d-bouquet/generate (create 3D scene)
4. Returns: 3D scene config, preview URL
5. PUT /api/v1/3d-bouquet/{id}/customize (modify)
6. POST /api/v1/3d-bouquet/{id}/order (add to cart)
```

### Related 3D Features

**Shop the Look:**
- Curated 3D designs by professional florists
- Trending designs from other customers
- Seasonal 3D collections

**Match My Event:**
```
Upload photo of:
- Dress color (for wedding)
- Venue decoration
- Theme/mood board

AI suggests matching bouquets!
```

**Gift Preview:**
```
Send 3D preview link to recipient:
"Someone special is sending you flowers!
Preview: [3D interactive link]"
(Optional - can keep it a surprise)
```

---

## Module 7: Bouquet Customization Builder

### Build Your Own Bouquet

```
┌─────────────────────────────────────────────────────────────────┐
│  🌸 BUILD YOUR OWN BOUQUET                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Choose Your Flowers                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  🌹 Roses        [Select Color ▼]  Qty: [−] 6 [+]      │   │
│  │     ₱50/stem     🔴🩷⚪🟡🟠💜                          │   │
│  │                                                         │   │
│  │  🌷 Tulips       [Select Color ▼]  Qty: [−] 0 [+]      │   │
│  │     ₱45/stem     🔴🩷⚪🟡💜                            │   │
│  │                                                         │   │
│  │  🌸 Lilies       [Select Color ▼]  Qty: [−] 3 [+]      │   │
│  │     ₱80/stem     ⚪🩷🟠                                 │   │
│  │                                                         │   │
│  │  [+ Browse More Flowers]                               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  STEP 2: Add Fillers (Optional)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ☑️ Baby's Breath (+₱100)                              │   │
│  │  ☑️ Eucalyptus (+₱80)                                  │   │
│  │  ☐ Ferns (+₱60)                                        │   │
│  │  ☐ Ruscus (+₱70)                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  STEP 3: Choose Wrapping                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ Kraft Paper (Free)                                  │   │
│  │  ● Korean Style (+₱100)                                │   │
│  │  ○ Satin Wrap (+₱150)                                  │   │
│  │  ○ Flower Box (+₱300)                                  │   │
│  │                                                         │   │
│  │  Wrap Color: [Pink ▼]                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  STEP 4: Add Extras                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ☐ Ribbon & Bow (+₱50)                                 │   │
│  │  ☑️ Message Card (Free)                                │   │
│  │  ☐ Glass Vase (+₱350)                                  │   │
│  │  ☐ Chocolates (+₱250)                                  │   │
│  │  ☐ Teddy Bear (+₱400)                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│                                                                 │
│  📋 YOUR BOUQUET SUMMARY                                        │
│  6x Red Roses                    ₱300                          │
│  3x White Lilies                 ₱240                          │
│  Baby's Breath                   ₱100                          │
│  Eucalyptus                      ₱80                           │
│  Korean Style Wrap               ₱100                          │
│  Message Card                    Free                          │
│  ───────────────────────────────────────                       │
│  TOTAL                           ₱820                          │
│                                                                 │
│  [👁️ Preview 3D]  [🛒 Add to Cart]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Florist Suggestions

```
💡 Florist Tip: These flowers pair beautifully together!

Your selection: Red Roses + White Lilies
Suggested additions:
• Add Baby's Breath for a classic romantic look
• Add Eucalyptus for a modern, elegant touch
• Consider pink spray roses for more texture

[Apply Suggestion]
```

---

## Module 8: Order Management

### Order Types

| Type | Description |
|------|-------------|
| **Standard** | Regular delivery (next day or scheduled) |
| **Same-Day** | Order before cutoff, deliver today |
| **Express** | 2-hour rush delivery |
| **Scheduled** | Specific date/time (advance booking) |
| **Subscription** | Recurring flower delivery |
| **Event** | Wedding, corporate, large orders |

### Order Flow

```
1. Customer places order
2. Status: Pending Payment
3. Payment confirmed
4. Status: Confirmed
5. Florist prepares arrangement
6. Status: Preparing
7. Ready for delivery/pickup
8. Status: Out for Delivery
9. Delivered
10. Status: Completed
11. Photo sent to sender
12. Customer rates/reviews
```

### Order Statuses

- `pending_payment` - Awaiting payment
- `confirmed` - Payment received, queued
- `preparing` - Florist making arrangement
- `quality_check` - Final inspection
- `ready` - Ready for delivery/pickup
- `out_for_delivery` - With driver
- `delivered` - Successfully delivered
- `completed` - Confirmed by customer
- `cancelled` - Cancelled
- `refunded` - Refund processed

### Order Fields

```
Order:
- Order number (auto-generated)
- Customer (FK) - sender
- Shop (FK)
- Order type
- Recipient name
- Recipient phone
- Delivery address (FK)
- Delivery date
- Delivery time slot
- Items (order_items)
- Custom bouquet config (JSON)
- Gift message
- Card style
- Is anonymous
- Is surprise
- Subtotal
- Delivery fee
- Rush fee (if express)
- Discount amount
- Total amount
- Payment method
- Payment status
- Order status
- Assigned driver (FK)
- Florist notes
- Preparation photos
- Delivery photo
- Rating
- Review
```

### Delivery Time Slots

| Slot | Time | Type |
|------|------|------|
| Morning | 9 AM - 12 PM | Standard |
| Afternoon | 12 PM - 3 PM | Standard |
| Evening | 3 PM - 6 PM | Standard |
| Night | 6 PM - 9 PM | Premium |
| Express | Within 2 hours | Rush |
| Exact Time | Specific hour | Premium |

---

## Module 9: Delivery Management

### Delivery Types

| Type | Timeline | Premium |
|------|----------|---------|
| Standard | Next day | Free (min order) |
| Same-Day | 4-6 hours | +₱100 |
| Express | 2 hours | +₱300 |
| Scheduled | Specific date/time | Free |
| Exact Time | Specific hour | +₱150 |

### Delivery Personnel

**Driver Fields:**
```
Driver:
- Name
- Phone
- Photo
- Vehicle type
- Active zones
- Status (available, on_delivery, offline)
- Current location (GPS)
- Rating
- Completed deliveries
- Special training (wedding, funeral)
```

### Flower Handling Requirements

```
🌸 FLOWER DELIVERY GUIDELINES

Temperature:
- Keep flowers cool (18-22°C)
- Avoid direct sunlight
- Use insulated delivery box

Handling:
- Keep upright at all times
- No stacking heavy items
- Secure to prevent tipping

Time-sensitive:
- Deliver within 2 hours of leaving shop
- Prioritize wilting-prone flowers
- Use water tubes for long distances
```

### Delivery Tracking

```
┌─────────────────────────────────────────────────────────┐
│  📍 TRACK YOUR DELIVERY                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Order #FL-12345                                        │
│  To: Maria Santos, BGC                                  │
│                                                         │
│  ✓ Order confirmed         10:30 AM                    │
│  ✓ Being prepared          11:00 AM                    │
│  ✓ Quality check passed    11:45 AM                    │
│  ✓ Out for delivery        12:00 PM                    │
│  ◉ Arriving soon           12:25 PM                    │
│  ○ Delivered               --                          │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  🚗 Driver: Juan (4.9⭐)                                │
│  📞 Contact driver                                      │
│                                                         │
│  [MAP showing driver location]                          │
│  ETA: 10 minutes                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Photo Confirmation

```
After delivery:
1. Driver takes photo
2. Options:
   - Photo with recipient (with permission)
   - Photo at door/reception
   - Photo of arrangement delivered
3. Photo sent to sender instantly
4. Stored in order history
```

---

## Module 10: Subscription Orders (Flower Clubs)

### Subscription Types

| Plan | Frequency | Description |
|------|-----------|-------------|
| **Weekly Blooms** | Every week | Fresh flowers weekly |
| **Bi-Weekly** | Every 2 weeks | Regular refreshment |
| **Monthly** | Once a month | Monthly surprise |
| **Seasonal** | 4x per year | Seasonal arrangements |

### Subscription Flow

```
┌─────────────────────────────────────────────────────────┐
│  💐 FLOWER SUBSCRIPTION                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Choose Your Plan:                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🌸 PETITE          │  🌺 CLASSIC              │   │
│  │  5-7 stems          │  10-12 stems             │   │
│  │  ₱599/delivery      │  ₱999/delivery           │   │
│  │  [Select]           │  [Select]                │   │
│  ├─────────────────────┼─────────────────────────┤   │
│  │  🌹 LUXE            │  🎨 DESIGNER             │   │
│  │  15-20 stems        │  Florist's choice        │   │
│  │  ₱1,499/delivery    │  ₱1,999/delivery         │   │
│  │  [Select]           │  [Select]                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Frequency: [Weekly ▼]                                  │
│  Preferred Day: [Friday ▼]                             │
│  Delivery Address: [Home - BGC ▼]                      │
│                                                         │
│  Style Preference:                                      │
│  ☐ Bright & Colorful                                   │
│  ☑️ Soft & Romantic                                    │
│  ☐ Modern & Minimal                                    │
│  ☐ Tropical & Exotic                                   │
│  ☐ Surprise me!                                        │
│                                                         │
│  Color Preference:                                      │
│  ☑️ Pinks  ☑️ Whites  ☐ Reds  ☐ Yellows  ☐ Mixed      │
│                                                         │
│  Allergies/Dislikes:                                    │
│  [Lilies (strong scent)________________]               │
│                                                         │
│  [Start Subscription - ₱999/week]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Subscription Management

- **Pause:** Vacation hold
- **Skip:** Skip next delivery
- **Reschedule:** Change delivery day
- **Upgrade/Downgrade:** Change plan
- **Add gift:** Add chocolates, card
- **Change address:** Update delivery location
- **Cancel:** End subscription

### Gift Subscriptions

```
🎁 GIFT A FLOWER SUBSCRIPTION

"Give the gift that keeps blooming!"

Send monthly flowers to someone special.
- Choose duration: 3, 6, or 12 months
- Add a gift message
- Schedule first delivery date
- They receive a surprise every month!

[Gift 3 Months - ₱2,997]
[Gift 6 Months - ₱5,694] SAVE 5%
[Gift 12 Months - ₱10,788] SAVE 10%
```

---

## Module 11: Wedding & Event Services

### Wedding Packages

```
┌─────────────────────────────────────────────────────────┐
│  💒 WEDDING FLOWERS                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PACKAGES                                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💐 INTIMATE PACKAGE                            │   │
│  │  ₱25,000                                        │   │
│  │  • Bridal bouquet                               │   │
│  │  • Groom's boutonniere                          │   │
│  │  • 2 Bridesmaid bouquets                        │   │
│  │  • 2 Groomsmen boutonnieres                     │   │
│  │  • Flower girl basket                           │   │
│  │  [View Details]                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🌸 CLASSIC PACKAGE                             │   │
│  │  ₱60,000                                        │   │
│  │  • Everything in Intimate                       │   │
│  │  • 10 Table centerpieces                        │   │
│  │  • Ceremony arch flowers                        │   │
│  │  • Aisle decorations                            │   │
│  │  • Cake flowers                                 │   │
│  │  [View Details]                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👑 LUXE PACKAGE                                │   │
│  │  ₱120,000+                                      │   │
│  │  • Full venue decoration                        │   │
│  │  • Custom floral installations                  │   │
│  │  • Unlimited consultations                      │   │
│  │  [Request Consultation]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  📅 BOOK A CONSULTATION                                 │
│  Free 30-minute consultation with our wedding florist  │
│  [Book Now]                                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Wedding Consultation Booking

```
Wedding Consultation:
- Couple names
- Wedding date
- Venue
- Estimated guest count
- Budget range
- Style/theme preferences
- Inspiration photos (upload)
- Preferred consultation time
- In-person or video call
```

### Event Types

| Event | Services |
|-------|----------|
| **Wedding** | Full bridal party, venue decoration |
| **Corporate** | Office arrangements, event flowers |
| **Birthday Party** | Centerpieces, balloon combos |
| **Debut/Quinceañera** | Stage flowers, bouquets |
| **Funeral** | Wreaths, sprays, casket flowers |
| **Church Events** | Altar arrangements |
| **Hotel/Restaurant** | Regular arrangements |

### Event Quote Request

```
Event Quote Request:
- Event type
- Date
- Venue/location
- Guest count
- Services needed (checklist)
- Budget range
- Style preferences
- Inspiration images
- Contact info
- Preferred follow-up method
```

---

## Module 12: Sympathy & Funeral Services

### Funeral Products

| Product | Description |
|---------|-------------|
| **Standing Spray** | Large display on easel |
| **Wreath** | Circular tribute |
| **Casket Spray** | Arrangement for casket top |
| **Urn Arrangement** | Surrounds cremation urn |
| **Sympathy Basket** | Basket arrangement |
| **Cross/Heart** | Shaped tributes |
| **Bouquet** | Hand-tied sympathy bouquet |

### Funeral Order Features

```
┌─────────────────────────────────────────────────────────┐
│  🕯️ SYMPATHY & FUNERAL                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Delivery to:                                           │
│  ○ Funeral Home                                        │
│  ○ Church                                              │
│  ○ Residence of family                                 │
│  ○ Cemetery                                            │
│                                                         │
│  Funeral Home: [Search or select ▼]                    │
│  • Heritage Memorial, Taguig                           │
│  • Arlington Memorial, QC                              │
│  • La Funeraria Paz, Manila                           │
│                                                         │
│  Name of Deceased: [________________]                  │
│  Wake Schedule: [Date ▼] [Time ▼]                     │
│                                                         │
│  Ribbon Message (for standing sprays):                 │
│  Line 1: [In Loving Memory_________]                   │
│  Line 2: [The Santos Family________]                   │
│                                                         │
│  ☑️ Rush processing (deliver within 4 hours)           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Partner Funeral Homes

- Pre-registered funeral homes
- Direct delivery contact
- No customer present needed
- Photo confirmation to sender

---

## Module 13: Perishable Inventory Management

### Freshness Tracking

```
┌─────────────────────────────────────────────────────────┐
│  🌡️ INVENTORY FRESHNESS                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️ EXPIRING SOON (Use within 2 days)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Red Roses (Batch #R-0122)                      │   │
│  │  Received: Jan 20 | Best before: Jan 25        │   │
│  │  Qty: 48 stems | Days left: 2                  │   │
│  │  [Create Sale] [Mark as Waste]                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ✓ FRESH (5+ days remaining)                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  White Tulips      120 stems    7 days left    │   │
│  │  Pink Carnations   200 stems    6 days left    │   │
│  │  Sunflowers        45 stems     5 days left    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 WASTE THIS MONTH                                    │
│  Total waste: 85 stems (₱4,250)                        │
│  Waste rate: 3.2% (Target: <5%)                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Batch Management

```
Flower Batch:
- Batch ID
- Flower type
- Color
- Quantity received
- Supplier (FK)
- Received date
- Best before date
- Days to expiry
- Storage location
- Cost per stem
- Current quantity
- Status (fresh, selling, expiring, expired, waste)
```

### Auto-Pricing for Expiring Stock

```
Auto-discount rules:
- 3 days left: 10% off
- 2 days left: 20% off
- 1 day left: 30% off + "Flash Sale" banner

"Expiring Soon" section on website:
"Get these beauties at a discount before they're gone!"
```

### Supplier Management

```
Supplier:
- Name
- Contact
- Flowers supplied
- Lead time (days)
- Minimum order
- Quality rating
- Freshness rating
- Price tier
- Payment terms
```

---

## Module 14: Seasonal Availability

### Seasonal Calendar

```
┌─────────────────────────────────────────────────────────┐
│  🗓️ SEASONAL AVAILABILITY                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  JANUARY - Current                                      │
│                                                         │
│  ✓ AVAILABLE                                           │
│  Roses (all colors)     Carnations                     │
│  Tulips                 Chrysanthemums                 │
│  Lilies                 Orchids                        │
│  Gerberas               Baby's Breath                  │
│                                                         │
│  ⚠️ LIMITED                                            │
│  Sunflowers (imported)  Ranunculus                     │
│  Hydrangeas             Sweet Peas                     │
│                                                         │
│  ✗ OUT OF SEASON                                       │
│  Peonies (May-June)     Dahlias (Aug-Oct)             │
│  Cherry Blossoms (Mar)  Marigolds (Oct-Nov)           │
│                                                         │
│  [🔔 Notify me when Peonies are available]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Pre-Order for Seasonal Flowers

```
🌸 PEONY SEASON PRE-ORDER

Peonies will be available May 1 - June 30!
Pre-order now to secure your blooms.

Limited quantities - first come, first served.

[Pre-Order Peonies - 20% deposit required]
```

---

## Module 15: Flower Care Instructions

### Care Tips Delivery

```
With every delivery:
- Printed care card in arrangement
- QR code → detailed care page
- Push notification reminders

"Time to change the water! Your roses will last longer."
```

### Care Guide Content

```
┌─────────────────────────────────────────────────────────┐
│  🌹 CARE FOR YOUR ROSES                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  DAY 1: When You Receive Them                          │
│  • Trim stems at 45° angle                             │
│  • Remove leaves below waterline                       │
│  • Use room temperature water                          │
│  • Add flower food packet                              │
│                                                         │
│  DAILY CARE:                                            │
│  • Keep away from direct sunlight                      │
│  • Avoid placing near fruits (ethylene gas)            │
│  • Mist petals lightly                                 │
│                                                         │
│  EVERY 2-3 DAYS:                                        │
│  • Change water completely                             │
│  • Re-trim stems by 1 inch                            │
│  • Remove any wilting petals                           │
│                                                         │
│  🎬 [Watch Video Tutorial]                              │
│                                                         │
│  Expected lifespan: 7-14 days with proper care         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Care Reminder Notifications

```
Notification schedule:
- Day 1: "Your flowers arrived! Here's how to make them last"
- Day 3: "Time to change the water! 💧"
- Day 5: "Re-trim stems for longer freshness"
- Day 7: "How are your flowers doing? Rate your experience"
```

---

## Module 16: Loyalty Program

### Petal Points System

```
┌─────────────────────────────────────────────────────────┐
│  🌸 PETAL POINTS                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your Points: 2,450 🌸                                  │
│                                                         │
│  EARN POINTS                                            │
│  • ₱1 spent = 1 point                                  │
│  • Write review = 50 points                            │
│  • Refer friend = 200 points                           │
│  • Birthday order = 2x points                          │
│                                                         │
│  REDEEM                                                 │
│  • 500 points = ₱50 off                               │
│  • 1000 points = Free delivery                        │
│  • 2000 points = Free bouquet upgrade                 │
│  • 5000 points = Free small bouquet                   │
│                                                         │
│  [Redeem Now]                                           │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  🏆 YOUR TIER: Gold Member                              │
│  Benefits: Free delivery, 10% off, early access        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Loyalty Tiers

| Tier | Requirement | Benefits |
|------|-------------|----------|
| **Seed** | 0-999 pts | Base earning |
| **Bud** | 1,000-4,999 pts | 5% bonus points |
| **Bloom** | 5,000-9,999 pts | 10% off, free delivery |
| **Garden** | 10,000+ pts | 15% off, priority delivery, exclusive access |

### Stamp Card Alternative

```
💐 BOUQUET STAMP CARD

Buy 9 bouquets, get the 10th FREE!

[●][●][●][●][●][○][○][○][○][🎁]
 5/10 stamps

4 more to go!
```

---

## Module 17: Ratings & Reviews

### Review Categories

```
Rate your experience:

Overall: ⭐⭐⭐⭐⭐

Flower Quality:    [1][2][3][4][5]
Arrangement:       [1][2][3][4][5]
Delivery:          [1][2][3][4][5]
Value for Money:   [1][2][3][4][5]

"How did the recipient react?"
[😍 Loved it!] [😊 Happy] [😐 It was okay] [😞 Disappointed]

[Upload photo of delivered flowers]
```

### Review Display

```
⭐⭐⭐⭐⭐ "Absolutely stunning!"
By Maria S. | Verified Purchase | Jan 20, 2026

Ordered for my mom's birthday. She was in tears!
The roses were fresh and the arrangement was
exactly like the photo. Driver was also very polite.

📸 [Photo of arrangement]

👍 Helpful (12)

💬 Shop Response:
"Thank you Maria! We're so happy your mom loved
her birthday flowers! 🌹"
```

---

## Module 18: Shop Discovery & Map

### Find Flower Shops

```
┌─────────────────────────────────────────────────────────┐
│  📍 FIND FLOWER SHOPS                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [🔍 Search "roses near BGC"_________________]         │
│                                                         │
│  [MAP VIEW with shop pins]                              │
│  • Shows shops that deliver to your area               │
│  • Pin color = rating (green=4.5+, yellow=4+)          │
│  • Click pin for quick preview                         │
│                                                         │
│  Filter: [Occasion ▼] [Price ▼] [Rating ▼] [Open Now]  │
│                                                         │
│  ⭐ FEATURED                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🌸 Petals & Blooms                             │   │
│  │  ⭐ 4.9 (523 reviews) • 1.5 km                  │   │
│  │  "Best for romantic bouquets"                   │   │
│  │  Starting at ₱499                               │   │
│  │  🚚 Same-day delivery available                 │   │
│  │  [View Shop] [Quick Order]                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  NEARBY SHOPS                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🌺 Flora Express     ⭐ 4.7 (245 reviews)      │   │
│  │  🌹 Rose Garden Co    ⭐ 4.8 (389 reviews)      │   │
│  │  🌷 Tulip House       ⭐ 4.6 (178 reviews)      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Shop Profile Page

```
┌─────────────────────────────────────────────────────────┐
│  [COVER PHOTO / VIDEO]                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🌸 Petals & Blooms                    [♡ Save]        │
│  ⭐ 4.9 (523 reviews)                                  │
│  📍 Bonifacio High Street, BGC                         │
│  🕐 Open 9 AM - 8 PM                                   │
│                                                         │
│  "Artisan floral studio specializing in romantic       │
│   and modern arrangements since 2015."                 │
│                                                         │
│  ✓ Same-day delivery  ✓ Custom orders  ✓ Weddings     │
│                                                         │
│  [📍 Delivers to your area]                            │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  🏆 BEST SELLERS                                        │
│  [Product cards with images and prices]                │
│                                                         │
│  📸 GALLERY                                             │
│  [Grid of arrangement photos]                          │
│                                                         │
│  💬 REVIEWS                                             │
│  [Recent reviews with photos]                          │
│                                                         │
│  [Browse Full Menu]  [Contact Shop]                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Module 19: Advertising & Promotions

### Ad Types for Florists

| Ad Type | Placement | Description |
|---------|-----------|-------------|
| **Featured Listing** | Discovery page | Top placement in search |
| **Banner Ad** | Home page | Image/video banner |
| **Video Ad** | Shop profile, discovery | Promotional video |
| **Sponsored Product** | Category pages | Promoted arrangement |
| **Occasion Spotlight** | Occasion pages | Featured for Valentine's, etc. |

### Promotional Tools

```
Shop Promotions:
- Discount codes
- Free delivery threshold
- Bundle deals
- Flash sales (expiring inventory)
- First-order discount
- Referral rewards
- Seasonal campaigns
```

---

## Module 20: SMS/Text Ordering

### SMS Commands

| Command | Format | Example |
|---------|--------|---------|
| **ORDER** | `ORDER [shop] [product] [recipient]` | `ORDER PNB ROSES12 MOM` |
| **REORDER** | `REORDER` | Repeat last order |
| **STATUS** | `STATUS [order#]` | `STATUS 12345` |
| **CATALOG** | `CATALOG [shop]` | `CATALOG PNB` |
| **HELP** | `HELP` | List commands |

### Product Codes

```
Shop defines short codes:
- ROSES12 = 12 Red Roses
- ROSES24 = 24 Red Roses
- MIXED1 = Mixed bouquet small
- TULIP6 = 6 Tulips
- SUNFLR = Sunflower arrangement
```

### Recipient Codes

```
Customer saves recipients:
- MOM = Mom's address
- WIFE = Wife's address
- OFFICE = Office address

Order: "ORDER PNB ROSES12 WIFE"
→ Orders 12 roses from Petals & Blooms
→ Delivers to saved "Wife" address
```

---

## Module 21: QR Code System

### QR Placements

| Placement | Purpose |
|-----------|---------|
| **On Arrangement** | Reorder same flowers |
| **On Card** | Digital message, AR experience |
| **On Receipt** | Pay, review, reorder |
| **On Shop Materials** | New customer acquisition |
| **On Delivery Vehicle** | Advertising |

### QR Features

```
Customer scans QR on delivered arrangement:

┌─────────────────────────────────────────┐
│  🌹 Your Flowers from Petals & Blooms   │
│                                         │
│  [🔄 Reorder Same Arrangement]          │
│  [📖 Care Instructions]                 │
│  [⭐ Rate & Review]                     │
│  [💌 Read Your Message]                 │
│  [📸 View in AR]                        │
│                                         │
│  These flowers were arranged by:        │
│  Rosa, Senior Florist                   │
│                                         │
└─────────────────────────────────────────┘
```

### AR Message Experience

```
Recipient scans QR on card:
→ Opens AR camera
→ Points at flowers
→ Virtual butterflies appear
→ Sender's video message plays
→ "Happy Birthday Mom! I love you!"
```

---

## Module 22: Corporate Accounts

### B2B Features

```
┌─────────────────────────────────────────────────────────┐
│  🏢 CORPORATE ACCOUNTS                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SERVICES                                               │
│  • Weekly office arrangements                          │
│  • Reception/lobby flowers                             │
│  • Employee milestone flowers (birthday, anniversary)  │
│  • Client gift flowers                                 │
│  • Event/meeting decorations                           │
│  • Holiday decorations                                 │
│                                                         │
│  BENEFITS                                               │
│  • Monthly invoicing (NET 30)                          │
│  • Dedicated account manager                           │
│  • Volume discounts                                    │
│  • Multiple delivery locations                         │
│  • Admin dashboard for approvals                       │
│  • Expense reporting integration                       │
│                                                         │
│  [Apply for Corporate Account]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Corporate Order Flow

```
1. Admin places order (or employee requests)
2. Requires approval if over budget
3. Invoice added to monthly statement
4. Finance receives consolidated invoice
5. NET 30 payment terms
```

---

## Module 23: Notifications

### Notification Types

**For Customers:**
- Order confirmation
- Preparation started (with photo)
- Out for delivery
- Delivered (with photo)
- Recipient reactions
- Care reminders
- Important date reminders
- Promotional offers
- Loyalty rewards

**For Shop Owners:**
- New order received
- Low stock alert
- Expiring inventory alert
- Review received
- Consultation request
- Payment received

---

## Module 24: Reports & Analytics

### Shop Owner Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  📊 DASHBOARD - January 2026                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TODAY           THIS WEEK        THIS MONTH           │
│  ₱15,200         ₱98,500          ₱385,000            │
│  12 orders       78 orders        312 orders           │
│                                                         │
│  📈 [Revenue Chart]                                     │
│                                                         │
│  TOP PRODUCTS              OCCASIONS                   │
│  1. 12 Red Roses (45)     Valentine's: 45%            │
│  2. Mixed Bouquet (38)    Birthday: 25%               │
│  3. Sunflower Box (22)    Anniversary: 15%            │
│                                                         │
│  INVENTORY ALERTS                                       │
│  ⚠️ Red Roses: 48 stems (low)                          │
│  ⚠️ Tulips: expiring in 2 days                         │
│                                                         │
│  CUSTOMER INSIGHTS                                      │
│  New customers: 45                                      │
│  Repeat rate: 38%                                       │
│  Avg rating: 4.8⭐                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Module 25: Payment Management

### Payment Methods

| Method | Description |
|--------|-------------|
| **Credit/Debit Card** | Via payment gateway |
| **E-Wallet** | GCash, Maya, GrabPay |
| **Bank Transfer** | Direct transfer |
| **PayPal** | International orders |
| **COD** | Cash on delivery (limited) |
| **Corporate Invoice** | NET 30 for B2B |

### Payment Features

- Secure payment processing
- Split payment (partial now, rest on delivery)
- Subscription auto-billing
- Refund processing
- Corporate invoicing

---

## Module 26: Gamification

### Badges

| Badge | Criteria |
|-------|----------|
| 🌱 First Bloom | First order |
| 💐 Bouquet Lover | 10 orders |
| 🌹 Rose Enthusiast | 5 rose orders |
| 💝 Gift Giver | Send to 5 different people |
| 🎂 Celebration Pro | Order for 5 different occasions |
| 💒 Wedding Planner | Book wedding package |
| 📸 Photo Star | Share 10 delivery photos |
| ⭐ Top Reviewer | Write 10 reviews |
| 🌸 Subscription Star | 6 months subscribed |

### Challenges

```
Weekly Challenge:
"Send flowers to someone new this week"
Reward: 100 bonus points

Valentine's Challenge:
"Order before Feb 10 for early bird discount"
Reward: 15% off + 200 points
```

---

## Module 27: Customer Support

### Support Features

- In-app chat
- FAQ / Help center
- Order issue reporting
- Refund requests
- Florist contact
- Emergency support (same-day issues)

### Common Issues

- Wrong arrangement delivered
- Flowers arrived damaged
- Delivery delay
- Recipient not home
- Wrong address
- Quality complaint

---

## Database Schema Overview

### Core Tables

```
-- Multi-tenant
shops
shop_users
shop_subscriptions

-- Products
products
product_categories
product_images
flower_types
flowers_in_products
add_ons

-- Inventory
flower_batches
supplier
inventory_alerts

-- Locations
zones
locations
customer_addresses
recipient_addresses

-- Occasions
occasions
important_dates
occasion_reminders

-- Orders
orders
order_items
order_customizations
gift_messages
delivery_photos

-- Subscriptions
flower_subscriptions
subscription_deliveries

-- Weddings/Events
consultations
event_quotes
event_bookings

-- 3D/AR
bouquet_3d_designs
flower_3d_assets
ar_experiences

-- Customers
customers
recipient_address_book
customer_occasions

-- Loyalty
loyalty_points
loyalty_tiers
loyalty_redemptions

-- Reviews
reviews
review_photos

-- Discovery
shop_profiles
featured_listings

-- Advertising
ad_campaigns
ad_creatives

-- SMS
sms_messages
product_codes
recipient_codes

-- QR Codes
qr_codes
qr_scans

-- Corporate
corporate_accounts
corporate_orders
invoices

-- Notifications
notifications

-- Support
support_tickets
```

---

## Tech Stack

### Backend (Laravel 12)
- RESTful API
- Laravel Passport (OAuth2)
- Spatie Media Library (images)
- Laravel Notifications
- Queue system for processing

### Frontend (Next.js 16)
- Customer portal
- Shop admin dashboard
- Super admin dashboard

### 3D/AR
- Three.js (3D rendering)
- TensorFlow.js (flower recognition)
- AR.js / 8th Wall (augmented reality)

### Services
- Google Maps API / Mapbox
- Payment gateway (PayMongo)
- SMS gateway (Semaphore)
- Push notifications (Firebase)
- Image CDN (Cloudinary)

---

## MVP Phases

### Phase 1: Core System
- [ ] Public landing page
- [ ] Shop owner application
- [ ] Shop setup (profile, products)
- [ ] Basic product catalog
- [ ] Zone management
- [ ] Customer registration
- [ ] Basic order placement
- [ ] Order management
- [ ] Basic delivery tracking

### Phase 2: Gift & Occasions
- [ ] Gift order (sender/recipient)
- [ ] Gift message cards
- [ ] Recipient address book
- [ ] Occasion categories
- [ ] Important date reminders
- [ ] Photo confirmation

### Phase 3: Discovery & Reviews
- [ ] Shop discovery map
- [ ] Shop profiles
- [ ] Search and filters
- [ ] Ratings & reviews
- [ ] Loyalty program (points)

### Phase 4: Customization
- [ ] Build your own bouquet
- [ ] Add-ons management
- [ ] **3D bouquet preview**
- [ ] **AI photo recognition**
- [ ] **AR preview**

### Phase 5: Subscriptions & Events
- [ ] Flower subscriptions
- [ ] Wedding packages
- [ ] Event quotes
- [ ] Corporate accounts

### Phase 6: Advanced Features
- [ ] Advertising system
- [ ] SMS ordering
- [ ] QR codes
- [ ] Perishable inventory
- [ ] Seasonal availability

### Phase 7: Scale & Optimize
- [ ] Advanced analytics
- [ ] Gamification
- [ ] Multi-language
- [ ] Mobile apps

---

## Notes

### Flower-Specific Considerations
- Perishable inventory requires FIFO
- Freshness is critical for reviews
- Same-day delivery is expected
- Visual appeal drives sales
- Seasonal availability affects catalog
- Temperature control in delivery

### Peak Periods
- Valentine's Day (Feb 14)
- Mother's Day (May)
- Christmas season
- All Saints' Day (Nov 1)

### Platform Success Metrics
- Order volume
- Repeat customer rate
- Average order value
- Delivery success rate
- Customer satisfaction
- Shop retention

---

*Document created: January 2026*
*Last updated: January 2026*

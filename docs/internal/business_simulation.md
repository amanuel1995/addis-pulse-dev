That is a brilliant product pivot. You are completely right—routing leads to *our* dev/ops team is just noise. The real value is handing that real-time dopamine hit directly to the **advertiser's sales team**. Allowing the client to configure their own Telegram group (e.g., "Noah Real Estate Sales Team") where leads stream in instantly makes the product incredibly sticky.

Let’s back up and run a full, end-to-end simulation of how the AddisPulse ecosystem works in the real world, incorporating this new client-side notification feature. 

---

### Phase 1: The Setup (Before the Ride)
1. **The Campaign is Sold:** You (AddisPulse) close a deal with "Noah Real Estate" for a 15-day campaign.
2. **Configuration:** You log into the AddisPulse Admin Dashboard. You create the campaign, upload Noah’s branding, set the reward (e.g., "Free Water + Brochure"), and assign 50 drivers to this campaign.
3. **Client Portal Access:** You hand Noah Real Estate a login to their **Advertiser Portal**. Inside, their Marketing Manager navigates to the *Notifications* tab and links a Telegram group (`@NoahSalesTeam`) and chooses "Streaming (Instant)" alerts.
4. **Driver Check-in:** It’s 7:00 AM. A driver opens the AddisPulse Driver Telegram Bot, sends `/checkin`, and uploads a photo showing the clean backseat with the Noah Real Estate QR card and water bottles in place. The system logs them as compliant for the day.

### Phase 2: The Passenger Experience (The Ride)
1. **The Hail:** A passenger (let's call her Sara) hails a Ride/Feres and gets into the vehicle.
2. **The Hook:** She sits in the back and sees a premium, branded card in the seat organizer: *"Looking for a new apartment? Scan here for a free brochure from Noah Real Estate, and please enjoy this complimentary water on us."*
3. **The Scan:** Intrigued (and sipping the water), Sara opens her phone camera and scans the permanent QR code.
4. **The Routing:** The QR URL (`addispulse.com/d/driver-token-123`) hits our Next.js server. Our backend instantly checks the database: *"Which campaign is Driver 123 currently assigned to?"* It resolves to the Noah Real Estate campaign and loads a beautiful, bilingual, mobile-first landing page.

### Phase 3: The Capture & Verification
1. **The Form:** Sara reads the short pitch on the landing page and fills out the form: Name (*Sara*), Phone (*0911223344*), and selects an interest (*2-Bedroom Apartment*).
2. **The Submission:** She hits submit. Our backend hashes her IP and device fingerprint to ensure she hasn't spammed the form, then triggers the Africa's Talking API.
3. **The OTP:** Sara receives an SMS: *"Your AddisPulse verification code is 492015."* She types this into the web page.
4. **The Success:** The database updates her lead status from `pending` to `otp_verified`. Sara sees a "Thank You" screen with a link to download the Noah Real Estate brochure.

### Phase 4: The Delivery & The Aftermath (The Value)
1. **The Instant Alert:** Because Noah Real Estate configured streaming alerts, the exact second Sara verifies her OTP, our system fires a message to the `@NoahSalesTeam` Telegram group: 
   > 🚨 **New Verified Lead!** 
   > **Name:** Sara 
   > **Phone:** +251 911 223344 
   > **Interest:** 2-Bedroom 
   > *Call her while she's still in the taxi!*
2. **The Follow-up:** A Noah sales rep calls Sara 5 minutes later, while she's still in the car, and books a site visit. 
3. **The Dashboard:** At the end of the week, Noah's Marketing Manager logs into the **Advertiser Portal**. They see a dashboard proving ROI:
   - 450 QR Scans
   - 120 Verified Leads (Cost Per Lead: 350 ETB)
   - Lead Pipeline (They can mark Sara as "Appointment Set")
4. **The Driver Reward:** On Friday, our system calculates the leaderboard. The driver who drove Sara got 45 verified leads this week. Because they passed all daily photo check-ins and hit the target, they automatically get their base pay + a performance bonus.

---

### What this means for our tech plan
By shifting the notification logic from "internal ops" to "client portal", we make the platform a true B2B SaaS. 

We will need to update **Milestone 4 (Client Value)** in our plan to include a `Notification Preferences` UI in the Advertiser Dashboard, allowing clients to configure:
- **Destination:** Telegram Group ID, Email, or both.
- **Frequency:** Instant (Streaming) or Daily Digest (Batched).


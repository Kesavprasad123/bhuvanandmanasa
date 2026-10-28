# 💍 Bhuvan & Manasa — Wedding Invitation

A beautiful and interactive digital wedding invitation website created for **Bhuvan & Manasa**.

## ✨ Features

* 🕉️ Traditional wedding-themed design
* 🪔 Lord Ganesha blessing section
* 💌 Interactive scratch & reveal date
* ⏳ Wedding countdown timer
* 💑 Bride & Groom details
* 📍 Wedding venue information
* 📱 Fully responsive for mobile, tablet, and desktop
* 🌸 Elegant animations and decorative elements
* 🎨 Traditional Indian wedding-inspired design

## 🛠️ Technologies Used

* HTML5
* CSS3
* JavaScript
* Google Fonts

## 📱 Responsive Design

The website is designed to provide a smooth experience across:

* 📱 Mobile phones
* 💻 Laptops
* 🖥️ Desktop screens
* 📲 Tablets


## 💑 Couple

**Bhuvan & Manasa**


The expected addresses are:

* `https://bhuvanmanasa.in`
* `https://www.bhuvanmanasa.in`

## 🛏️ Accommodation page & host room booking

`/accommodation` shows the two wedding stays (Krishna Inn, SVPC) with live
room counts — total / booked / available — plus a public room-availability
list. Guest names and check-in/check-out dates are **never** part of the
website bundle; they live in Supabase and are reachable only through the
host dashboard after a server-verified four-digit login.

One-time setup (details in `.env.example`):

1. Create a free [Supabase](https://supabase.com) project.
2. Run `supabase/setup.sql` in the SQL Editor — replace `__REPLACE_ME__` with
   your four-digit host access code first (only its hash is stored).
3. Run `supabase/seed-bookings.sql` to import the existing allocations.
4. Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env.local` for
   local dev, and as GitHub Actions variables for production.

## 📄 License

This project is created as a personal wedding invitation website.

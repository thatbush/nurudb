Nuru is a Kenyan student and alumni network that combines social features, verified data, and live academic tools like timetables into one platform for campuses.

## What Nuru Is

Nuru is Kenya’s student and alumni network and knowledge base, built to help students make smarter choices about universities, courses, and campus life.  It connects students, alumni, and institutions in one place, focusing on verified information instead of chaotic, ad-filled social feeds.

## Core Concept

The platform combines a social layer (chat, public and private spaces, random 1:1 pairing) with a verified data layer (alumni insights, institution and programme facts, and student-contributed corrections).  Nuru aims to replace static PDFs and outdated government portals with a living, crowdsourced knowledge base driven by real students and graduates.

## Key Features

- Student and alumni profiles, institution and course spaces, and public conversation rooms for each campus or programme.
- Random 1:1 chats and topic-based rooms, with planned LLM-assisted moderation to keep conversations safe.
- Banana Verdict voting: students can vote on whether specific facts about their university or programme are accurate, turning messy data into trusted records.
- No ads, with a clean interface focused on learning, campus life, and verified guidance rather than distraction.
- Timetable tools that let schools expose semester and exam schedules through CSV/Sheets so students always see up-to-date timetables inside Nuru.

## Architecture Overview

Nuru is built primarily on modern web technologies, using Next.js for the frontend and app shell, with managed Postgres (Supabase historically, and Neon for the new canonical database) for data and auth.  Institution and timetable data can be synced from external systems and spreadsheets (e.g., Google Sheets, CSV backed by Cloudflare R2), while verification and “banana verdict” flows curate a clean, trusted dataset over time.

## Roadmap

Early versions focus on one university (such as MKU) as an MVP, validating the social features, timetable flows, and alumni knowledge base before expanding.  Future iterations include deeper verification, ride/logistics integrations for students, richer analytics for institutions, and a sustainable paid layer for advanced tools while keeping core student access free and ad‑free.

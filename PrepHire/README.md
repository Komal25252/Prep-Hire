# PrepHire - AI-Assisted Interview Preparation System

A comprehensive web-based platform for interview preparation with AI-powered feedback and analytics.

## 🎯 Project Overview

PrepHire is an AI-assisted interview preparation system that helps candidates practice interviews based on their resume or selected job domain. The platform provides real-time feedback, performance analytics, and actionable suggestions to improve interview performance.

## ✨ Features

- **Resume-Based Practice**: Upload your resume to generate personalized interview questions
- **Domain Selection**: Choose from 8+ job domains (Frontend, Backend, Data Science, etc.)
- **Difficulty Levels**: Practice with Easy, Moderate, or Hard questions
- **Interactive Sessions**: Simulated interview environment with text/speech recording
- **AI-Powered Analysis**:
  - Keyword matching
  - Grammar checking
  - Filler word detection
  - Confidence scoring
- **Progress Tracking**: Dashboard with performance metrics and trend analysis
- **Detailed Feedback**: Question-by-question breakdown with improvement suggestions

## 🏗️ Project Structure

```
app/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Home/Landing page
│   │   ├── layout.tsx           # Root layout with metadata
│   │   ├── prepare/             # Interview setup page
│   │   │   └── page.tsx         # Resume upload & domain selection
│   │   ├── interview/           # Active interview session
│   │   │   └── page.tsx         # Question display & recording
│   │   ├── results/             # Post-interview feedback
│   │   │   └── page.tsx         # Detailed analysis & suggestions
│   │   ├── dashboard/           # Progress analytics
│   │   │   └── page.tsx         # Session history & charts
│   │   └── profile/             # User profile management
│   │       └── page.tsx         # Personal & professional info
│   └── components/              # Reusable React components
│       └── Navigation.tsx       # Global navigation bar
└── public/                      # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📱 Pages Overview

### 1. Home Page (`/`)
- Landing page with feature highlights
- Call-to-action buttons
- Feature cards explaining the platform benefits

### 2. Prepare Page (`/prepare`)
- **Step 1**: Resume upload OR domain selection
- **Step 2**: Difficulty level selection (Easy/Moderate/Hard)
- Session configuration preview

### 3. Interview Page (`/interview`)
- Question display with category tags
- Recording controls (Start/Stop/Pause)
- Progress bar showing completion percentage
- Skip functionality
- Response capture and storage

### 4. Results Page (`/results`)
- Overall performance score (0-100)
- Grammar score, filler words count, confidence rating
- Question-by-question breakdown:
  - Individual scores
  - Keyword detection
  - Grammar analysis
  - Improvement suggestions
- Downloadable report
- Action buttons (Practice Again, View Dashboard)

### 5. Dashboard Page (`/dashboard`)
- **Statistics Cards**:
  - Total sessions completed
  - Average score
  - Highest score
  - Current streak
- **Charts**:
  - Score trend over time
  - Practice distribution by domain
- **Session History**: Detailed table with all past sessions

### 6. Profile Page (`/profile`)
- Personal information management
- Professional details (current role, target role)
- Skills display
- Interview preferences (notifications, reports)
- Account actions (data export, account deletion)

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)
- **Build Tool**: Turbopack

## 🔧 Key Technologies

- **Next.js App Router**: File-based routing, server components
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first styling with custom gradients
- **Lucide Icons**: Consistent, customizable icon library
- **Responsive Design**: Mobile-first approach with responsive grids

## 📊 Component Design Patterns

### Client Components
All interactive pages use `'use client'` directive for:
- State management (useState)
- User interactions (onClick, onChange)
- Side effects (useEffect)
- Browser APIs (sessionStorage, localStorage)

### Styling Convention
- Gradient backgrounds for hero sections
- Card-based layouts with shadows
- Color-coded feedback (green=positive, yellow=neutral, red=needs improvement)
- Consistent spacing using Tailwind utilities

## 🔄 Data Flow (Frontend Only)

1. **Prepare Page**: Stores selection in sessionStorage
2. **Interview Page**: Simulates question flow and response recording
3. **Results Page**: Displays mock feedback data
4. **Dashboard Page**: Shows sample analytics and history

> **Note**: Current implementation uses mock data. Backend integration points are identified for future API connections.

## 🚧 Future Backend Integration Points

- `/api/upload-resume` - Resume parsing and skill extraction
- `/api/questions` - Dynamic question generation based on domain/resume
- `/api/record-response` - Audio/text response processing
- `/api/evaluate` - AI-powered response analysis
- `/api/sessions` - Session management and history
- `/api/user` - User profile CRUD operations

## 📝 Environment Variables (Future)

```env
NEXT_PUBLIC_API_URL=
OPENAI_API_KEY=
DATABASE_URL=
```

## 🎯 User Journey

1. **Landing** → View features and benefits
2. **Prepare** → Upload resume OR select domain + difficulty
3. **Interview** → Answer 5 questions with recording
4. **Results** → Review detailed feedback and scores
5. **Dashboard** → Track progress over multiple sessions
6. **Profile** → Manage personal information and preferences

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

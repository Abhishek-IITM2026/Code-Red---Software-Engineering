# School Management System - Frontend

A modern, responsive React-based frontend for a comprehensive school management system with role-based authentication, theming, and customization options.

## Features

- **Role-based Access**: Separate portals for Students, Faculty, Parents, and Administrators
- **Theme System**: 6 built-in themes (Light, Dark, Ocean, Professional, Modern, Classic)
- **Customization**: Personalize border radius, shadows, card backgrounds, and more
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Modern Stack**: Built with React 19, TypeScript, Redux Toolkit, and Tailwind CSS

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| Redux Toolkit | 2.11.2 | State Management |
| Tailwind CSS | 4.2.1 | Styling |
| React Router DOM | 7.13.1 | Routing |
| React Icons | 5.6.0 | Icon Library |
| Vite | 7.3.1 | Build Tool |

## Prerequisites

- Node.js 18+ 
- npm 9+

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

## Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
VITE_APP_NAME=CIOM
VITE_APP_LOGO=C
VITE_APP_TAGLINE=Empowering Education
```

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_APP_NAME | Application name displayed in header | CodeRed |
| VITE_APP_LOGO | Logo character/letter | C |
| VITE_APP_TAGLINE | Tagline displayed below logo | (empty) |

## Demo Credentials

Use these credentials to test different portals:

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | password |
| Faculty | faculty@demo.com | password |
| Parent | parent@demo.com | password |
| Admin | admin@demo.com | password |

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Redux store and routing
│   ├── components/         # Reusable UI components
│   │   └── common/         # Common components
│   ├── features/           # Feature-based modules
│   │   ├── auth/           # Authentication
│   │   ├── student/        # Student portal
│   │   ├── faculty/        # Faculty portal
│   │   ├── parent/         # Parent portal
│   │   ├── administration/ # Admin portal
│   │   └── Home/           # Landing page
│   ├── theme/              # Theme system
│   └── services/           # API services
├── public/                 # Static assets
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Customization

### Theme System

The app includes 6 pre-built themes:
- **Light** - Clean white/gray design
- **Dark** - Dark mode with slate tones
- **Ocean** - Blue/teal color scheme
- **Professional** - Conservative business look
- **Modern** - Purple/violet accent colors
- **Classic** - Warm amber/brown tones

### Appearance Settings

In the Preferences panel, users can customize:
- Card border radius (0px to Pill shape)
- Button border radius
- Input border radius
- Container padding
- Shadow intensity (None, Light, Medium, Heavy)
- Card background color

All settings are persisted in localStorage.

## Available Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start development server |
| npm run build | Build for production |
| npm run preview | Preview production build |
| npm run lint | Run ESLint |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## API Integration

The frontend uses RTK Query for API calls. To connect to a backend:

1. Update API base URLs in src/services/api/
2. Configure authentication endpoints in src/features/auth/
3. Set up proper CORS settings on your backend

## License

This project is for educational/demonstration purposes.

## Support

For issues or questions, please refer to the project documentation or contact the development team.

# Google Play Store Analytics Dashboard

An interactive data visualization and analytics dashboard built with React, Vite, Tailwind CSS, and Recharts. This application processes and visualizes the Google Play Store dataset to extract meaningful insights about app ratings, reviews, installations, and categories.

## Features

- **Overview**: High-level metrics and KPIs of the app ecosystem.
- **Distributions**: Visual layout of app ratings, reviews, and categories.
- **Correlation**: Scatter plots showing relationships (e.g., Reviews vs. Installs).
- **Regression**: Trendlines modeling app performance.
- **Outliers**: Detection and highlighting of anomalous apps.
- **Segmentation**: Categorizing apps by content rating and type (Free vs. Paid).
- **Hypothesis**: Visualizations for statistical hypothesis testing.
- **A/B**: Performance comparison models.
- **Composite**: Multi-metric analysis and tailored insights.

## Tech Stack

- **Framework**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Project Structure

```text
├── public/
│   └── googleplaystore.csv  # The dataset loaded by the app
├── src/
│   ├── App.jsx              # Main dashboard component and logic
│   ├── index.css            # Global styles and Tailwind imports
│   └── main.jsx             # Application entry point
├── package.json             # NPM dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.js           # Vite bundle configuration
```

## Getting Started

Follow these steps to run the project locally.

1. **Clone the repository** (or download the files):
   ```bash
   # git clone <your-repo-url>
   # cd <your-project-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:5173`. 

## Build for Production

To compile an optimized build for deployment (e.g., to GitHub Pages, Vercel, or Netlify):
```bash
npm run build
```
This will generate a `dist` folder containing the production-ready static files.

## Dataset Information

The application fetches `googleplaystore.csv` from the `public/` directory at runtime. If the dataset is present, it will compute analytics over the real app store data. If it is missing or fails to load, the dashboard will gracefully fall back to a small set of mock data to demonstrate functionality.

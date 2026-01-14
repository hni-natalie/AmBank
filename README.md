# AmBank Investment Analysis System

## Problem Statement

Financial analysts and relationship managers face significant challenges in manually reviewing large volumes of regulatory filings, financial statements, and market news to identify investment opportunities and risks. The current process involves:

- **Time-consuming manual analysis**: Analysts must manually extract and compare financial data across multiple companies and sectors, which is slow and resource-intensive.
- **Fragmented information sources**: Financial data is scattered across various platforms including KLSE Screener, annual reports, and news feeds, making comprehensive analysis difficult.
- **Inconsistent evaluation criteria**: Without standardized frameworks, different analysts may arrive at different conclusions for the same company.
- **Limited peer comparison**: Understanding a company's performance relative to sector peers requires significant manual effort and domain expertise.
- **Delayed market insights**: By the time manual analysis is complete, market conditions may have already changed, reducing the value of insights.

This project addresses these challenges by providing an automated, AI-powered investment analysis platform that streamlines data collection, standardizes evaluation, and delivers actionable insights in real-time.

## Solution

The AmBank Investment Analysis System is a comprehensive web-based platform that automates financial analysis and investment decision-making for Bursa Malaysia listed companies. The solution combines multiple intelligent agents, real-time data extraction, and AI-powered analysis to deliver actionable investment insights.

**How It Works:**

The system operates through several integrated modules working in concert:

1. **Intelligent Company Search**: Users enter a company name or ticker symbol, and the system automatically searches KLSE Screener to identify the company and extract comprehensive financial data including 5 years of historical performance (revenue, net profit, EPS, dividend payout, net margin, PE ratio, and ROE).

2. **Automated Sector Peer Analysis**: Upon identifying a company, the system automatically retrieves all companies in the same sector and randomly selects two peers for comparison. Financial metrics are visualized through interactive charts showing revenue growth rates, PE ratios, ROE, net margins, EPS trends, and dividend payouts across a 5-year period (2021-2025). Each company is color-coded (red, blue, green) for easy visual comparison.

3. **RAG-Powered Market Intelligence**: The system employs a sophisticated Retrieval-Augmented Generation (RAG) architecture that continuously monitors and analyzes news from trusted Malaysian financial sources (The Edge Malaysia, The Star, Asian Power Malaysia). It maintains separate macro (market-wide) and micro (company-specific) analysis agents that extract positive signals, adverse signals, and trend patterns from news articles.

4. **Investment Dashboard**: A unified dashboard presents both macro-economic indicators and micro company-specific signals, with weighted confidence scores (40% macro, 60% micro) to determine overall investment stance. Users can drill down into specific signals with AI-generated explanations that cite source articles.

5. **Watchlist Management**: Users can star companies to add them to a watchlist, which displays real-time financial snapshots including current price, market cap, volume, and key performance indicators with color-coded change indicators.

6. **Comparative Analysis Tools**: The Analysis Page provides bar charts comparing key metrics (Revenue Growth Rate, PE Ratio, ROE) across companies, with tooltips showing precise values. All visualizations are optimized for clarity with horizontal-only gridlines and hidden Y-axis numbers.

**Key Features:**
- Real-time data extraction from KLSE Screener using Selenium-based web scraping
- Multi-year financial history analysis with automatic data reversal for chronological display
- Dual Y-axis charts for comparing metrics with different scales (e.g., net margin % vs EPS)
- Color-coded company identification system for intuitive comparison
- In-memory watchlist with instant add/remove functionality
- AI-powered signal explanation with source article citations
- Responsive React-based frontend with Recharts for data visualization
- FastAPI backend with structured API endpoints
- Session-based analysis with no persistent database requirements

The system transforms complex financial analysis from a multi-hour manual process into a streamlined, automated workflow that delivers comprehensive insights in minutes, enabling analysts and relationship managers to make faster, more informed investment decisions.

## Tech Stack Used

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.x (for fast development and optimized production builds)
- **Routing**: React Router v6 (for multi-page navigation)
- **State Management**: Zustand (lightweight state management)
- **Data Visualization**: Recharts (for interactive charts: BarChart, LineChart, dual Y-axes)
- **HTTP Client**: Fetch API (native browser API)
- **Styling**: Inline CSS with dark mode support

### Backend
- **Framework**: FastAPI (Python 3.8+)
- **Web Server**: Uvicorn (ASGI server)
- **Data Validation**: Pydantic (for schema validation and type checking)
- **Web Scraping**: 
  - Selenium WebDriver (for dynamic content extraction from KLSE Screener)
  - BeautifulSoup4 (for HTML parsing)
- **HTTP Client**: Requests library (for API calls)
- **AI/LLM Integration**: Ollama (local LLM for AI-powered analysis)
- **PDF Processing**: PDFPlumber (for annual report text extraction)
- **Data Processing**: 
  - NumPy (for numerical computations)
  - Python built-in libraries (json, re, typing)

### APIs and Data Sources
- **KLSE Screener** (https://www.klsescreener.com): Primary source for company financial data
- **Yahoo Finance RSS**: News feed aggregation for Malaysian market
- **The Edge Malaysia**: Financial news and analysis
- **The Star Malaysia**: Business and financial news
- **Asian Power Malaysia**: Energy sector news

### Development Tools
- **Version Control**: Git
- **Package Management**: 
  - npm (Node Package Manager) for frontend
  - pip (Python Package Installer) for backend
- **API Documentation**: Swagger UI (auto-generated from FastAPI)
- **Browser Automation**: ChromeDriver (for Selenium)

### Architecture Patterns
- **RAG (Retrieval-Augmented Generation)**: For intelligent news analysis
- **Multi-Agent System**: Separate macro and micro analysis agents
- **REST API**: Standard HTTP endpoints for client-server communication
- **In-Memory Storage**: Session-based data without persistent database
- **Component-Based Architecture**: Modular React components for reusability

### Key Libraries and Dependencies

**Frontend (`package.json`):**
```
- react: ^18.x
- react-dom: ^18.x
- react-router-dom: ^6.x
- recharts: ^2.x
- zustand: ^4.x
- typescript: ^5.x
- vite: ^5.x
```

**Backend (`requirements.txt`):**
```
- fastapi: Web framework
- uvicorn: ASGI server
- pydantic: Data validation
- selenium: Web automation
- beautifulsoup4: HTML parsing
- requests: HTTP client
- pdfplumber: PDF extraction
- ollama: LLM integration
- numpy: Numerical processing
```

### Deployment Environment
- **Development**: Local development servers (Vite dev server on port 5173, Uvicorn on port 8000)
- **Browser Compatibility**: Modern browsers with ES6+ support
- **Operating System**: Cross-platform (macOS, Windows, Linux)


## Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start Backend Server

From the `backend` directory:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

### Start Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Link To Our Demo Video 


### Link To Our Presentation Deck 
https://www.canva.com/design/DAG-VMwtZA8/JFf1AKVcZsHr3WtX62GROQ/edit?utm_content=DAG-VMwtZA8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton 
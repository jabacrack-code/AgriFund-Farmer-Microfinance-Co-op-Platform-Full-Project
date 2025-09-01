# Overview

AgriFund is a crowdfunding platform that connects investors with smallholder farmers in Kenya. The platform addresses the agricultural financing gap by allowing farmers to request microloans that are funded by investors and repaid after harvest. The system focuses on supporting sustainable agriculture while providing meaningful returns to investors.

The platform serves two primary user types: farmers who can submit loan requests and track their funding progress, and investors who can discover investment opportunities and monitor their portfolio performance. The application includes comprehensive analytics and tracking capabilities to monitor loan performance, repayment progress, and overall platform impact metrics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: Pure HTML5, CSS3, and vanilla JavaScript (no frameworks)
- **Multi-page Structure**: Separate HTML pages for different user flows and dashboards
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox for layouts
- **Navigation**: Sticky header navigation with hamburger menu for mobile devices

## Client-Side Application Structure
- **Main Application Class**: Single `AgriFund` class managing all application logic
- **Session Management**: Browser-based user session handling with localStorage
- **Event-Driven Architecture**: Centralized event listener management for form submissions and user interactions
- **Dynamic Content**: JavaScript-powered dynamic content updates and dashboard statistics

## Page Architecture
- **Landing Page** (`index.html`): Hero section with dual user type entry points
- **Authentication** (`auth.html`): Combined login/register interface with tab switching
- **Farmer Dashboard** (`farmer-registration.html`): Loan request forms and farmer-specific statistics
- **Investor Dashboard** (`investor-dashboard.html`): Investment opportunities and portfolio tracking
- **Analytics Dashboard** (`analytics.html`): Platform-wide performance metrics and KPIs
- **Loan Tracking** (`loan-tracking.html`): Detailed loan monitoring and repayment progress

## Data Management
- **Client-Side Storage**: Uses browser localStorage for session persistence and basic data caching
- **Form Processing**: JavaScript-based form validation and submission handling
- **Dynamic Statistics**: Real-time calculation and display of investment metrics, loan statistics, and platform KPIs

## User Experience Design
- **Dual User Flow**: Separate pathways optimized for farmers and investors
- **Visual Hierarchy**: CSS custom properties (variables) for consistent theming
- **Agricultural Theming**: Green color palette with agricultural iconography using Font Awesome icons
- **Progressive Disclosure**: Dashboard statistics and detailed views loaded based on user authentication status

# External Dependencies

## Third-Party Libraries
- **Font Awesome 6.0.0**: Icon library for consistent UI iconography across the platform
- **Pixabay**: External image hosting for hero section agricultural imagery

## Planned Integrations
- **Database System**: Architecture prepared for backend database integration (likely PostgreSQL with potential Drizzle ORM)
- **Authentication Service**: Structure in place for external authentication provider integration
- **Payment Processing**: Framework ready for payment gateway integration for investment transactions
- **Mobile Money Integration**: Prepared for Kenya-specific payment methods (M-Pesa integration expected)

## Browser APIs
- **Local Storage API**: For client-side session management and data persistence
- **Fetch API**: Prepared for future REST API communications with backend services
- **Responsive Design APIs**: CSS Media Queries for cross-device compatibility
# TimeTracking Application

A comprehensive employee time tracking system built with Angular 19 and Strapi CMS. This application provides robust time management capabilities for organizations, including clock-in/out functionality, vacation tracking, permission management, and home office request handling.

## 🚀 Features

### Core Time Tracking
- **Digital Timer**: Real-time clock-in/out with precision tracking
- **Time Entry Management**: View, edit, and delete time entries
- **Monthly Summaries**: Comprehensive reports showing hours worked, vacation days, and tracking status
- **Status Indicators**: Tracks complete, partial, untracked, weekend, and vacation day statuses

### Employee Management
- **Vacation Planning**: Request and manage vacation days
- **Permission Entries**: Handle permission requests and approvals
- **Home Office Requests**: Manage remote work requests with location mapping
- **User Authentication**: Secure login and registration system

### Advanced Features
- **Date Range Filtering**: Filter time entries by custom date ranges
- **Weekend Detection**: Automatic weekend identification
- **Permission Leave Calculation**: Automatic deduction from work hours
- **Data Persistence**: All data synced with Strapi backend
- **Responsive Design**: Modern Material Design UI that works on all devices

## 🏗️ Architecture

### Frontend (Angular 19)
- **Framework**: Angular 19 with standalone components
- **UI Library**: Angular Material for consistent design
- **State Management**: RxJS for reactive programming
- **Routing**: Angular Router with authentication guards
- **Maps Integration**: Google Maps for location services

### Backend (Strapi CMS)
- **Content Management**: Strapi 5.15.0 for API and data management
- **Database**: Configurable database support
- **Authentication**: Built-in user authentication and permissions
- **API**: RESTful API for all data operations

### Key Technologies
- **TypeScript**: Type-safe development
- **SCSS**: Advanced styling capabilities
- **RxJS**: Reactive programming patterns
- **Angular Material**: UI component library
- **Google Maps API**: Location services

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── auth/                 # Authentication components
│   │   │   ├── timer/                # Main timer functionality
│   │   │   ├── timetable/           # Time entry management
│   │   │   ├── vacation-planning/   # Vacation management
│   │   │   ├── permission-leave/    # Permission handling
│   │   │   └── home-office-request/ # Remote work requests
│   │   ├── services/                # Business logic services
│   │   ├── models/                  # TypeScript interfaces
│   │   ├── guards/                  # Route protection
│   │   └── interceptors/            # HTTP interceptors
│   └── assets/                      # Static resources
├── backend/                         # Strapi CMS backend
│   ├── src/
│   │   ├── api/                     # API endpoints
│   │   └── admin/                   # Admin panel
│   └── config/                      # Backend configuration
└── public/                          # Public assets
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ionut-gardu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:4200/`

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Start the Strapi server**
   ```bash
   npm run develop
   ```

4. **Access Strapi admin**
   Open `http://localhost:1337/admin` to configure the backend

## 🚀 Available Scripts

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build in watch mode

### Backend Scripts
- `npm run develop` - Start Strapi in development mode
- `npm run start` - Start Strapi in production mode
- `npm run build` - Build Strapi admin panel

## 🧪 Testing

The application includes comprehensive unit tests for all components and services:

```bash
npm test
```

Tests cover:
- Component functionality
- Service logic
- User interactions
- Data validation
- Error handling

## 🌐 Deployment

### Frontend Deployment
```bash
npm run build
```
Deploy the `dist/` directory to your preferred hosting platform.

### Backend Deployment
Configure your production database and deploy the Strapi backend to your hosting provider.

## 📝 API Documentation

The application communicates with Strapi CMS through RESTful APIs:

- **Time Entries**: CRUD operations for time tracking
- **Users**: Authentication and user management
- **Vacation Entries**: Vacation day management
- **Permission Entries**: Permission request handling
- **Home Office Requests**: Remote work management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the NTT Data development program.

## 🔧 Configuration

### Environment Variables
Configure the following environment variables for production:
- `API_URL` - Strapi backend URL
- `GOOGLE_MAPS_API_KEY` - Google Maps API key

### Development Configuration
The application is pre-configured for development with default settings.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

Built with ❤️ using Angular 19 and Strapi CMS

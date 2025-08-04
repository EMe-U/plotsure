# PlotSure Connect - Land Listing Platform

A modern web application for connecting land buyers and sellers in Rwanda, built with Firebase backend.

## Features

- **User Authentication**: Secure login/signup with Firebase Auth
- **Land Listings**: Browse and search available land properties
- **Admin Dashboard**: Manage listings and inquiries
- **File Upload**: Upload images and documents to Firebase Storage
- **Real-time Database**: Firestore for data storage
- **Responsive Design**: Works on desktop and mobile devices

## Firebase Backend Setup

This application uses Firebase SDK v12 with the following services:

### Authentication
- Email/password authentication
- User role management (admin/user)
- Session management

### Firestore Database
Collections:
- `users`: User profiles and authentication data
- `listings`: Land property listings
- `inquiries`: User inquiries about listings

### Storage
- Image uploads for land listings
- Document uploads for land titles
- Secure file access

## Project Structure

```
plotsure/
├── index.html              # Main application page
├── admin.html              # Admin dashboard
├── firebase-config.js      # Firebase configuration and services
├── script.js               # Main application logic
├── admin-script.js         # Admin dashboard logic
├── styles.css              # Main styles
├── admin-styles.css        # Admin styles
├── test-firebase.html      # Firebase connection test
├── package.json            # Dependencies
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js and npm installed
- Firebase project set up

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd plotsure
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:8080`

## Usage

### For Users

1. **Sign Up**: Create a new account with your email and password
2. **Browse Listings**: View available land properties
3. **Search**: Filter listings by location, price, and land type
4. **Contact**: Send inquiries to property owners
5. **View Details**: See comprehensive property information

### For Admins

1. **Login**: Use admin credentials (admin@plotsure.com / admin123)
2. **Add Listings**: Create new land listings with images and documents
3. **Manage Listings**: Edit or delete existing listings
4. **View Inquiries**: Monitor and respond to user inquiries
5. **User Management**: Manage user accounts and permissions

## Firebase Services Used

### Authentication Service (`authService`)
```javascript
// Sign up
await authService.signUp(email, password, userData);

// Sign in
await authService.signIn(email, password);

// Sign out
await authService.signOut();

// Get current user
const user = authService.getCurrentUser();
```

### Database Service (`dbService`)
```javascript
// Users
await dbService.users.get(userId);
await dbService.users.update(userId, userData);

// Listings
await dbService.listings.create(listingData);
await dbService.listings.search(filters);
await dbService.listings.update(listingId, data);

// Inquiries
await dbService.inquiries.create(inquiryData);
await dbService.inquiries.getAll();
```

### Storage Service (`storageService`)
```javascript
// Upload files
const imageUrl = await storageService.uploadListingImage(file, listingId);
const documentUrl = await storageService.uploadDocument(file, listingId);
```

## Testing

To test the Firebase connection, open `test-firebase.html` in your browser. This will verify:

- Firebase initialization
- Firestore database connection
- Authentication service
- Storage service availability

## Security Rules

Make sure your Firebase project has appropriate security rules for:

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read listings
    match /listings/{listingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Users can create inquiries
    match /inquiries/{inquiryId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload files
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Module Import Errors**: Make sure you're serving files from a web server (not file://)
2. **CORS Errors**: Firebase requires HTTPS in production
3. **Authentication Errors**: Check Firebase Auth settings in console
4. **Storage Upload Failures**: Verify storage rules and file size limits

### Debug Mode

Open browser developer tools and check the console for detailed error messages. The application includes comprehensive error handling and logging.

## Deployment

To deploy to production:

1. Build the application
2. Upload to Firebase Hosting
3. Configure custom domain (optional)
4. Set up SSL certificate

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

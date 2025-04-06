# Firebase Troubleshooting Guide

This document provides solutions for common Firebase issues encountered in the Economics Games project.

## Common Errors

### Permission Denied Errors

**Error Message:**
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

**Solutions:**

1. **Check Firestore Security Rules**
   - Go to Firebase Console > Firestore Database > Rules
   - For development, use the permissive rules from FIRESTORE_SECURITY_RULES.md
   - Make sure to click "Publish" after updating the rules

2. **Check Authentication State**
   - Make sure users are properly authenticated if your rules require authentication
   - Check the console for authentication errors

3. **Check Collection and Document Paths**
   - Verify that your code is using the correct collection and document paths
   - Check for typos in collection names

### CORS Errors

**Error Message:**
```
XMLHttpRequest cannot load https://firestore.googleapis.com/... due to access control checks.
```

**Solutions:**

1. **Check Firebase Configuration**
   - Verify that the Firebase configuration in firebase-core.js matches your Firebase project
   - Make sure the project ID is correct

2. **Check for Browser Extensions**
   - Some browser extensions can interfere with Firebase connections
   - Try disabling extensions or using an incognito window

3. **Check for Mixed Content**
   - If serving over HTTPS, make sure all resources are also loaded over HTTPS
   - Check for console warnings about mixed content

4. **Clear Browser Cache and Cookies**
   - Sometimes cached credentials can cause issues
   - Clear cache and cookies, then reload the page

### Initialization Errors

**Error Message:**
```
Firebase App named '[DEFAULT]' already exists
```

**Solutions:**

1. **Check for Multiple Initializations**
   - Make sure Firebase is only initialized once
   - Check for duplicate script imports

2. **Use Conditional Initialization**
   - Only initialize Firebase if it hasn't been initialized already:
   ```javascript
   if (!firebase.apps.length) {
     firebase.initializeApp(firebaseConfig);
   }
   ```

## Debugging Techniques

1. **Enable Verbose Logging**
   - Add this code before initializing Firebase:
   ```javascript
   firebase.firestore.setLogLevel('debug');
   ```

2. **Check Network Requests**
   - Use browser developer tools to inspect network requests
   - Look for failed requests to firestore.googleapis.com

3. **Test with Firebase Emulator**
   - Set up the Firebase Emulator Suite for local testing
   - This can help isolate if issues are with your code or with the Firebase service

## Firebase Console Tools

1. **Database Viewer**
   - Use the Firestore Database viewer to manually inspect data
   - Verify that collections and documents exist as expected

2. **Authentication**
   - Check the Authentication section to verify user accounts
   - You can manually create or delete test users

3. **Logs**
   - Check Firebase Functions logs for server-side errors
   - Look for patterns in error messages

## Getting Help

If you continue to experience issues after trying these solutions:

1. **Firebase Documentation**
   - Check the [Firebase Documentation](https://firebase.google.com/docs)
   - Look for specific error codes in the troubleshooting sections

2. **Stack Overflow**
   - Search for your error message on Stack Overflow
   - Many common Firebase issues have been solved by the community

3. **Firebase Support**
   - For paid Firebase plans, contact Firebase support
   - Provide detailed error messages and steps to reproduce

# React Native Expo + Flask Backend

## Tech Stack

**Frontend:**

- React Native with Expo
- TypeScript
- React Navigation
- Expo Camera

**Backend:**

- Flask
- OpenCV
- NumPy

## Backend Workflow

1. Load templates from `correct-Images/` and `Wrong-images/` folders
2. Extract features from images using ORB (Oriented FAST and Rotated BRIEF)
3. Use FLANN matcher to compare images
4. Receive image from mobile app
5. Compare with templates and return match results
6. Return JSON response with classification

## Frontend Workflow

1. Request camera permissions
2. Capture image from device camera
3. Send image to backend API
4. Receive classification result
5. Display result to user

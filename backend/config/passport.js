/**
 * Passport Configuration for OAuth Authentication
 * Handles Google and Facebook OAuth strategies
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'demo-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-google-client-secret',
    callbackURL: "/api/v1/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth Profile:', profile);
        
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });
            return done(null, user);
        }
        
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value || user.avatar;
            user.isEmailVerified = true; // Google emails are verified
            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });
            return done(null, user);
        }
        
        // Create new user
        user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0]?.value,
            isEmailVerified: true, // Google emails are verified
            preferences: {
                currency: 'INR',
                theme: 'light',
                language: 'en'
            }
        });
        
        await user.save();
        return done(null, user);
        
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'demo-facebook-app-id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'demo-facebook-app-secret',
    callbackURL: "/api/v1/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Facebook OAuth Profile:', profile);
        
        // Check if user already exists with this Facebook ID
        let user = await User.findOne({ facebookId: profile.id });
        
        if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });
            return done(null, user);
        }
        
        // Check if user exists with same email
        if (profile.emails && profile.emails[0]) {
            user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
                // Link Facebook account to existing user
                user.facebookId = profile.id;
                user.avatar = profile.photos[0]?.value || user.avatar;
                user.isEmailVerified = true; // Facebook emails are verified
                user.lastLogin = new Date();
                await user.save({ validateBeforeSave: false });
                return done(null, user);
            }
        }
        
        // Create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `facebook_${profile.id}@facebook.local`;
        
        user = new User({
            name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
            email: email,
            facebookId: profile.id,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            isEmailVerified: profile.emails && profile.emails[0] ? true : false,
            preferences: {
                currency: 'INR',
                theme: 'light',
                language: 'en'
            }
        });
        
        await user.save();
        return done(null, user);
        
    } catch (error) {
        console.error('Facebook OAuth error:', error);
        return done(error, null);
    }
}));

module.exports = passport;

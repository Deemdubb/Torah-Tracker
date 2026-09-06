# Base44 built-in login pages

Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx, OAuthConsent.jsx,
plus GoogleIcon.jsx, UserNotRegisteredError.jsx and PageNotFound.jsx are Base44's
standard login screens. They call Base44's own login system (base44.auth.*).

They are NOT needed for the rebuild. The new app uses Supabase login instead.
Only the design is worth copying: centered card, icon in a rounded square,
title + subtitle, "Continue with Google" button, then email + password fields.

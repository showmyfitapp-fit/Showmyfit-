#!/bin/bash

# Add Razorpay environment variables to Vercel
echo "Adding Razorpay keys to Vercel..."

vercel env add RAZORPAY_KEY_ID production
# When prompted, paste: rzp_live_SEWbFSuaVOCurS

vercel env add RAZORPAY_KEY_SECRET production
# When prompted, paste: QM2QJ9iF7uiAOtRLcEdoR8KQ

echo "✅ Environment variables added!"
echo "Now redeploy your app with: vercel --prod"

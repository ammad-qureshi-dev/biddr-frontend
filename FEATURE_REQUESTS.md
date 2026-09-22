- This file will have all the feature requests I require. Always add the features taht are written in this file. These features will be safe to add and are reviewed thoroughly. I need you to follow these steps when reading this file:
  - Complete the feature
  - If at any point in time you don't agree or see any faults with a feature, please alert me so that we can iron out the kinks
  - After the feature is added, make sure to add the feature to the @APP_FEATURE.md or ./APP_FEATURE.md file under the appropriate category to ensure we grow our app feature list
  - After the feature is added, append "[FEATURE ADDED @ TIMESTAMP]" in front of the request

# App Feature Requests

- [FEATURE ADDED @ 2026-08-24] on the account page, show if that account is verified. On the eyebrow="Account" in ./app/account.tsx, add a badge signalling if it has been verified. For a non-verified account, make the badge say "Not Verified". When the user hovers over it, make a tip (default system tip) show up saying "Account is not verified, please verify". On a verified account, just show a green checkmark. When the user hovers over the checkmark, show a tip saying "Account is verified"
- [FEATURE ADDED @ 2026-08-24] when an account is already verified, don't show the "Verify your account" section, since it won't be needed

/* eslint-disable @typescript-eslint/no-require-imports */
// Static asset registry. SVGs render through expo-image.
export const images = {
  logoMark: require('../../assets/images/logo-mark.png'),
  logoWordmark: require('../../assets/images/logo-wordmark.png'),
  logoWordmarkWhite: require('../../assets/icons/logo-wordmark-white.svg'), // first prototype; kept for reference
  // Current Vine logo (leaf V + "ine"), vector-traced from assets/vinelogo.png. Aspect ratio 847:640.
  vineLogo: require('../../assets/icons/vine-logo.svg'),
  vineLogoWhite: require('../../assets/icons/vine-logo-white.svg'),
  // The web app's login photo is an Unsplash+ watermarked preview and can't ship; both auth
  // screens use the sign-up photo until a licensed login image is provided.
  authSignup: require('../../assets/images/auth-signup.jpg'),
  onboarding: [
    require('../../assets/images/onboarding-1.jpg'),
    require('../../assets/images/onboarding-2.jpg'),
    require('../../assets/images/onboarding-3.jpg'),
  ],
  welcomeModalBg: require('../../assets/images/welcome-modal-bg.png'),
};

export const icons = {
  apple: require('../../assets/icons/apple.svg'),
  google: require('../../assets/icons/google.svg'),
  home: require('../../assets/icons/home.svg'),
  chat: require('../../assets/icons/chat.svg'),
  notification: require('../../assets/icons/notification.svg'),
  live: require('../../assets/icons/live.svg'),
  camera: require('../../assets/icons/camera.svg'),
  smiley: require('../../assets/icons/smiley-face.svg'),
  comment: require('../../assets/icons/comment.svg'),
  heart: require('../../assets/icons/heart.svg'),
  heartOutline: require('../../assets/icons/heart-outline.svg'),
  saved: require('../../assets/icons/saved.svg'),
  savedOutline: require('../../assets/icons/saved-outline.svg'),
  shared: require('../../assets/icons/shared.svg'),
  eye: require('../../assets/icons/eye.svg'),
  back: require('../../assets/icons/back-icon.svg'),
  welcomeStar: require('../../assets/icons/welcome-star.svg'),
  checkMark: require('../../assets/icons/check-mark.svg'),
  imagePlaceholder: require('../../assets/icons/image-placeholder.svg'),
  friendsNav: require('../../assets/icons/friends_nav.svg'),
  pagesNav: require('../../assets/icons/pages_nav.svg'),
  likedNav: require('../../assets/icons/liked_nav.svg'),
  settingsNav: require('../../assets/icons/settings_nav.svg'),
  helpNav: require('../../assets/icons/help_nav.svg'),
  groupsNav: require('../../assets/icons/groups_nav.svg'),
};

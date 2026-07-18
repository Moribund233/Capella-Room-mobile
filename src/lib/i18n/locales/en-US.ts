/**
 * English (US) translation keys.
 */

export default {
  // ── Common ─────────────────────────────────────────────────
  common: {
    appName: "Capella",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    done: "Done",
    search: "Search",
    send: "Send",
    retry: "Retry",
    close: "Close",
    back: "Back",
    next: "Next",
    seeAll: "See All",
    explore: "Explore",
    everyone: "Everyone",
    members: "members",
    online: "online",
    offline: "offline",
    away: "away",
    busy: "busy",
    today: "Today",
    yesterday: "Yesterday",
    changePassword: "Change Password",
    twoFactor: "Two-Factor Auth",
    loginHistory: "Login History",
    autoDownloadImages: "Auto-download Images",
    autoDownloadVideos: "Auto-download Videos",
    clearCache: "Clear Cache",
    storage: "Storage & Data",
  },

  // ── Auth ───────────────────────────────────────────────────
  auth: {
    tagline: "Where chats feel like home",
    subtitle:
      "Real-time messaging for communities, teams & friends. Fast, beautiful, and private.",
    handwriting: "✦ built with care",

    signIn: "Sign In",
    createAccount: "Create Account",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "••••••••",
    username: "Username",
    usernamePlaceholder: "cool_user",
    verificationCode: "Verification Code",
    verificationCodePlaceholder: "Enter 6-digit code",
    sendCode: "Send Code",
    signingIn: "Signing in…",
    creatingAccount: "Creating account…",
    forgotPassword: "Forgot password?",
    orContinueWith: "or continue with",
    google: "Google",
    github: "GitHub",

    passwordStrength: "Password strength",
    passwordHint: "At least 8 characters",
  },

  // ── Tabs ───────────────────────────────────────────────────
  tabs: {
    chats: "Chats",
    discover: "Discover",
    alerts: "Alerts",
    profile: "Profile",
  },

  // ── Home / Chat List ───────────────────────────────────────
  home: {
    title: "Messages",
    searchPlaceholder: "Search chats, rooms, people…",
    pinned: "Pinned",
    recent: "Recent",
    noConversations: "No conversations yet",
    emptyHint: "Start a chat from the Discover tab.",
    unreadMessages: "unread messages",
  },

  // ── Chat Room ──────────────────────────────────────────────
  chat: {
    messagePlaceholder: "Message…",
    typing: "typing…",
    isTyping: "{{name}} is typing…",
    areTyping: "{{name}} are typing…",
    title: "Chat",
    pinnedMessage: "Pinned message",
    edited: "edited",
    read: "Read",
    unread: "Unread",
    reply: "Reply",
    reactions: "Reactions",
    addReaction: "Add reaction",
    image: "Image",
    file: "File",
    tapToDownload: "Tap to download",
  },

  // ── Discover ───────────────────────────────────────────────
  discover: {
    title: "Discover",
    subtitle: "Find friends & explore rooms",
    searchPlaceholder: "Search people, rooms, topics…",
    tabs: {
      recommended: "Recommended",
      friends: "Friends",
      requests: "Requests",
      rooms: "Rooms",
    },
    friendRequests: "Friend Requests",
    noFriendRequests: "No pending requests",
    recommendedPeople: "People you might know",
    popularRooms: "Popular Rooms",
    explore: "Explore",
    addFriend: "+ Add Friend",
    requestSent: "Request sent",
    joinRoom: "Join Room",
    joined: "Joined",
    mutualFriends: "{{count}} mutual friends",
    membersOnline: "{{members}} members · {{online}} online",
  },

  // ── Notifications ──────────────────────────────────────────
  notifications: {
    title: "Notifications",
    markAllRead: "Mark all read",
    empty: "No notifications",
    types: {
      mention: "Mentioned you",
      privateMessage: "New private message",
      roomInvitation: "Room invitation",
      system: "System notification",
      fileUpload: "File upload complete",
    },
  },

  // ── Profile / Settings ─────────────────────────────────────
  profile: {
    joinedAt: "Joined {{date}}",
    stats: {
      messages: "Messages",
      rooms: "Rooms",
      friends: "Friends",
      reactions: "Reactions",
    },
    preferences: "Preferences",
    quickToggles: "Quick Toggles",
    account: "Account",
    settings: {
      notifications: "Notifications",
      notificationsSubtitle: "Messages, mentions, sounds",
      privacy: "Privacy",
      privacySubtitle: "Online status, read receipts",
      appearance: "Appearance",
      appearanceSubtitle: "Theme, font size, contrast",
      language: "Language",
      languageSubtitle: "Language",
      darkMode: "Dark Mode",
      soundEffects: "Sound Effects",
      readReceipts: "Read Receipts",
      security: "Security",
      securitySubtitle: "Password, 2FA, login history",
      storage: "Storage & Data",
      storageSubtitle: "24.8 MB used",
    },
    security: {
      title: "Active Devices",
      badgeSafe: "All safe",
      current: "Current",
      lastSeen: "{{time}} · {{location}}",
      terminateOthers: "Terminate other devices",
    },
    logout: "Log Out",
  },

  // ── Settings Detail Pages ──────────────────────────────────
  settings: {
    notifications: {
      title: "Notifications",
      privateMessage: "Private messages",
      mentioned: "Mentions",
      roomInvitation: "Room invitations",
      systemNotification: "System notifications",
      fileUploadComplete: "File upload complete",
      sound: "Sound",
      desktop: "Desktop notifications",
      doNotDisturb: "Do not disturb",
    },
    privacy: {
      title: "Privacy",
      onlineStatus: "Online status visibility",
      profileVisibility: "Profile visibility",
      allowStrangerMessage: "Allow messages from strangers",
      allowRoomInvitation: "Allow room invitations",
      singleDeviceLogin: "Single-device login",
    },
    appearance: {
      title: "Appearance",
      theme: {
        title: "Theme",
        light: "Light",
        dark: "Dark",
        system: "System",
      },
      fontSize: "Font size",
      highContrast: "High contrast",
      reduceAnimations: "Reduce animations",
    },
    language: {
      title: "Language",
      zhCN: "简体中文",
      enUS: "English (US)",
    },
  },

  // ── Errors ─────────────────────────────────────────────────
  errors: {
    generic: "Something went wrong. Please try again.",
    network: "Network error. Please check your connection.",
    unauthorized: "Session expired. Please sign in again.",
    notFound: "Page not found",
  },
};

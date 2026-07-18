/**
 * Simplified Chinese translation keys.
 *
 * Keep keys flat and grouped by feature to make them easy to grep
 * and maintain alongside the prototype screens.
 */

export default {
  // ── Common ─────────────────────────────────────────────────
  common: {
    appName: "Capella",
    loading: "加载中…",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    edit: "编辑",
    done: "完成",
    search: "搜索",
    send: "发送",
    retry: "重试",
    close: "关闭",
    back: "返回",
    next: "下一步",
    seeAll: "查看全部",
    explore: "探索",
    everyone: "所有人",
    members: "成员",
    online: "在线",
    offline: "离线",
    away: "离开",
    busy: "忙碌",
    today: "今天",
    yesterday: "昨天",
    changePassword: "修改密码",
    twoFactor: "两步验证",
    loginHistory: "登录记录",
    autoDownloadImages: "自动下载图片",
    autoDownloadVideos: "自动下载视频",
    clearCache: "清除缓存",
    storage: "存储与数据",
  },

  // ── Auth ───────────────────────────────────────────────────
  auth: {
    tagline: "让聊天像家一样自在",
    subtitle: "为社群、团队与好友打造的实时消息空间。快速、美观、私密。",
    handwriting: "✦ 用心构建",

    signIn: "登录",
    createAccount: "创建账号",
    email: "邮箱",
    emailPlaceholder: "you@example.com",
    password: "密码",
    passwordPlaceholder: "••••••••",
    username: "用户名",
    usernamePlaceholder: "cool_user",
    verificationCode: "验证码",
    verificationCodePlaceholder: "输入 6 位验证码",
    sendCode: "发送验证码",
    signingIn: "登录中…",
    creatingAccount: "创建中…",
    forgotPassword: "忘记密码？",
    orContinueWith: "或通过以下方式继续",
    google: "Google",
    github: "GitHub",

    passwordStrength: "密码强度",
    passwordHint: "至少 8 位字符",
  },

  // ── Tabs ───────────────────────────────────────────────────
  tabs: {
    chats: "消息",
    discover: "发现",
    alerts: "通知",
    profile: "我的",
  },

  // ── Home / Chat List ───────────────────────────────────────
  home: {
    title: "消息",
    searchPlaceholder: "搜索聊天、房间、联系人…",
    pinned: "置顶",
    recent: "最近",
    noConversations: "暂无对话",
    emptyHint: "从发现页开始聊天吧。",
    unreadMessages: "未读消息",
  },

  // ── Chat Room ──────────────────────────────────────────────
  chat: {
    messagePlaceholder: "输入消息…",
    typing: "正在输入…",
    isTyping: "{{name}} 正在输入…",
    areTyping: "{{name}} 正在输入…",
    title: "聊天",
    pinnedMessage: "置顶消息",
    edited: "已编辑",
    read: "已读",
    unread: "未读",
    reply: "回复",
    reactions: "表情反应",
    addReaction: "添加反应",
    image: "图片",
    file: "文件",
    tapToDownload: "点击下载",
  },

  // ── Discover ───────────────────────────────────────────────
  discover: {
    title: "发现",
    subtitle: "寻找好友与探索房间",
    searchPlaceholder: "搜索用户、房间、话题…",
    tabs: {
      recommended: "推荐",
      friends: "好友",
      requests: "请求",
      rooms: "房间",
    },
    friendRequests: "好友请求",
    noFriendRequests: "暂无好友请求",
    recommendedPeople: "可能认识的人",
    popularRooms: "热门房间",
    explore: "探索",
    addFriend: "+ 添加好友",
    requestSent: "已发送请求",
    joinRoom: "加入房间",
    joined: "已加入",
    mutualFriends: "{{count}} 位共同好友",
    membersOnline: "{{members}} 位成员 · {{online}} 在线",
  },

  // ── Notifications ──────────────────────────────────────────
  notifications: {
    title: "通知",
    markAllRead: "全部已读",
    empty: "暂无通知",
    types: {
      mention: "有人 @ 了你",
      privateMessage: "收到私信",
      roomInvitation: "房间邀请",
      system: "系统通知",
      fileUpload: "文件上传完成",
    },
  },

  // ── Profile / Settings ─────────────────────────────────────
  profile: {
    joinedAt: "加入于 {{date}}",
    stats: {
      messages: "消息",
      rooms: "房间",
      friends: "好友",
      reactions: "反应",
    },
    preferences: "偏好设置",
    quickToggles: "快捷开关",
    account: "账号",
    settings: {
      notifications: "通知",
      notificationsSubtitle: "消息、@提及、声音",
      privacy: "隐私",
      privacySubtitle: "在线状态、已读回执",
      appearance: "外观",
      appearanceSubtitle: "主题、字体大小、对比度",
      language: "语言",
      languageSubtitle: "简体中文",
      darkMode: "深色模式",
      soundEffects: "音效",
      readReceipts: "已读回执",
      security: "安全",
      securitySubtitle: "密码、两步验证、登录记录",
      storage: "存储与数据",
      storageSubtitle: "已用 24.8 MB",
    },
    security: {
      title: "活跃设备",
      badgeSafe: "一切安全",
      current: "当前设备",
      lastSeen: "{{time}} · {{location}}",
      terminateOthers: "下线其他设备",
    },
    logout: "退出登录",
  },

  // ── Settings Detail Pages ──────────────────────────────────
  settings: {
    notifications: {
      title: "通知设置",
      privateMessage: "私信通知",
      mentioned: "@提及通知",
      roomInvitation: "房间邀请",
      systemNotification: "系统通知",
      fileUploadComplete: "文件上传完成",
      sound: "声音",
      desktop: "桌面通知",
      doNotDisturb: "勿扰模式",
    },
    privacy: {
      title: "隐私设置",
      onlineStatus: "在线状态可见性",
      profileVisibility: "资料可见性",
      allowStrangerMessage: "允许陌生人私信",
      allowRoomInvitation: "允许房间邀请",
      singleDeviceLogin: "单设备登录",
    },
    appearance: {
      title: "外观",
      theme: {
        title: "主题",
        light: "浅色",
        dark: "深色",
        system: "跟随系统",
      },
      fontSize: "字体大小",
      highContrast: "高对比度",
      reduceAnimations: "减少动画",
    },
    language: {
      title: "语言",
      zhCN: "简体中文",
      enUS: "English (US)",
    },
  },

  // ── Errors ─────────────────────────────────────────────────
  errors: {
    generic: "出错了，请稍后再试",
    network: "网络异常，请检查连接",
    unauthorized: "登录已过期，请重新登录",
    notFound: "页面不存在",
  },
};

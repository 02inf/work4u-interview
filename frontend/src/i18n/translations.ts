export interface Translation {
  // Header
  appTitle: string;
  navigation: {
    home: string;
    history: string;
  };
  
  // Home Page
  createDigest: string;
  transcriptLabel: string;
  transcriptPlaceholder: string;
  streamingOption: string;
  generateButton: string;
  generating: string;
  realTimeGenerating: string;
  reset: string;
  
  // Status Messages
  status: {
    started: string;
    generating: string;
    completed: string;
    error: string;
  };
  
  // Digest Display
  digest: {
    overview: string;
    keyDecisions: string;
    actionItems: string;
    shareButton: string;
    shareSuccess: string;
    viewDetails: string;
    delete: string;
    deleteConfirm: string;
  };
  
  // History Page
  history: {
    title: string;
    noData: string;
    createdAt: string;
    loadMore: string;
    loading: string;
  };
  
  // Detail Page
  detail: {
    title: string;
    backToHistory: string;
    originalTranscript: string;
  };
  
  // Errors
  errors: {
    transcriptRequired: string;
    generateFailed: string;
    loadFailed: string;
    deleteFailed: string;
    networkError: string;
  };
}

export const translations: Record<string, Translation> = {
  zh: {
    appTitle: "AI会议摘要",
    navigation: {
      home: "创建摘要",
      history: "历史记录"
    },
    createDigest: "创建会议摘要",
    transcriptLabel: "会议转录内容 *",
    transcriptPlaceholder: "请输入会议转录内容...",
    streamingOption: "使用实时流式生成（展示生成过程）",
    generateButton: "生成摘要",
    generating: "生成中",
    realTimeGenerating: "实时生成中",
    reset: "重置",
    status: {
      started: "🚀 开始生成摘要...",
      generating: "⚡ 正在生成中...",
      completed: "✅ 生成完成！",
      error: "❌ 生成失败"
    },
    digest: {
      overview: "会议概述",
      keyDecisions: "关键决策",
      actionItems: "行动项",
      shareButton: "分享链接",
      shareSuccess: "链接已复制到剪贴板",
      viewDetails: "查看详情",
      delete: "删除",
      deleteConfirm: "确定要删除这条摘要吗？"
    },
    history: {
      title: "历史摘要",
      noData: "暂无历史摘要",
      createdAt: "创建时间",
      loadMore: "加载更多",
      loading: "加载中..."
    },
    detail: {
      title: "摘要详情",
      backToHistory: "返回历史记录",
      originalTranscript: "原始转录"
    },
    errors: {
      transcriptRequired: "请输入会议转录内容",
      generateFailed: "摘要生成失败",
      loadFailed: "加载失败",
      deleteFailed: "删除失败",
      networkError: "网络错误"
    }
  },
  en: {
    appTitle: "AI Meeting Digest",
    navigation: {
      home: "Create Digest",
      history: "History"
    },
    createDigest: "Create Meeting Digest",
    transcriptLabel: "Meeting Transcript *",
    transcriptPlaceholder: "Please enter meeting transcript...",
    streamingOption: "Use real-time streaming generation (show generation process)",
    generateButton: "Generate Digest",
    generating: "Generating",
    realTimeGenerating: "Real-time Generating",
    reset: "Reset",
    status: {
      started: "🚀 Starting digest generation...",
      generating: "⚡ Generating...",
      completed: "✅ Generation completed!",
      error: "❌ Generation failed"
    },
    digest: {
      overview: "Meeting Overview",
      keyDecisions: "Key Decisions",
      actionItems: "Action Items",
      shareButton: "Share Link",
      shareSuccess: "Link copied to clipboard",
      viewDetails: "View Details",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this digest?"
    },
    history: {
      title: "History Digests",
      noData: "No history digests",
      createdAt: "Created At",
      loadMore: "Load More",
      loading: "Loading..."
    },
    detail: {
      title: "Digest Details",
      backToHistory: "Back to History",
      originalTranscript: "Original Transcript"
    },
    errors: {
      transcriptRequired: "Please enter meeting transcript",
      generateFailed: "Failed to generate digest",
      loadFailed: "Failed to load",
      deleteFailed: "Failed to delete",
      networkError: "Network error"
    }
  }
};
import type { Route } from "./+types/home";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Meeting Digest" },
    { name: "description", content: "Generate AI-powered meeting summaries" },
  ];
}

interface AgendaItem {
  topic: string;
  update: string;
  blockers: string;
  action: string;
  responsible: string[];
  deadline: string;
  requires_approval: boolean;
}

interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  duration?: string;
  participants: string[];
  // 新的数据结构
  agenda?: AgendaItem[];
  key_metrics?: string[];
  next_meeting?: string;

  natural_summary?: string;
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState("");

  // 格式化AI输出内容，添加必要的换行符
  const formatAiContent = (content: string): string => {
    if (!content) return content;
    
    // 在Markdown标题前后添加换行符
    let formatted = content.replace(/(##\s*[^\n]+)/g, '\n\n$1\n\n');
    
    // 在列表项前添加换行符
    formatted = formatted.replace(/(-\s*\*\*[^*]+\*\*[^\n]*)/g, '\n$1');
    
    // 清理多余的换行符
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // 去掉开头的换行符
    formatted = formatted.replace(/^\n+/, '');
    
    return formatted;
  };
  const [useStreaming, setUseStreaming] = useState(true);

  const handleGenerateDigestStream = async () => {
    if (!transcript.trim()) {
      setError("请输入会议转录文本");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiContent("");
    setSummary(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/generate-summary-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('🚀 开始读取流式响应...');
      const reader = response.body?.getReader();
      // 明确指定UTF-8编码，确保与后端一致
      const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
      
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let result = '';
      let chunkCount = 0;
      let buffer = ''; // 用于处理不完整的SSE行
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ 流式响应读取完成，总共处理了', chunkCount, '个数据块');
          
          // 处理缓冲区中剩余的数据
          if (buffer.trim()) {
            console.log('🔄 处理缓冲区剩余数据:', buffer);
            const finalLines = [buffer];
            
            let currentEvent = '';
            for (const line of finalLines) {
              const trimmedLine = line.trim();
              
              if (trimmedLine.startsWith('event:')) {
                currentEvent = trimmedLine.substring(6).trim();
                continue;
              }
              
              if (trimmedLine.startsWith('data:')) {
                const dataStr = trimmedLine.substring(5); // 不使用trim()以保留空格
                if (!dataStr) continue;
                
                if (currentEvent === 'text_chunk') {
                  result += dataStr;
                  setAiContent(result);
                } else if (currentEvent === 'summary_complete') {
                  setSummary({
                    id: 'temp_id',
                    title: 'Meeting Summary',
                    date: new Date().toISOString(),
                    participants: [],
                    natural_summary: dataStr
                  });
                }
              }
            }
          }
          
          break;
        }
        
        chunkCount++;
        console.log(`📦 收到第${chunkCount}个数据块，字节长度:`, value?.length);
        
        // 使用stream: true确保正确处理多字节字符边界
        const chunk = decoder.decode(value, { stream: true });
        console.log(`📝 解码后的chunk内容 (长度${chunk.length}):`, chunk.substring(0, 200) + (chunk.length > 200 ? '...' : ''));
        
        // 将新数据添加到缓冲区
        buffer += chunk;
        
        // 按行分割，保留最后一个可能不完整的行
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保存最后一个可能不完整的行
        
        console.log(`📋 处理${lines.length}个完整行，缓冲区剩余:`, buffer.length, '字符');
        
        let currentEvent = '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('event:')) {
            currentEvent = trimmedLine.substring(6).trim();
            console.log('🎯 事件类型:', currentEvent);
            continue;
          }
          
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.substring(5); // 不使用trim()以保留空格
            if (!dataStr) continue;
            
            console.log('📄 原始数据字符串 (前200字符):', dataStr.substring(0, 200) + (dataStr.length > 200 ? '...' : ''));
            
            // 处理纯文本流式内容 - 直接显示AI原始输出
            if (currentEvent === 'text_chunk') {
              console.log('🤖 收到AI原始文本块:', dataStr);
              console.log('📊 文本块详情 - 长度:', dataStr.length, '内容:', JSON.stringify(dataStr));
              
              // 直接拼接AI的原始输出，然后格式化
              result += dataStr;
              const formattedContent = formatAiContent(result);
              setAiContent(formattedContent);
              console.log('📝 累计AI内容长度:', result.length, '最后30字符:', JSON.stringify(result.slice(-30)));
              
              // 不添加延迟，保持AI原始的输出节奏
              continue; // 跳过JSON解析，因为这是纯文本
            }
            
            // 处理摘要完成事件
            if (currentEvent === 'summary_complete') {
              console.log('📋 收到完整摘要:', dataStr);
              setSummary({
                id: 'temp_id',
                title: 'Meeting Summary',
                date: new Date().toISOString(),
                participants: [],
                natural_summary: dataStr
              });
              continue; // 跳过JSON解析，因为这是纯文本
            }
            
            // 处理错误事件
            if (currentEvent === 'error') {
              console.error('❌ 错误:', dataStr);
              setError(dataStr);
              return;
            }
            
            // 其他未知事件（静默处理）
            console.log('🔍 未知事件:', currentEvent, dataStr);
          }
        }
      }
    } catch (err) {
      console.error('Stream API Error:', err);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDigest = async () => {
    if (!transcript.trim()) {
      setError("Please input the meeting transcript.");
      return;
    }

    console.log('🚀 开始非流式摘要生成，转录文本长度:', transcript.length);
    setIsLoading(true);
    setError(null);
    setSummary(null);
    
    try {
      console.log('📤 发送请求到后端...');
      const response = await fetch('http://localhost:8000/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript
        })
      });

      console.log('📥 收到响应，状态码:', response.status);
      console.log('📋 响应头 Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📄 原始响应文本 (前500字符):', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      console.log('📏 响应文本长度:', responseText.length);
      console.log('🔤 响应文本字节:', new TextEncoder().encode(responseText.substring(0, 100)));
      
      const data = JSON.parse(responseText);
      console.log('✅ JSON解析成功，数据字段:', Object.keys(data));
      console.log('📋 摘要内容:', data.summary);
      
      if (data.summary) {
        // 后端现在返回包含natural_summary的结构
        setSummary(data.summary);
      } else {
        setError("Failed to generate summary. Please try again.");
      }
    } catch (err) {
      console.error('❌ 非流式请求错误:', err);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Meeting Digest
            </h1>
            <p className="text-lg text-gray-600">
              Transform your meeting transcripts into structured summaries
            </p>
          </div>
          <Link
            to="/history"
            className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            View History
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Transcript
          </label>
          <textarea
             id="transcript"
             value={transcript}
             onChange={(e) => setTranscript(e.target.value)}
             placeholder="Paste your meeting transcript here..."
             className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 bg-white"
           />
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable streaming (real-time display)</span>
            </label>
          </div>
          
          <button
            onClick={useStreaming ? handleGenerateDigestStream : handleGenerateDigest}
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (useStreaming ? "Streaming..." : "Generating Digest...") : "Generate Digest"}
          </button>
          

          
          {aiContent && useStreaming && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border streaming-container">
              <div className="max-w-full overflow-hidden break-words word-wrap">
                <div className="max-h-96 overflow-y-auto pr-2">
                  <div className="markdown-content text-gray-700 leading-relaxed">
                  <ReactMarkdown>{aiContent}</ReactMarkdown>
                  {isLoading && <span className="animate-pulse ml-1 text-blue-500">|</span>}
                </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {summary && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{summary.title}</h2>
            
            {/* 自然语言摘要 */}
            {summary.natural_summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">会议摘要</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="markdown-content">
                    <ReactMarkdown>{summary.natural_summary}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

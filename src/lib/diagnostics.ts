/**
 * Network diagnostics and connection testing utilities
 */

// 存储定时器引用
let diagnosticsTimer: NodeJS.Timeout | null = null;
let lastDiagnosticsRun: Date | null = null;

export interface DiagnosticResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
  details?: Record<string, unknown>;
}

export interface NetworkDiagnostics {
  overall: boolean;
  results: DiagnosticResult[];
  recommendations: string[];
}

/**
 * Run comprehensive network diagnostics
 */
export async function runNetworkDiagnostics(apiKey?: string): Promise<NetworkDiagnostics> {
  const results: DiagnosticResult[] = [];
  const recommendations: string[] = [];

  // Test 1: Basic internet connectivity
  try {
    const start = Date.now();
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    const duration = Date.now() - start;

    if (response.ok) {
      results.push({
        name: 'Internet Connectivity',
        success: true,
        message: 'Basic internet connection is working',
        duration,
      });
    } else {
      results.push({
        name: 'Internet Connectivity',
        success: false,
        message: `HTTP error: ${response.status}`,
        duration,
      });
      recommendations.push('Check your internet connection');
    }
  } catch (error) {
    results.push({
      name: 'Internet Connectivity',
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    });
    recommendations.push('Check your internet connection and firewall settings');
  }

  // Test 2: DNS resolution for Google APIs
  try {
    const start = Date.now();
    await fetch('https://generativelanguage.googleapis.com/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    const duration = Date.now() - start;

    results.push({
      name: 'Google API DNS Resolution',
      success: true,
      message: 'Can reach Google Generative Language API domain',
      duration,
    });
  } catch (error) {
    results.push({
      name: 'Google API DNS Resolution',
      success: false,
      message: error instanceof Error ? error.message : 'DNS resolution failed',
    });
    recommendations.push('Check DNS settings or try using a different DNS server (8.8.8.8)');
  }

  // Test 3: API key validation (if provided)
  if (apiKey) {
    try {
      const start = Date.now();
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      const duration = Date.now() - start;

      if (response.ok) {
        results.push({
          name: 'API Key Validation',
          success: true,
          message: 'API key is valid and working',
          duration,
        });
      } else {
        const status = response.status;
        let message = `API returned status ${status}`;

        if (status === 401 || status === 403) {
          message = 'Invalid API key or insufficient permissions';
          recommendations.push('Check your Google API key in the environment variables');
          recommendations.push('Ensure the API key has Generative AI permissions enabled');
        } else if (status === 429) {
          message = 'API quota exceeded';
          recommendations.push('Wait for quota reset or upgrade your API plan');
        }

        results.push({
          name: 'API Key Validation',
          success: false,
          message,
          duration,
          details: { status, statusText: response.statusText },
        });
      }
    } catch (error) {
      results.push({
        name: 'API Key Validation',
        success: false,
        message: error instanceof Error ? error.message : 'API key test failed',
      });

      if (error instanceof Error && error.message.includes('timeout')) {
        recommendations.push('API requests are timing out - check network stability');
      }
    }
  } else {
    results.push({
      name: 'API Key Validation',
      success: false,
      message: 'No API key provided for testing',
    });
    recommendations.push('Set GOOGLE_API_KEY environment variable');
  }

  // Test 4: Gemini model availability
  if (apiKey) {
    try {
      const start = Date.now();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Hello' }],
              },
            ],
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      const duration = Date.now() - start;

      if (response.ok) {
        results.push({
          name: 'Gemini Model Test',
          success: true,
          message: 'Gemini 2.0 Flash model is accessible and responding',
          duration,
        });
      } else {
        const status = response.status;
        results.push({
          name: 'Gemini Model Test',
          success: false,
          message: `Model test failed with status ${status}`,
          duration,
          details: { status, statusText: response.statusText },
        });

        if (status === 404) {
          recommendations.push('Gemini 2.0 Flash model may not be available in your region');
        }
      }
    } catch (error) {
      results.push({
        name: 'Gemini Model Test',
        success: false,
        message: error instanceof Error ? error.message : 'Model test failed',
      });

      if (error instanceof Error && error.message.includes('timeout')) {
        recommendations.push('Gemini API calls are timing out - try reducing content size or increasing timeout');
      }
    }
  }

  // Generate overall assessment
  const successCount = results.filter((r) => r.success).length;
  const overall = successCount === results.length;

  // Add general recommendations
  if (!overall) {
    recommendations.push('Check your network connection and firewall settings');
    recommendations.push('Verify your Google API key is correct and has proper permissions');
    recommendations.push('Try running the application from a different network');
  }

  return {
    overall,
    results,
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
}

/**
 * Format diagnostics results for display
 */
export function formatDiagnosticsReport(diagnostics: NetworkDiagnostics): string {
  let report = '=== Network Diagnostics Report ===\n\n';

  report += `Overall Status: ${diagnostics.overall ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}\n\n`;

  report += 'Test Results:\n';
  for (const result of diagnostics.results) {
    const icon = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    report += `${icon} ${result.name}: ${result.message}${duration}\n`;

    if (result.details) {
      report += `   Details: ${JSON.stringify(result.details)}\n`;
    }
  }

  if (diagnostics.recommendations.length > 0) {
    report += '\nRecommendations:\n';
    for (const rec of diagnostics.recommendations) {
      report += `• ${rec}\n`;
    }
  }

  return report;
}

/**
 * 启动网络诊断定时器，每12小时运行一次
 */
export function startDiagnosticsTimer(apiKey?: string): void {
  // 如果已有定时器在运行，先清除
  if (diagnosticsTimer) {
    clearInterval(diagnosticsTimer);
  }

  console.log('Starting network diagnostics timer (every 12 hours)...');

  // 12小时 = 12 * 60 * 60 * 1000 毫秒
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  // 包装诊断函数以处理错误和日志
  const runDiagnosticsWithLogging = async () => {
    try {
      console.log('Running scheduled network diagnostics...');
      const startTime = Date.now();

      const diagnostics = await runNetworkDiagnostics(apiKey);
      const report = formatDiagnosticsReport(diagnostics);

      const duration = Date.now() - startTime;
      lastDiagnosticsRun = new Date();

      console.log(`\n=== Scheduled Diagnostics Report (${lastDiagnosticsRun.toISOString()}) ===`);
      console.log(report);
      console.log(`Diagnostics completed in ${duration}ms`);
      console.log('================================================\n');
    } catch (error) {
      console.error('Scheduled diagnostics failed:', error);
    }
  };

  // 立即运行一次
  runDiagnosticsWithLogging();

  // 设置定时器每12小时运行一次
  diagnosticsTimer = setInterval(runDiagnosticsWithLogging, TWELVE_HOURS);
}

/**
 * 停止网络诊断定时器
 */
export function stopDiagnosticsTimer(): void {
  if (diagnosticsTimer) {
    clearInterval(diagnosticsTimer);
    diagnosticsTimer = null;
    console.log('Network diagnostics timer stopped');
  }
}

/**
 * 获取上次诊断运行时间
 */
export function getLastDiagnosticsRun(): Date | null {
  return lastDiagnosticsRun;
}

/**
 * 检查定时器是否正在运行
 */
export function isDiagnosticsTimerRunning(): boolean {
  return diagnosticsTimer !== null;
}

import { NextResponse } from 'next/server';
import {
  runNetworkDiagnostics,
  formatDiagnosticsReport,
  startDiagnosticsTimer,
  stopDiagnosticsTimer,
  getLastDiagnosticsRun,
  isDiagnosticsTimerRunning,
} from '@/lib/diagnostics';

// 在模块加载时自动启动定时器（仅在服务器端）
if (typeof window === 'undefined') {
  // 延迟启动以避免在构建时执行
  setTimeout(() => {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (apiKey && !isDiagnosticsTimerRunning()) {
      console.log('Auto-starting diagnostics timer on server startup...');
      startDiagnosticsTimer(apiKey);
    }
  }, 1000);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'run';
    const apiKey = process.env.GOOGLE_API_KEY?.trim();

    if (action === 'start-timer') {
      startDiagnosticsTimer(apiKey);
      return NextResponse.json({
        success: true,
        message: 'Diagnostics timer started (runs every 12 hours)',
        isTimerRunning: true,
        lastRun: getLastDiagnosticsRun(),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'stop-timer') {
      stopDiagnosticsTimer();
      return NextResponse.json({
        success: true,
        message: 'Diagnostics timer stopped',
        isTimerRunning: false,
        lastRun: getLastDiagnosticsRun(),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        isTimerRunning: isDiagnosticsTimerRunning(),
        lastRun: getLastDiagnosticsRun(),
        timestamp: new Date().toISOString(),
      });
    }

    // 默认行为：运行一次诊断
    console.log('Running network diagnostics...');
    const diagnostics = await runNetworkDiagnostics(apiKey);

    const report = formatDiagnosticsReport(diagnostics);
    console.log('\n' + report);

    return NextResponse.json({
      success: diagnostics.overall,
      diagnostics,
      report,
      isTimerRunning: isDiagnosticsTimerRunning(),
      lastTimerRun: getLastDiagnosticsRun(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Diagnostics error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
        isTimerRunning: isDiagnosticsTimerRunning(),
        lastTimerRun: getLastDiagnosticsRun(),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DigestCreator } from '@/components/DigestCreator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl mb-4 shadow-lg">
              🤖
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            AI Meeting Digest
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your meeting transcripts into structured summaries with AI-powered insights, key decisions, and action items
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/digests">
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white/50 backdrop-blur-sm border-gray-200 hover:bg-white/70 shadow-md"
              >
                📋 View Past Digests
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-center">Create New Digest</CardTitle>
              <CardDescription className="text-center text-base">
                Paste your meeting transcript below and get an AI-generated summary with key decisions and action items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DigestCreator />
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                📝
              </div>
              <CardTitle className="text-xl">Smart Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get concise overviews of your meetings with key points highlighted and structured for easy reading.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                ✅
              </div>
              <CardTitle className="text-xl">Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Automatically extract action items and assignments from transcripts with responsible parties identified.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🔗
              </div>
              <CardTitle className="text-xl">Share Easily</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Generate shareable links for your team to access meeting summaries with privacy controls.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Powered by Google Gemini AI • Secure and Private
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Mock responses for testing when network is unavailable
 */

export const mockGeminiResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: `# Meeting Summary

## Key Topics Discussed
- Project timeline and milestones
- Resource allocation and team assignments
- Technical challenges and solutions
- Budget considerations and approval process

## Action Items
1. **Project Manager**: Finalize project timeline by end of week
2. **Development Team**: Review technical requirements and provide estimates
3. **Finance Team**: Prepare budget proposal for next quarter
4. **All Team Members**: Submit individual progress reports by Friday

## Key Decisions Made
- Approved additional budget for new development tools
- Decided to extend project timeline by 2 weeks for quality assurance
- Agreed to implement weekly check-ins for better communication

## Next Steps
- Schedule follow-up meeting for next week
- Circulate meeting notes to all stakeholders
- Begin implementation of approved action items

*This is a mock response generated for testing purposes when network connectivity is unavailable.*`,
          },
        ],
      },
    },
  ],
};

export const mockStreamingChunks = [
  { text: '# Meeting Summary\n\n' },
  { text: '## Key Topics Discussed\n' },
  { text: '- Project timeline and milestones\n' },
  { text: '- Resource allocation and team assignments\n' },
  { text: '- Technical challenges and solutions\n' },
  { text: '- Budget considerations and approval process\n\n' },
  { text: '## Action Items\n' },
  { text: '1. **Project Manager**: Finalize project timeline by end of week\n' },
  { text: '2. **Development Team**: Review technical requirements and provide estimates\n' },
  { text: '3. **Finance Team**: Prepare budget proposal for next quarter\n' },
  { text: '4. **All Team Members**: Submit individual progress reports by Friday\n\n' },
  { text: '## Key Decisions Made\n' },
  { text: '- Approved additional budget for new development tools\n' },
  { text: '- Decided to extend project timeline by 2 weeks for quality assurance\n' },
  { text: '- Agreed to implement weekly check-ins for better communication\n\n' },
  { text: '## Next Steps\n' },
  { text: '- Schedule follow-up meeting for next week\n' },
  { text: '- Circulate meeting notes to all stakeholders\n' },
  { text: '- Begin implementation of approved action items\n\n' },
  { text: '*This is a mock response generated for testing purposes when network connectivity is unavailable.*' },
];

/**
 * Check if we should use mock responses (for offline testing)
 */
export function shouldUseMockResponse(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.USE_MOCK_RESPONSES === 'true';
}

/**
 * Simulate network delay for more realistic testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock streaming response
 */
export async function* createMockStreamingResponse() {
  for (const chunk of mockStreamingChunks) {
    await delay(50 + Math.random() * 100); // Random delay between 50-150ms
    yield chunk;
  }
}

/**
 * Get mock response for non-streaming requests
 */
export async function getMockResponse(): Promise<typeof mockGeminiResponse> {
  await delay(500 + Math.random() * 1000); // Simulate API delay
  return mockGeminiResponse;
}

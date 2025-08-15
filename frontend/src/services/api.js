const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const processTranscript = async (transcript) => {
  try {
    console.log('Making request to:', `${API_BASE_URL}/api/digests`);
    const response = await fetch(`${API_BASE_URL}/api/digests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error('Failed to process transcript');
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Full error:', error);
    throw error;
  }
};
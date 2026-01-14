export interface AssessmentPayload {
  file: {
    name: string;
    size: number;
    type: string;
  };
  companyName?: string;
  ticker?: string;
  sector?: string;
  objective: 'new' | 'increase' | 'monitor';
  riskAppetite: 'conservative' | 'balanced' | 'aggressive';
  timeHorizon?: 'short' | 'mid' | 'long';
}

export interface AssessmentJobResponse {
  jobId: string;
}

/**
 * Mock API function to start an assessment job
 * Simulates API call with latency
 */
export async function startAssessmentJob(
  payload: AssessmentPayload
): Promise<AssessmentJobResponse> {
  return new Promise((resolve) => {
    // Log payload for debugging (payload is used, just not in the resolve)
    console.log('Starting assessment job with payload:', payload);
    setTimeout(() => {
      // Generate a mock job ID
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      resolve({ jobId });
    }, 1500); // Simulate 1.5s API latency
  });
}

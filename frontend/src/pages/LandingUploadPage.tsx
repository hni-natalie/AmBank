import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCard, UploadedFile } from '../components/landing/UploadCard';
import { QuickSettingsCard } from '../components/landing/QuickSettingsCard';
import { StepPreview } from '../components/landing/StepPreview';
import { startAssessmentJob, AssessmentPayload } from '../mock/uploadJob';
import styles from './LandingUploadPage.module.css';

export function LandingUploadPage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'RM' | 'Analyst'>('RM');
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('');
  const [sector, setSector] = useState('');
  const [objective, setObjective] = useState<'new' | 'increase' | 'monitor'>('new');
  const [riskAppetite, setRiskAppetite] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [timeHorizon, setTimeHorizon] = useState<'short' | 'mid' | 'long' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRunAssessment = async () => {
    if (!file) {
      setErrorMessage('Please upload a PDF portfolio.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const payload: AssessmentPayload = {
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        companyName: companyName || undefined,
        ticker: ticker || undefined,
        sector: sector || undefined,
        objective,
        riskAppetite,
        timeHorizon: timeHorizon || undefined
      };

      const response = await startAssessmentJob(payload);
      navigate(`/result/${response.jobId}`);
    } catch (error) {
      setErrorMessage('Failed to start assessment. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
      setIsProcessing(false);
    }
  };

  const handleUseSample = () => {
    // Create a mock file state
    const sampleFile: UploadedFile = {
      name: 'sample_portfolio.pdf',
      size: 245678,
      type: 'application/pdf',
      file: new File([''], 'sample_portfolio.pdf', { type: 'application/pdf' })
    };
    setFile(sampleFile);
    setCompanyName('Sample Company Inc.');
    setTicker('SMPL');
    setSector('Technology');
    setErrorMessage('');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.productName}>Relationship Intelligence</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.roleToggle}>
            <button
              type="button"
              className={`${styles.roleButton} ${userRole === 'RM' ? styles.roleButtonActive : ''}`}
              onClick={() => setUserRole('RM')}
            >
              RM
            </button>
            <button
              type="button"
              className={`${styles.roleButton} ${userRole === 'Analyst' ? styles.roleButtonActive : ''}`}
              onClick={() => setUserRole('Analyst')}
            >
              Analyst
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Assess Relationship with Target Company</h1>
            <p className={styles.subtitle}>
              Upload the client portfolio / financial summary to generate an evidence-backed
              connect/caution decision.
            </p>
          </div>

          <div className={styles.twoColumnLayout}>
            <div className={styles.leftColumn}>
              <UploadCard
                file={file}
                onFileSelect={setFile}
                companyName={companyName}
                ticker={ticker}
                sector={sector}
                onCompanyNameChange={setCompanyName}
                onTickerChange={setTicker}
                onSectorChange={setSector}
              />
            </div>

            <div className={styles.rightColumn}>
              <QuickSettingsCard
                objective={objective}
                riskAppetite={riskAppetite}
                timeHorizon={timeHorizon}
                onObjectiveChange={setObjective}
                onRiskAppetiteChange={setRiskAppetite}
                onTimeHorizonChange={setTimeHorizon}
                onRunAssessment={handleRunAssessment}
                onUseSample={handleUseSample}
                hasFile={!!file}
                isProcessing={isProcessing}
              />
            </div>
          </div>

          <div className={styles.stepPreviewSection}>
            <StepPreview />
          </div>

          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { initDB, validateStorageTable, getStorageEntries, updateKeyValue, createFpsTrigger, updateMenuDataAndPlayMenuInfo } from '@/lib/utils';
import { StepNavigator } from '@/components/step-navigator';
import { StepContent, ModifiedEntry } from '@/components/step-content';
import { Database } from 'sql.js';

export default function App() {
  const [originalDb, setOriginalDb] = useState<Database | null>(null);
  const [originalDbBytes, setOriginalDbBytes] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string>('');
  const [entries, setEntries] = useState<ModifiedEntry[]>([]);
  const [modifiedEntries, setModifiedEntries] = useState<Record<string, string | number>>({});
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleFileLoad = async (arrayBuffer: ArrayBuffer) => {
    // Initialize the original database
    const result = await initDB(arrayBuffer);
    if (!result.ok) return setError(result.error);
    const originalDatabase = result.value
    const validationError = validateStorageTable(originalDatabase);
    if (validationError) return setError(validationError);

    // Store the original database bytes
    setOriginalDbBytes(new Uint8Array(arrayBuffer));
    setCurrentStep(currentStep + 1); // Move to the next step after successful DB load
    const storageEntries = getStorageEntries(originalDatabase);
    setEntries(storageEntries.map(entry => ({
      key: entry.key,
      originalValue: entry.value,
      currentValue: entry.value
    })));

    setOriginalDb(originalDatabase);
    setError('');
  };

  const handleValueChange = (key: string, value: string | number) => {
    // Create a new object to hold all the changes we need to make
    const changes: Record<string, string | number> = { [key]: value };

    // Apply conditional logic for Ray Tracing settings
    if (key === 'RayTracing') {
      // If Ray Tracing is turned off (value === 0), set related settings to 0
      if (value === 0) {
        changes['RayTracedReflection'] = 0;
        changes['RayTracedGI'] = 0;

        // When Ray Tracing is off, restore XessEnable and XessQuality to their original values
        const xessEnableEntry = entries.find(e => e.key === 'XessEnable');
        const xessQualityEntry = entries.find(e => e.key === 'XessQuality');

        if (xessEnableEntry) {
          changes['XessEnable'] = xessEnableEntry.originalValue;
        }

        if (xessQualityEntry) {
          changes['XessQuality'] = xessQualityEntry.originalValue;
        }
      } else {
        // When Ray Tracing is on, set XessEnable and XessQuality to 0
        changes['XessEnable'] = 0;
        changes['XessQuality'] = 0;
      }
    }

    // Apply all changes to the modifiedEntries state
    setModifiedEntries(prev => ({
      ...prev,
      ...changes
    }));

    // Update the entries state to reflect all changes
    setEntries(prev => prev.map(entry => {
      if (Object.prototype.hasOwnProperty.call(changes, entry.key)) {
        return { ...entry, currentValue: changes[entry.key] };
      }
      return entry;
    }));
  };

  const handleOriginalDownload = () => {
    if (!originalDbBytes) return;

    const blob = new Blob([originalDbBytes], { type: 'application/vnd.sqlite3' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'LocalStorage.db';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // What
    URL.revokeObjectURL(url);
  };

  const handleModifiedDownload = async () => {
    if (!originalDbBytes) return;

    // Create a fresh copy of the database for export
    const result = await initDB(originalDbBytes.buffer);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const tempDb = result.value;

    // Apply all modifications to the temporary database
    Object.entries(modifiedEntries).forEach(([key, value]) => {
      updateKeyValue(tempDb, key, value);
    });

    // Check if 120 FPS is enabled
    const isFpsUnlockEnabled = modifiedEntries['CustomFrameRate'] === 120;
    if (isFpsUnlockEnabled) {
      // Create the trigger to prevent CustomFrameRate from being changed
      createFpsTrigger(tempDb, 120);
      
      // Update MenuData and PlayMenuInfo with optimized settings for 120 FPS
      updateMenuDataAndPlayMenuInfo(tempDb);
    }

    // Export the modified database
    const data = tempDb.export();
    const blob = new Blob([data], { type: 'application/vnd.sqlite3' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'LocalStorage.db';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Define steps for the wizard interface
  const steps = [
    {
      title: 'Instructions',
      content: (
        <StepContent
          step={0}
          onFileLoad={handleFileLoad}
          entries={entries}
          modifiedEntries={modifiedEntries}
          handleValueChange={handleValueChange}
          handleOriginalDownload={handleOriginalDownload}
          handleModifiedDownload={handleModifiedDownload}
        />
      ),
    },
    {
      title: 'Load DB',
      content: (
        <StepContent
          step={1}
          onFileLoad={handleFileLoad}
          entries={entries}
          modifiedEntries={modifiedEntries}
          handleValueChange={handleValueChange}
          handleOriginalDownload={handleOriginalDownload}
          handleModifiedDownload={handleModifiedDownload}
        />
      ),
    },
    {
      title: 'Configure',
      content: (
        <StepContent
          step={2}
          onFileLoad={handleFileLoad}
          entries={entries}
          modifiedEntries={modifiedEntries}
          handleValueChange={handleValueChange}
          handleOriginalDownload={handleOriginalDownload}
          handleModifiedDownload={handleModifiedDownload}
        />
      ),
    },
    {
      title: 'Preview',
      content: (
        <StepContent
          step={3}
          onFileLoad={handleFileLoad}
          entries={entries}
          modifiedEntries={modifiedEntries}
          handleValueChange={handleValueChange}
          handleOriginalDownload={handleOriginalDownload}
          handleModifiedDownload={handleModifiedDownload}
        />
      ),
    },
    {
      title: 'Download',
      content: (
        <StepContent
          step={4}
          onFileLoad={handleFileLoad}
          entries={entries}
          modifiedEntries={modifiedEntries}
          handleValueChange={handleValueChange}
          handleOriginalDownload={handleOriginalDownload}
          handleModifiedDownload={handleModifiedDownload}
        />
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-screen-lg">
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}
      
      <StepNavigator
        steps={steps}
        currentStep={currentStep}
        originalDb={originalDb}
        onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
      />
      
      <Card className="fixed bottom-0 left-0 w-full p-1 backdrop-blur bg-background/5 border-t">
        <div className="text-center text-sm text-muted-foreground">
          wuwaconf - <a href='https://github.com/kyoukaya/wuwaconf' className="hover:text-blue-700 underline">github</a>
        </div>
      </Card>
    </div>
  );
}

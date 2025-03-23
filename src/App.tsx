import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { initDB, validateStorageTable, getStorageEntries, updateKeyValue } from '@/lib/utils';
import { StepNavigator } from '@/components/step-navigator';
import { StepContent } from '@/components/step-content';

type ModifiedEntry = {
  key: string;
  originalValue: string | number;
  currentValue: string | number;
};

export default function App() {
  const [originalDb, setOriginalDb] = useState<any>(null);
  const [originalDbBytes, setOriginalDbBytes] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string>('');
  const [entries, setEntries] = useState<ModifiedEntry[]>([]);
  const [modifiedEntries, setModifiedEntries] = useState<Record<string, string | number>>({});
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleFileUpload = async (arrayBuffer: ArrayBuffer) => {
    // Initialize the original database
    const { db: originalDatabase, error: dbError } = await initDB(arrayBuffer);
    if (dbError) return setError(dbError);

    const validationError = validateStorageTable(originalDatabase);
    if (validationError) return setError(validationError);

    // Store the original database bytes
    setOriginalDbBytes(new Uint8Array(arrayBuffer));
    setCurrentStep(2); // Move to the next step after successful upload

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
      if (changes.hasOwnProperty(entry.key)) {
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
    a.download = 'LocalStorage_Original.db';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleModifiedDownload = async () => {
    if (!originalDbBytes) return;

    // Create a fresh copy of the database for export
    const { db: tempDb } = await initDB(originalDbBytes.buffer);

    // Apply all modifications to the temporary database
    Object.entries(modifiedEntries).forEach(([key, value]) => {
      updateKeyValue(tempDb, key, value);
    });

    // Export the modified database
    const data = tempDb.export();
    const blob = new Blob([data], { type: 'application/vnd.sqlite3' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'LocalStorage_Modified.db';
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
          onFileUpload={handleFileUpload}
          entries={entries}
          modifiedEntries={modifiedEntries}
          handleValueChange={handleValueChange}
          handleOriginalDownload={handleOriginalDownload}
          handleModifiedDownload={handleModifiedDownload}
        />
      ),
    },
    {
      title: 'Upload',
      content: (
        <StepContent
          step={1}
          onFileUpload={handleFileUpload}
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
          onFileUpload={handleFileUpload}
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
          onFileUpload={handleFileUpload}
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
          onFileUpload={handleFileUpload}
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
    <div className="container mx-auto p-4 space-y-6">
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
          wuwaconf
        </div>
      </Card>
    </div>
  );
}

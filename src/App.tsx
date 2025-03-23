import { useState } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initDB, validateStorageTable, getStorageEntries, updateKeyValue } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

  const handleFileUpload = async (arrayBuffer: ArrayBuffer) => {
    // Initialize the original database
    const { db: originalDatabase, error: dbError } = await initDB(arrayBuffer);
    if (dbError) return setError(dbError);

    const validationError = validateStorageTable(originalDatabase);
    if (validationError) return setError(validationError);

    // Store the original database bytes
    setOriginalDbBytes(new Uint8Array(arrayBuffer));

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

  const frameRateEntry = entries.find(e => e.key === 'CustomFrameRate');
  const rayTracingEntry = entries.find(e => e.key === 'RayTracing');

  return (
    <div className="container mx-auto p-4 space-y-6">
      {!originalDb ? (
        <FileUploader onFileUpload={handleFileUpload} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Frame Rate Configuration</h2>
              <div className="space-y-2">
                <Label>Custom Frame Rate
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>(?)</TooltipTrigger>
                      <TooltipContent>
                        <p>Any value between 30 and 120 is valid.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider></Label>
                <Input
                  type="number"
                  min="30"
                  max="120"
                  value={modifiedEntries['CustomFrameRate'] ?? frameRateEntry?.originalValue}
                  onChange={(e) => handleValueChange('CustomFrameRate', parseInt(e.target.value))}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value)) {
                      // If value is NaN, reset to original value from DB
                      handleValueChange('CustomFrameRate', frameRateEntry?.originalValue as number);
                      return;
                    }

                    // Clamp value between min and max
                    const clampedValue = Math.min(Math.max(value, 30), 120);
                    if (clampedValue !== value) {
                      handleValueChange('CustomFrameRate', clampedValue);
                    }
                  }}
                />
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Ray Tracing Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Main Ray Tracing
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>(?)</TooltipTrigger>
                        <TooltipContent>
                            <p>If not off, XessEnable and XessQuality will be set to 0 automatically.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select
                    value={modifiedEntries['RayTracing']?.toString() ?? rayTracingEntry?.originalValue?.toString()}
                    onValueChange={(value) => handleValueChange('RayTracing', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select RT setting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Off</SelectItem>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {rayTracingEntry && rayTracingEntry.currentValue !== 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <Label className="flex-1">Ray Traced Reflections</Label>
                      <div className="flex items-center h-10">
                        <input
                          type="checkbox"
                          id="ray-traced-reflections"
                          className="h-4 w-4"
                          checked={(modifiedEntries['RayTracedReflection'] ?? entries.find(e => e.key === 'RayTracedReflection')?.originalValue) === 1}
                          onChange={(e) => handleValueChange('RayTracedReflection', e.target.checked ? 1 : 0)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Label className="flex-1">Ray Traced Global Illumination</Label>
                      <div className="flex items-center h-10">
                        <input
                          type="checkbox"
                          id="ray-traced-gi"
                          className="h-4 w-4"
                          checked={(modifiedEntries['RayTracedGI'] ?? entries.find(e => e.key === 'RayTracedGI')?.originalValue) === 1}
                          onChange={(e) => handleValueChange('RayTracedGI', e.target.checked ? 1 : 0)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* XessEnable and XessQuality settings */}
                <div className="space-y-2 mt-4">
                  <h3 className="text-md font-medium">Intel XeSS Settings</h3>
                  <div className="flex items-center space-x-4">

                    <Label className="flex-1">XeSS Enable</Label>


                    <div className="flex items-center h-10">
                      <input
                        type="checkbox"
                        id="xess-enable"
                        className="h-4 w-4"
                        checked={(modifiedEntries['XessEnable'] ?? entries.find(e => e.key === 'XessEnable')?.originalValue) === 1}
                        onChange={(e) => handleValueChange('XessEnable', e.target.checked ? 1 : 0)}
                        disabled={rayTracingEntry && rayTracingEntry.currentValue !== 0}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Label className="flex-1">XeSS Quality
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>(?)</TooltipTrigger>
                          <TooltipContent>
                            <p>I don't actually know what this means but it should only be 0 or 1?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider></Label>
                    <Select
                      value={modifiedEntries['XessQuality']?.toString() ?? entries.find(e => e.key === 'XessQuality')?.originalValue?.toString()}
                      onValueChange={(value) => handleValueChange('XessQuality', parseInt(value))}
                      disabled={rayTracingEntry && rayTracingEntry.currentValue !== 0}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Configuration Values</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Key</th>
                    <th className="text-left p-2">Original Value</th>
                    <th className="text-left p-2">Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {entries
                    .filter(entry => ['CustomFrameRate', 'RayTracing', 'RayTracedReflection', 'RayTracedGI', 'XessEnable', 'XessQuality'].includes(entry.key))
                    .map((entry) => (
                      <tr key={entry.key} className="border-b">
                        <td className="p-2">{entry.key}</td>
                        <td className={`p-2 ${entry.currentValue === entry.originalValue ? 'text-gray-400' : ''}`}>{entry.originalValue}</td>
                        <td className={`p-2 ${entry.currentValue !== entry.originalValue ? 'text-green-500 font-bold' : 'text-gray-400'}`}>
                          {entry.currentValue}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => handleOriginalDownload()}>
              Download Original
            </Button>
            <Button onClick={() => handleModifiedDownload()}>Download Modified</Button>
          </div>
        </div>
      )}

      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}
    </div>
  );
}

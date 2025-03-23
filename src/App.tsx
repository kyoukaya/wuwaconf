import { useState } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initDB, validateStorageTable, getStorageEntries, updateKeyValue } from '@/lib/utils';

type ModifiedEntry = {
  key: string;
  originalValue: string | number;
  currentValue: string | number;
};

export default function App() {
  const [db, setDb] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [entries, setEntries] = useState<ModifiedEntry[]>([]);
  const [modifiedEntries, setModifiedEntries] = useState<Record<string, string | number>>({});

  const handleFileUpload = async (arrayBuffer: ArrayBuffer) => {
    const { db: database, error: dbError } = await initDB(arrayBuffer);
    if (dbError) return setError(dbError);

    const validationError = validateStorageTable(database);
    if (validationError) return setError(validationError);

    const storageEntries = getStorageEntries(database);
    setEntries(storageEntries.map(entry => ({
      key: entry.key,
      originalValue: entry.value,
      currentValue: entry.value
    })));
    setDb(database);
    setError('');
  };

  const handleValueChange = (key: string, value: string | number) => {
    setModifiedEntries(prev => ({
      ...prev,
      [key]: value
    }));
    
    if (db) {
      updateKeyValue(db, key, value);
      setEntries(prev => prev.map(entry =>
        entry.key === key ? { ...entry, currentValue: value } : entry
      ));
    }
  };

  const handleDownload = (original = false) => {
    if (!db) return;

    const data = db.export();
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

  const frameRateEntry = entries.find(e => e.key === 'CustomFrameRate');
  const rayTracingEntry = entries.find(e => e.key === 'RayTracing');

  return (
    <div className="container mx-auto p-4 space-y-6">
      {!db ? (
        <FileUploader onFileUpload={handleFileUpload} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Frame Rate Configuration</h2>
              <div className="space-y-2">
                <Label>Custom Frame Rate</Label>
                <Input
                  type="number"
                  min="30"
                  max="120"
                  value={modifiedEntries['CustomFrameRate'] ?? frameRateEntry?.originalValue}
                  onChange={(e) => handleValueChange('CustomFrameRate', parseInt(e.target.value))}
                />
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Ray Tracing Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Main Ray Tracing</Label>
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
                      <Select
                        value={modifiedEntries['RayTracedReflection']?.toString() ?? entries.find(e => e.key === 'RayTracedReflection')?.originalValue?.toString()}
                        onValueChange={(value) => handleValueChange('RayTracedReflection', parseInt(value))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Off</SelectItem>
                          <SelectItem value="1">On</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Label className="flex-1">Ray Traced Global Illumination</Label>
                      <Select
                        value={modifiedEntries['RayTracedGI']?.toString() ?? entries.find(e => e.key === 'RayTracedGI')?.originalValue?.toString()}
                        onValueChange={(value) => handleValueChange('RayTracedGI', parseInt(value))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Off</SelectItem>
                          <SelectItem value="1">On</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
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
                    <th className="text-left p-2">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {entries
                    .filter(entry => ['CustomFrameRate','RayTracing','RayTracedReflection','RayTracedGI'].includes(entry.key))
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
            <Button variant="outline" onClick={() => handleDownload(true)}>
              Download Original
            </Button>
            <Button onClick={() => handleDownload()}>Download Modified</Button>
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

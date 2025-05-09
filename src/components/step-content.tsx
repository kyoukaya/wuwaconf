import { FileLoader } from '@/components/file-loader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export type ModifiedEntry = {
  key: string;
  originalValue: string | number;
  currentValue: string | number;
};

type StepContentProps = {
  step: number;
  onFileLoad: (file: ArrayBuffer) => void;
  entries: ModifiedEntry[];
  modifiedEntries: Record<string, string | number>;
  handleValueChange: (key: string, value: string | number) => void;
  handleOriginalDownload: () => void;
  handleModifiedDownload: () => void;
};

export function StepContent({
  step,
  onFileLoad: onFileLoad,
  entries,
  modifiedEntries,
  handleValueChange,
  handleOriginalDownload,
  handleModifiedDownload,
}: StepContentProps) {
  const frameRateEntry = entries.find(e => e.key === 'CustomFrameRate');
  const rayTracingEntry = entries.find(e => e.key === 'RayTracing');

  switch (step) {
    case 0: // Instructions
      return (
        <Card className="p-6">
          <p className="text-lg font-bold">Now with version 2.2 FPS unlocking support!</p>
          <br></br>
          <p>
            Thanks for trying out wuwaconf, a simple DB config editor for Wuthering Waves inspired by <a href='https://github.com/WakuWakuPadoru/WuWa_Simple_FPSUnlocker' target='_blank'>WakuWakuPadoru's FPS unlocker</a> and with the help of <a href='https://www.youtube.com/watch?v=suPQqPIG0eY'>eto gg's YouTube video</a>.
         </p>
          <br></br>
          <p>
            From your Wuthering Waves launcher's folder, navigate to <code>Wuthering Waves Game\Client\Saved\LocalStorage</code>.
            The <code>LocalStorage.db</code> file should be contained there. Drag and drop it below to begin editing the configuration.
          </p>
          <br></br>
          <p>
            Once done, just hit the Download Modified button at the bottom of the page and replace the file in your game's directory. If there's any issue, a backup copy of your original file is on this page until you refresh!
          </p>
          <br></br>
          <p>
            For Ray Tracing unlocking you will still need to update the game's .ini file by yourself at this point. See <a href='https://www.reddit.com/r/WutheringWaves/comments/1iokdne/ray_tracing_on_an_amd_gpu/mck6tdb/' target="_blank">this reddit post</a> for more info.
          </p>
        </Card>
      );

    case 1: // File load
      return <FileLoader onFileLoad={onFileLoad} isDbLoaded={entries.length > 0} />;

    case 2: // Configuration
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Frame Rate Configuration</h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <Label className="flex-1">
                    Enable 120 FPS Unlock
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>(?)</TooltipTrigger>
                        <TooltipContent>
                          <p>Enables a fixed 120 FPS setting with a trigger to prevent it from being changed.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      id="fps-unlock"
                      className="h-4 w-4"
                      checked={(modifiedEntries['CustomFrameRate'] === 120)}
                      onChange={(e) => handleValueChange('CustomFrameRate', e.target.checked ? 120 : frameRateEntry?.originalValue ?? 60)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Ray Tracing Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Main Ray Tracing
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
                    value={modifiedEntries['RayTracing']?.toString() ?? rayTracingEntry?.originalValue?.toString() ?? '0'}
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
                    <Label className="flex-1">
                      XeSS Quality
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>(?)</TooltipTrigger>
                          <TooltipContent>
                            <p>I don't actually know what this means but it should only be 0 or 1?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select
                      value={modifiedEntries['XessQuality']?.toString() ?? entries.find(e => e.key === 'XessQuality')?.originalValue?.toString() ?? '0'}
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
        </div>
      );

    case 3: // Preview of changes
      return (
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
      );

    case 4: // Download options
      return (
        <Card className="p-6">
          <p className="text-muted-foreground mb-6">
            You can download the original database you dropped on this page if you lost your backup.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleModifiedDownload}>Download Modified</Button>
            <Button variant="outline" onClick={handleOriginalDownload}>
              Download Original
            </Button>
          </div>
        </Card>
      );

    default:
      return <div>Unknown step</div>;
  }
}

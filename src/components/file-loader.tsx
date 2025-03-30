import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

type FileLoaderProps = {
  onFileLoad: (file: ArrayBuffer) => void;
  isDbLoaded?: boolean;
};

export function FileLoader({ onFileLoad: onFileLoad, isDbLoaded = false }: FileLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    const arrayBuffer = await file.arrayBuffer();
    onFileLoad(arrayBuffer);
    setIsLoading(false);
  }, [onFileLoad]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.sqlite3': ['.db'],
    },
    multiple: false,
  });

  return (
    <Card className="p-6">
      {isDbLoaded ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
          <p className="text-lg font-medium text-green-400">Database Successfully Loaded</p>

        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/50'}
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop LocalStorage.db here' : 'Drag & drop LocalStorage.db here'}
            </p>
            <p className="text-muted-foreground mt-2">
              View the previous step for instructions on how to obtain LocalStorage.db
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

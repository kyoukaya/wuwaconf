import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';

type FileUploaderProps = {
  onFileUpload: (file: ArrayBuffer) => void;
};

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    const arrayBuffer = await file.arrayBuffer();
    onFileUpload(arrayBuffer);
    setIsUploading(false);
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.sqlite3': ['.db', '.sqlite', '.sqlite3'],
    },
    multiple: false,
  });

  return (
    <Card className="p-6">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/50'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop SQLite file here' : 'Drag & drop SQLite file here'}
          </p>
          <p className="text-muted-foreground mt-2">
            Supported formats: .db, .sqlite, .sqlite3
          </p>
        </div>
      </div>
    </Card>
  );
}

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

function ImageUploader({ onUpload }: ImageUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.dicom']
    },
    multiple: false,
    maxSize: 10485760 // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
        ${isDragActive ? 'border-[var(--medical-green-500)] bg-[var(--medical-green-50)]' : 'border-[var(--medical-green-300)] hover:border-[var(--medical-green-400)] hover:bg-[var(--medical-green-50)]'}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        {isDragReject ? (
          <>
            <X className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-red-600 font-medium">
              Invalid file type or size
            </p>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="h-12 w-12 text-[var(--medical-green-500)] mx-auto animate-bounce" />
            <p className="text-[var(--medical-green-600)] font-medium">
              Drop your scan here
            </p>
          </>
        ) : (
          <>
            <ImageIcon className="h-12 w-12 text-[var(--medical-green-400)] mx-auto" />
            <div>
              <p className="text-[var(--medical-green-600)] font-medium">
                Drag and drop your medical scan here
              </p>
              <p className="text-[var(--medical-green-500)]">
                or <span className="text-[var(--medical-green-600)]">click to browse</span>
              </p>
            </div>
          </>
        )}
        <div className="text-sm text-[var(--medical-green-600)]">
          <p>Supported formats: JPEG, PNG, DICOM</p>
          <p>Maximum file size: 10MB</p>
        </div>
      </div>
    </div>
  );
}

export default ImageUploader;
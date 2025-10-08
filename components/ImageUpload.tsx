'use client';

import { IKImage, ImageKitProvider, IKUpload, IKVideo } from 'imagekitio-next';
import config from '@/lib/config';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const {
  env: {
    imageKit: { publicKey, urlEndpoint },
  },
} = config;

const authenticator = async () => {
  try {
    const response = await fetch(`${config.env.apiEndpoint}/api/auth/imagekit`);
    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Request failed with status ${response.status} : ${errorText}`
      );
    }

    const data = await response.json();
    const { signature, expire, token } = data;
    return { token, expire, signature };
  } catch (error: any) {
    throw new Error(`Authentication Request Failed!: ${error.message}`);
  }
};

interface Props {
  type: 'image' | 'video';
  accept: string;
  placeholder: string;
  folder: string;
  variant: 'dark' | 'light';
  onFileChange: (filepath: string) => void;
}

const ImageUpload = ({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
}: Props) => {
  const ikUploadRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ filePath: string } | null>(null);
  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === 'dark'
        ? 'bg-dark-300'
        : 'bg-light-600 border-gray-100 border',
    placeholder: variant === 'dark' ? 'text-light-100' : ' text-slate-500',
    text: variant === 'dark' ? 'text-light-100' : 'text-dark-400',
  };

  const onError = (error: any) => {
    console.log(error);

    toast({
      title: `${type} Uploaded Failed ⚙️`,
      description: `Your ${type} could not be uploaded. Please try again`,
      variant: 'destructive',
    });
  };

  const onSuccess = (res: any) => {
    setFile(res);
    onFileChange(res.filePath);

    toast({
      title: `${type} Uploaded successfully ⚡`,
      description: `${res.filePath} uploaded successfully!`,
    });
  };

  const onValidate = (file: File) => {
    if (type === 'image') {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: 'File size too Large',
          description: 'Please upload a file less than 20MB Size',
          variant: 'destructive',
        });
        return false;
      }
    } else if (type === 'video') {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File size too Large',
          description: 'Please upload a file less than 50MB Size',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    ikUploadRef.current?.click();
  };

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <IKUpload
        className="hidden"
        ref={ikUploadRef}
        onError={onError}
        onSuccess={onSuccess}
        useUniqueFileName={true}
        validateFile={onValidate}
        onUploadStart={() => setProgress(0)}
        onUploadProgress={({ loaded, total }) => {
          const percent = Math.round((loaded / total) * 100);
          setProgress(percent);
        }}
        folder={folder}
        accept={accept}
      />

      <button
        type="button"
        className={cn(
          'upload-btn flex items-center gap-2 p-3 rounded-md w-full justify-center',
          styles.button
        )}
        onClick={handleButtonClick}
      >
        <Image
          src="/icons/upload.svg"
          alt="upload-icon"
          width={20}
          height={20}
          className="object-contain"
        />
        <p className={cn('text-base', styles.placeholder)}>{placeholder}</p>

        {file && (
          <p className={cn('upload-filename truncate max-w-xs', styles.text)}>
            {file.filePath.split('/').pop()}
          </p>
        )}
      </button>

      {progress > 0 && progress != 100 && (
        <div className="w-full rounded-full bg-green-200 mt-2">
          <div
            className="progress bg-green-500 text-white text-center text-xs py-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {file &&
        (type === 'image' ? (
          <div className="mt-4">
            <IKImage
              alt={file.filePath}
              path={file.filePath}
              width={500}
              height={500}
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        ) : (
          type === 'video' && (
            <div className="mt-4">
              <IKVideo
                path={file.filePath}
                controls={true}
                className="h-96 w-full rounded-xl"
              />
            </div>
          )
        ))}
    </ImageKitProvider>
  );
};

export default ImageUpload;

export interface JSImageCompressorOptions<T extends File = File> {
  file: File;
  quality?: number;
  mimeType?: string;
  maxWidth?: number;
  maxHeight?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  convertSize?: number;
  loose?: boolean;
  redressOrientation?: boolean;
  beforeCompress?: (file: T) => void;
  success?: (file: T) => void;
  error?: (msg: string) => void;
}
export default class JSImageCompressor<T extends File = File> {
  constructor(options: JSImageCompressorOptions<T>) {}
}

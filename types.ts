export enum AppView {
  CREATE = 'CREATE',
  GALLERY = 'GALLERY',
  BILLING = 'BILLING',
  SETTINGS = 'SETTINGS',
}

export enum GenerationMode {
  TEXT_TO_IMAGE = 'TEXT_TO_IMAGE',
  IMAGE_TO_IMAGE = 'IMAGE_TO_IMAGE',
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  CLASSIC_PORTRAIT = '3:4',
  CLASSIC_LANDSCAPE = '4:3',
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
}

export interface GenerationBatch {
  id: string;
  createdAt: number;
  mode: GenerationMode;
  prompt: string;
  images: GeneratedImage[];
  referenceImagesCount: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}
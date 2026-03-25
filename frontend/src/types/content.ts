export interface ContentResource {
  id: number | string;
  title: string;
  description?: string;
  type: "VIDEO" | "PDF" | "ARTICLE" | "IMAGE" | string;
  category?: string;
  uploadedBy?: string;
  createdAt?: string;
  status?: string;
  filePath?: string;
  thumbnailUrl?: string;
  downloadAllowed?: boolean;
}

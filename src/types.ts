export interface SavedItem {
  id: string;
  name: string;
  type: "m3u_url" | "m3u_raw" | "single_stream";
  content: string;
  createdAt: string;
}

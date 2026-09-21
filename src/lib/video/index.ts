import { env } from '@/config/env';

export interface VideoMetadata {
  title: string;
  classNumber: number;
  cohortId: string;
  durationMinutes?: number;
}

export interface VideoPlaybackInfo {
  videoId: string;
  playbackUrl: string;
  embedUrl: string;
  provider: 'CLOUDFLARE' | 'MUX' | 'DIRECT';
  thumbnailUrl?: string;
}

export interface VideoHostingService {
  readonly providerName: string;

  /**
   * Resolve playback details for a given video ID or direct URL
   */
  getPlaybackInfo(videoIdOrUrl: string): Promise<VideoPlaybackInfo>;

  /**
   * Generate an embed URL suitable for an iframe player
   */
  getEmbedUrl(videoIdOrUrl: string): string;

  /**
   * Request a direct creator upload URL for class recordings
   */
  generateUploadUrl(metadata: VideoMetadata): Promise<{ uploadUrl: string; videoId: string }>;

  /**
   * Extension point for automated Zoom Cloud Recording ingestion.
   * In v1, instructor manually pastes or uploads the recording URL.
   * This stub defines the signature for future webhook automation when
   * Zoom OAuth app and cloud recording download tokens are enabled.
   */
  ingestFromZoomRecording(
    zoomMeetingId: string,
    downloadUrl?: string,
    downloadToken?: string
  ): Promise<{ videoId: string; status: 'QUEUED' | 'PROCESSED' | 'FAILED'; message: string }>;
}

/**
 * Cloudflare Stream Implementation
 * Docs: https://developers.cloudflare.com/stream/
 */
export class CloudflareStreamService implements VideoHostingService {
  readonly providerName = 'CLOUDFLARE';

  getEmbedUrl(videoIdOrUrl: string): string {
    if (videoIdOrUrl.startsWith('http')) return videoIdOrUrl;
    const subdomain = env.video.cloudflare.customerSubdomain || 'customer-m033avywh0b5663u.cloudflarestream.com';
    return `https://${subdomain}/${videoIdOrUrl}/iframe`;
  }

  async getPlaybackInfo(videoIdOrUrl: string): Promise<VideoPlaybackInfo> {
    const embedUrl = this.getEmbedUrl(videoIdOrUrl);
    return {
      videoId: videoIdOrUrl,
      playbackUrl: videoIdOrUrl,
      embedUrl,
      provider: 'CLOUDFLARE',
      thumbnailUrl: `https://videodelivery.net/${videoIdOrUrl}/thumbnails/thumbnail.jpg`,
    };
  }

  async generateUploadUrl(metadata: VideoMetadata): Promise<{ uploadUrl: string; videoId: string }> {
    const videoId = `cf_stream_${Date.now()}_cls${metadata.classNumber}`;
    // In production, POST to https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/direct_upload
    return {
      uploadUrl: `https://upload.videodelivery.net/${videoId}`,
      videoId,
    };
  }

  async ingestFromZoomRecording(
    zoomMeetingId: string,
    downloadUrl?: string,
    downloadToken?: string
  ): Promise<{ videoId: string; status: 'QUEUED' | 'PROCESSED' | 'FAILED'; message: string }> {
    // Extension point: Ingest from Zoom Cloud recording via URL copy to Cloudflare Stream
    const videoId = `cf_zoom_${zoomMeetingId}_${Date.now()}`;
    return {
      videoId,
      status: 'QUEUED',
      message: `Zoom meeting ${zoomMeetingId} recording queued for Cloudflare Stream copy (Token: ${downloadToken ? 'present' : 'none'}). Download source: ${downloadUrl || 'API webhook'}`,
    };
  }
}

/**
 * Mux Video Implementation
 * Docs: https://docs.mux.com/guides/video/
 */
export class MuxVideoService implements VideoHostingService {
  readonly providerName = 'MUX';

  getEmbedUrl(videoIdOrUrl: string): string {
    if (videoIdOrUrl.startsWith('http')) return videoIdOrUrl;
    return `https://stream.mux.com/${videoIdOrUrl}.m3u8`;
  }

  async getPlaybackInfo(videoIdOrUrl: string): Promise<VideoPlaybackInfo> {
    return {
      videoId: videoIdOrUrl,
      playbackUrl: `https://stream.mux.com/${videoIdOrUrl}.m3u8`,
      embedUrl: `https://stream.mux.com/${videoIdOrUrl}.m3u8`,
      provider: 'MUX',
      thumbnailUrl: `https://image.mux.com/${videoIdOrUrl}/thumbnail.jpg`,
    };
  }

  async generateUploadUrl(metadata: VideoMetadata): Promise<{ uploadUrl: string; videoId: string }> {
    const videoId = `mux_asset_${Date.now()}_cls${metadata.classNumber}`;
    // In production, POST to https://api.mux.com/video/v1/uploads
    return {
      uploadUrl: `https://storage.googleapis.com/mux-upload/${videoId}`,
      videoId,
    };
  }

  async ingestFromZoomRecording(
    zoomMeetingId: string,
    downloadUrl?: string,
    downloadToken?: string
  ): Promise<{ videoId: string; status: 'QUEUED' | 'PROCESSED' | 'FAILED'; message: string }> {
    // Extension point: Ingest from Zoom Cloud recording into Mux Asset
    const videoId = `mux_zoom_${zoomMeetingId}_${Date.now()}`;
    return {
      videoId,
      status: 'QUEUED',
      message: `Zoom meeting ${zoomMeetingId} recording queued for Mux asset ingestion (Token: ${downloadToken ? 'present' : 'none'}). Download source: ${downloadUrl || 'API webhook'}`,
    };
  }
}

/**
 * Direct / Fallback Service for YouTube Unlisted / Vimeo / Direct URLs
 */
export class DirectVideoService implements VideoHostingService {
  readonly providerName = 'DIRECT';

  getEmbedUrl(videoIdOrUrl: string): string {
    return videoIdOrUrl;
  }

  async getPlaybackInfo(videoIdOrUrl: string): Promise<VideoPlaybackInfo> {
    return {
      videoId: videoIdOrUrl,
      playbackUrl: videoIdOrUrl,
      embedUrl: videoIdOrUrl,
      provider: 'DIRECT',
    };
  }

  async generateUploadUrl(metadata: VideoMetadata): Promise<{ uploadUrl: string; videoId: string }> {
    const videoId = `direct_${Date.now()}_cls${metadata.classNumber}`;
    return {
      uploadUrl: `https://storage.viar.in/uploads/${videoId}`,
      videoId,
    };
  }

  async ingestFromZoomRecording(
    zoomMeetingId: string,
    downloadUrl?: string
  ): Promise<{ videoId: string; status: 'QUEUED' | 'PROCESSED' | 'FAILED'; message: string }> {
    return {
      videoId: `direct_${zoomMeetingId}`,
      status: 'PROCESSED',
      message: `Direct link saved: ${downloadUrl || zoomMeetingId}`,
    };
  }
}

/**
 * Service Factory
 */
export function getVideoHostingService(): VideoHostingService {
  const configured = env.video.provider;
  if (configured === 'cloudflare' && env.video.cloudflare.apiToken) {
    return new CloudflareStreamService();
  }
  if (configured === 'mux' && env.video.mux.tokenId) {
    return new MuxVideoService();
  }
  // Default to DirectVideoService / Cloudflare compatible embedder
  return new CloudflareStreamService();
}

export const videoHosting = getVideoHostingService();

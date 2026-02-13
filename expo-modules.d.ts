// Type declarations for Expo modules that may not ship with types in this environment.
declare module 'expo-av' {
  export interface Recording {
    getURI(): string;
    stopAndUnloadAsync(): Promise<void>;
  }
  export const Audio: {
    requestPermissionsAsync(): Promise<{ status: string }>;
    setAudioModeAsync(options: Record<string, unknown>): Promise<void>;
    Recording: {
      createAsync(options: Record<string, unknown>): Promise<{ recording: Recording }>;
    };
    RecordingOptionsPresets: { HIGH_QUALITY: Record<string, unknown> };
  };
}
declare module 'expo-clipboard' {
  export function getStringAsync(): Promise<string>;
  export function setStringAsync(text: string): Promise<void>;
}

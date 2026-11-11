export const imageModels = [
  { id: 'nano-banana', label: 'Nano Banana', available: false },
  { id: 'gpt', label: 'GPT', available: true },
  { id: 'seedream', label: 'Seedream', available: false },
] as const;
export type ImageModel = typeof imageModels[number]['id'];

export type ImageApiStatus = {
  canSave: boolean;
  personalKey: boolean;
  workspaceKey: boolean;
  background: boolean;
};
export const unavailableImageApi: ImageApiStatus = {
  canSave: false, personalKey: false, workspaceKey: false, background: false,
};

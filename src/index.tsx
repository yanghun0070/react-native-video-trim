import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-video-trim' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const VideoTrim = NativeModules.VideoTrim
  ? NativeModules.VideoTrim
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export interface EditorConfig {
  saveToPhoto?: boolean;
  maxDuration?: number;
}

export async function showEditor(
  videoPath: string,
  config: EditorConfig = {}
): Promise<void> {
  const { maxDuration, saveToPhoto = true } = config;
  const outputPath = await VideoTrim.showEditor(videoPath, {
    saveToPhoto,
    maxDuration,
  });

  if (Platform.OS === 'android' && saveToPhoto) {
    if (Platform.Version < 33) {
      await VideoTrim.saveVideo(outputPath);
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE!,
          {
            title: '비디오 트리머 사진 액세스 필요',
            message:
              '출력 비디오를 작성하려면 사진에 대한 액세스 권한을 부여하세요.',
            buttonNeutral: '나중에 다시 확인',
            buttonNegative: '취소',
            buttonPositive: '확인',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await VideoTrim.saveVideo(outputPath);
        } else {
          VideoTrim.hideDialog();
          throw new Error('Photos Library permission denied');
        }
      } catch (err) {
        throw err;
      }
    }
  }
}

export function isValidVideo(videoPath: string): Promise<boolean> {
  return VideoTrim.isValidVideo(videoPath);
}

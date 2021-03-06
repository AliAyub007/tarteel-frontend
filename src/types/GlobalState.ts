import IAyahShape from '../shapes/IAyahShape';

interface ReduxState {
  ayahs: {
    currentAyah: IAyahShape;
    prevAyah: IAyahShape[];
    nextAyah: IAyahShape[];
    isFetchingCurrentAyah: boolean;
    currentSurah: ISearchSurah;
  };
  auth: IAuth;
  status: IStatus;
  demographicData: IDemographics;
  profile: IProfile;
  evaluator: IEvaluator;
  recognition: IRecognition;
  router: IRouter;
  dataset: IDataset;
}

export interface IAuth {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error;
}

export interface IRouter {
  location: Location;
}

export interface IStatus {
  isRecording: boolean;
  isDoneRecording: boolean;
  isContinuous: boolean;
  isFetching: boolean;
}

export interface IProfile {
  passedOnBoarding: boolean;
  recordingCount: number;
  dailyCount: number;
  evaluationsCount: number;
  userRecitedAyahs: number;
  sessionId: string;
  askForDemographics: boolean;
}

export interface IDataset {
  sample: string[];
}

export interface IDemographics {
  gender: string;
  age: string;
  qiraah: string;
  ethnicity: string;
}

interface IEvaluator {
  currentAyah: IAyahShape;
  nextAyah: IAyahShape;
  previousAyah: IAyahShape;
}

export interface ISearchAyah {
  displayText: string;
  text: string;
}

export interface ISearchSurah {
  chapterId: string;
  ayahs: {
    [key: string]: ISearchAyah;
  };
}

export interface IRecognition {
  queryText: string;
  suggestions: [];
  matchedTerms: string[];
  matches: object[];
  canRecord: boolean;
}
export interface IRecognitionRequest {
  arabicText: string;
  translation: string;
}

export default ReduxState;

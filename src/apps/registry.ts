import type { AppDef } from '../components/HomeAppGrid';
import {
  ClockIcon,
  CalendarIcon,
  ChecklistIcon,
  GearIcon,
  CameraIcon,
  GalleryIcon,
  QuizIcon,
  StudentListIcon,
  BrowserIcon,
} from '../components/icons/AppIcons';
import { ClockApp } from '../screens/apps/ClockApp';
import { ScheduleApp } from '../screens/apps/ScheduleApp';
import { TaskApp } from '../screens/apps/TaskApp';
import { SystemApp } from '../screens/apps/SystemApp';
import { CameraApp } from '../screens/apps/CameraApp';
import { GalleryApp } from '../screens/apps/GalleryApp';
import { QuizApp } from '../screens/apps/QuizApp';
import { StudentListApp } from '../screens/apps/StudentListApp';
import { BrowserApp } from '../screens/apps/BrowserApp';

export type AppRegistration = AppDef & {
  Screen: React.ComponentType;
};

// Single source of truth for every app on the home screen. To add a new app:
// build its screen component, add an icon in AppIcons.tsx, then add one
// entry here — OSHomeScreen and HomeAppGrid both read from this list.
export const APP_REGISTRY: AppRegistration[] = [
  { key: 'CLOCK', label: 'CLOCK', Icon: ClockIcon, Screen: ClockApp },
  { key: 'SCHEDULE', label: 'SCHEDULE', Icon: CalendarIcon, Screen: ScheduleApp },
  { key: 'TASK', label: 'TASK', Icon: ChecklistIcon, Screen: TaskApp },
  { key: 'CAMERA', label: 'CAMERA', Icon: CameraIcon, Screen: CameraApp },
  { key: 'GALLERY', label: 'GALLERY', Icon: GalleryIcon, Screen: GalleryApp },
  { key: 'QUIZ', label: 'QUIZ', Icon: QuizIcon, Screen: QuizApp },
  { key: 'STUDENTS', label: 'STUDENTS', Icon: StudentListIcon, Screen: StudentListApp },
  { key: 'BROWSER', label: 'BROWSER', Icon: BrowserIcon, Screen: BrowserApp },
  { key: 'SYSTEM', label: 'SYSTEM', Icon: GearIcon, Screen: SystemApp },
];

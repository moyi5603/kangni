import { CEndToastProvider } from '../features/c-end/activities/components/CEndToast';
import { H5ActivityDetail } from '../features/c-end/activities/h5/H5ActivityDetail';
import { H5ActivityHome } from '../features/c-end/activities/h5/H5ActivityHome';
import { H5MyFavorites } from '../features/c-end/activities/h5/H5MyFavorites';
import { H5MySignups } from '../features/c-end/activities/h5/H5MySignups';
import { PcActivityDetail } from '../features/c-end/activities/pc/PcActivityDetail';
import { PcActivityHome } from '../features/c-end/activities/pc/PcActivityHome';
import { PcMyFavorites } from '../features/c-end/activities/pc/PcMyFavorites';
import { PcMySignups } from '../features/c-end/activities/pc/PcMySignups';
import { H5CourseDetail } from '../features/c-end/courses/h5/H5CourseDetail';
import { H5CourseMall } from '../features/c-end/courses/h5/H5CourseMall';
import { PcCourseDetail } from '../features/c-end/courses/pc/PcCourseDetail';
import { PcCourseMall } from '../features/c-end/courses/pc/PcCourseMall';
import '../features/c-end/activities/styles.css';
import '../features/c-end/courses/styles.css';
import type { CEndSurface, H5Page } from './navigation';

type CEndAppProps = {
  surface: CEndSurface;
  activityId?: number;
  courseId?: number;
  h5Page?: H5Page;
};

export function CEndApp(props: CEndAppProps) {
  const { surface, activityId, courseId, h5Page } = props;
  const page =
    surface === 'h5' ? (
      h5Page === 'my' ? (
        <H5MySignups />
      ) : h5Page === 'courses' ? (
        <H5CourseMall />
      ) : h5Page === 'course-detail' ? (
        <H5CourseDetail id={courseId ?? -1} />
      ) : h5Page === 'favorites' ? (
        <H5MyFavorites />
      ) : activityId == null ? (
        <H5ActivityHome />
      ) : (
        <H5ActivityDetail id={activityId} />
      )
    ) : h5Page === 'courses' ? (
      <PcCourseMall />
    ) : h5Page === 'course-detail' ? (
      <PcCourseDetail id={courseId ?? -1} />
    ) : h5Page === 'my' ? (
      <PcMySignups />
    ) : h5Page === 'favorites' ? (
      <PcMyFavorites />
    ) : activityId == null ? (
      <PcActivityHome />
    ) : (
      <PcActivityDetail id={activityId} />
    );

  return (
    <div className="c-end">
      <CEndToastProvider>{page}</CEndToastProvider>
    </div>
  );
}

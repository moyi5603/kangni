import { CEndToastProvider } from '../features/c-end/activities/components/CEndToast';
import { H5ActivityDetail } from '../features/c-end/activities/h5/H5ActivityDetail';
import { H5ActivityHome } from '../features/c-end/activities/h5/H5ActivityHome';
import { H5MyFavorites } from '../features/c-end/activities/h5/H5MyFavorites';
import { H5MySignups } from '../features/c-end/activities/h5/H5MySignups';
import { H5SignupPage } from '../features/c-end/activities/h5/H5SignupPage';
import { H5CheckInPage } from '../features/c-end/activities/h5/H5CheckInPage';
import { PcActivityDetail } from '../features/c-end/activities/pc/PcActivityDetail';
import { PcActivityHome } from '../features/c-end/activities/pc/PcActivityHome';
import { PcMyFavorites } from '../features/c-end/activities/pc/PcMyFavorites';
import { PcMySignups } from '../features/c-end/activities/pc/PcMySignups';
import { H5PastMomentsPage, PcPastMomentsPage } from '../features/c-end/activities/components/PastMomentsPage';
import { H5CourseDetail } from '../features/c-end/courses/h5/H5CourseDetail';
import { H5CourseMall } from '../features/c-end/courses/h5/H5CourseMall';
import { H5ExamList } from '../features/c-end/exams/h5/H5ExamList';
import { H5ExamPrep } from '../features/c-end/exams/h5/H5ExamPrep';
import { H5ExamResult } from '../features/c-end/exams/h5/H5ExamResult';
import { H5ExamRank } from '../features/c-end/exams/h5/H5ExamRank';
import { H5ExamRecords } from '../features/c-end/exams/h5/H5ExamRecords';
import { H5ExamReview } from '../features/c-end/exams/h5/H5ExamReview';
import { H5ExamTaking } from '../features/c-end/exams/h5/H5ExamTaking';
import { H5HonorApp } from '../features/c-end/honor/h5/H5HonorApp';
import { H5InterestGroupHome } from '../features/c-end/interest-groups/h5/H5InterestGroupHome';
import { H5VoteList } from '../features/c-end/voting/h5/H5VoteList';
import { H5VoteDetail } from '../features/c-end/voting/h5/H5VoteDetail';
import { H5VoteTaking } from '../features/c-end/voting/h5/H5VoteTaking';
import { H5VoteRecords } from '../features/c-end/voting/h5/H5VoteRecords';
import { H5VoteRecord } from '../features/c-end/voting/h5/H5VoteRecord';
import { H5VoteResults } from '../features/c-end/voting/h5/H5VoteResults';
import { PcCourseDetail } from '../features/c-end/courses/pc/PcCourseDetail';
import { PcCourseMall } from '../features/c-end/courses/pc/PcCourseMall';
import { PcExamList } from '../features/c-end/exams/pc/PcExamList';
import { PcExamPrep } from '../features/c-end/exams/pc/PcExamPrep';
import { PcExamResult } from '../features/c-end/exams/pc/PcExamResult';
import { PcExamRank } from '../features/c-end/exams/pc/PcExamRank';
import { PcExamRecords } from '../features/c-end/exams/pc/PcExamRecords';
import { PcExamReview } from '../features/c-end/exams/pc/PcExamReview';
import { PcExamTaking } from '../features/c-end/exams/pc/PcExamTaking';
import '../features/c-end/activities/styles.css';
import '../features/c-end/courses/styles.css';
import '../features/c-end/exams/styles.css';
import '../features/c-end/honor/styles.css';
import '../features/c-end/voting/styles.css';
import type { CEndSurface, H5Page } from './navigation';

function voteScreens(surface: CEndSurface, h5Page: H5Page | undefined, voteId?: number, voteResponseId?: number) {
  if (h5Page === 'votes') return <H5VoteList surface={surface} />;
  if (h5Page === 'vote-detail') return <H5VoteDetail id={voteId ?? -1} surface={surface} />;
  if (h5Page === 'vote-taking') return <H5VoteTaking id={voteId ?? -1} surface={surface} />;
  if (h5Page === 'vote-results') return <H5VoteResults id={voteId ?? -1} surface={surface} />;
  if (h5Page === 'vote-records') return <H5VoteRecords surface={surface} />;
  if (h5Page === 'vote-record') return <H5VoteRecord id={voteResponseId ?? -1} />;
  return null;
}

type CEndAppProps = {
  surface: CEndSurface;
  activityId?: number;
  courseId?: number;
  examId?: number;
  voteId?: number;
  voteResponseId?: number;
  h5Page?: H5Page;
};

export function CEndApp(props: CEndAppProps) {
  const { surface, activityId, courseId, examId, voteId, voteResponseId, h5Page } = props;
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
      ) : h5Page === 'signup' ? (
        <H5SignupPage id={activityId ?? -1} />
      ) : h5Page === 'checkin' ? (
        <H5CheckInPage id={activityId ?? -1} />
      ) : h5Page === 'exams' ? (
        <H5ExamList />
      ) : h5Page === 'exam-prep' ? (
        <H5ExamPrep id={examId ?? -1} />
      ) : h5Page === 'exam-taking' ? (
        <H5ExamTaking id={examId ?? -1} />
      ) : h5Page === 'exam-result' ? (
        <H5ExamResult id={examId ?? -1} />
      ) : h5Page === 'exam-review' ? (
        <H5ExamReview id={examId ?? -1} />
      ) : h5Page === 'exam-records' ? (
        <H5ExamRecords id={examId ?? -1} />
      ) : h5Page === 'exam-rank' ? (
        <H5ExamRank id={examId ?? -1} />
      ) : h5Page === 'honor' ? (
        <H5HonorApp />
      ) : h5Page === 'interest-groups' ? (
        <H5InterestGroupHome />
      ) : h5Page === 'honor-admin' ? (
        <H5HonorApp initialRole="hr" />
      ) : voteScreens('h5', h5Page, voteId, voteResponseId) ? (
        voteScreens('h5', h5Page, voteId, voteResponseId)
      ) : h5Page === 'activity-list' ? (
        <H5ActivityHome variant="all" />
      ) : h5Page === 'past-moments' ? (
        <H5PastMomentsPage />
      ) : activityId == null ? (
        <H5ActivityHome />
      ) : (
        <H5ActivityDetail id={activityId} />
      )
    ) : h5Page === 'courses' ? (
      <PcCourseMall />
    ) : h5Page === 'course-detail' ? (
      <PcCourseDetail id={courseId ?? -1} />
    ) : h5Page === 'exams' ? (
      <PcExamList />
    ) : h5Page === 'exam-prep' ? (
      <PcExamPrep id={examId ?? -1} />
    ) : h5Page === 'exam-taking' ? (
      <PcExamTaking id={examId ?? -1} />
    ) : h5Page === 'exam-result' ? (
      <PcExamResult id={examId ?? -1} />
    ) : h5Page === 'exam-review' ? (
      <PcExamReview id={examId ?? -1} />
    ) : h5Page === 'exam-records' ? (
      <PcExamRecords id={examId ?? -1} />
    ) : h5Page === 'exam-rank' ? (
      <PcExamRank id={examId ?? -1} />
    ) : voteScreens('pc', h5Page, voteId, voteResponseId) ? (
      voteScreens('pc', h5Page, voteId, voteResponseId)
    ) : h5Page === 'my' ? (
      <PcMySignups />
    ) : h5Page === 'favorites' ? (
      <PcMyFavorites />
    ) : h5Page === 'signup' ? (
      <PcActivityDetail id={activityId ?? -1} signupOpen />
    ) : h5Page === 'activity-list' ? (
      <PcActivityHome variant="all" />
    ) : h5Page === 'past-moments' ? (
      <PcPastMomentsPage />
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

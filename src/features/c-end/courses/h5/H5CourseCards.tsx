import type { ClientCourse } from '../model/clientCourse';

function IconEye() {
  return (
    <svg className="c-icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CourseCover({ course }: { course: ClientCourse }) {
  return (
    <div className={`c-h5-course-cover is-${course.cover}`} aria-hidden>
      <span className="c-h5-course-cover-art">
        {course.cover === 'account' ? <span className="c-h5-course-cover-slogan">专业·高效·备考指南</span> : null}
      </span>
      <span className="c-h5-course-play" />
      <span className="c-h5-course-duration">{course.duration}</span>
    </div>
  );
}

export function H5CourseCard({ course, href }: { course: ClientCourse; href: string }) {
  return (
    <a
      className="c-h5-course-card"
      href={href}
      aria-label={`${course.title}，${course.tag}，${course.views} 次观看，时长 ${course.duration}，开始学习`}
    >
      <CourseCover course={course} />
      <div className="c-h5-course-copy">
        <h2 className="c-h5-course-title">{course.title}</h2>
        <span className="c-h5-course-tag">{course.tag}</span>
        <div className="c-h5-course-foot">
          <span className="c-h5-course-views">
            <IconEye />
            {course.views}
          </span>
          <span className="c-h5-course-cta">开始学习</span>
        </div>
      </div>
    </a>
  );
}

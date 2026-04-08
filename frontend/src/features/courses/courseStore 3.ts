export interface UpcomingCourse {
  id: string;
  title: string;
  description: string;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: "Online" | "Offline" | "Hybrid";
  seats: number;
  createdBy: string;
}

export interface NewCourseInput {
  title: string;
  description: string;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: "Online" | "Offline" | "Hybrid";
  seats: number;
}

const COURSE_STORAGE_KEY = "upcoming-student-courses";

const defaultCourses: UpcomingCourse[] = [
  {
    id: "course-101",
    title: "Mid-Term Revision Bootcamp",
    description: "Three-week guided revision support for core science and mathematics topics before the exam cycle.",
    className: "Class 10",
    section: "A",
    startDate: "2026-03-24",
    endDate: "2026-04-10",
    instructor: "Ananya Menon",
    mode: "Hybrid",
    seats: 40,
    createdBy: "Director Office",
  },
  {
    id: "course-102",
    title: "Foundation Science Lab Series",
    description: "Hands-on upcoming lab sessions for students who want extra guided science practice.",
    className: "Class 8",
    section: "B",
    startDate: "2026-03-28",
    endDate: "2026-04-18",
    instructor: "Rahul Varma",
    mode: "Offline",
    seats: 30,
    createdBy: "Academic Administration",
  },
];

export const getUpcomingCourses = (): UpcomingCourse[] => {
  if (typeof window === "undefined") {
    return defaultCourses;
  }

  const storedCourses = window.localStorage.getItem(COURSE_STORAGE_KEY);

  if (!storedCourses) {
    return defaultCourses;
  }

  try {
    return JSON.parse(storedCourses) as UpcomingCourse[];
  } catch {
    return defaultCourses;
  }
};

const persistCourses = (courses: UpcomingCourse[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(courses));
};

export const createUpcomingCourse = (input: NewCourseInput, createdBy: string) => {
  const nextCourse: UpcomingCourse = {
    id: `course-${Date.now()}`,
    ...input,
    createdBy,
  };

  const nextCourses = [nextCourse, ...getUpcomingCourses()];
  persistCourses(nextCourses);
  return nextCourses;
};

export const getCoursesForClass = (className: string, section: string) => {
  return getUpcomingCourses().filter(
    (course) => course.className === className && course.section === section,
  );
};

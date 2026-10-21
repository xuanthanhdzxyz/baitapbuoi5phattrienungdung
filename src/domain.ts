export type Category = { id: string; name: string; description: string };
export type Course = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  instructor: string;
  price: number;
  duration: number;
  thumbnail: string;
  trailerUrl: string;
  createdAt: string;
};
export type CourseInput = Omit<Course, "id">;
export type CourseDraft = Omit<CourseInput, "price" | "duration"> & {
  price: string;
  duration: string;
};
export const emptyCourse = (): CourseDraft => ({
  title: "",
  description: "",
  categoryId: "",
  instructor: "",
  price: "",
  duration: "",
  thumbnail: "",
  trailerUrl: "",
  createdAt: new Date().toISOString(),
});
export function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) && !!u.hostname;
  } catch {
    return false;
  }
}
export function validateCourse(draft: CourseDraft, categories: Category[]) {
  const errors: Partial<Record<keyof CourseDraft, string>> = {};
  for (const field of [
    "title",
    "description",
    "instructor",
    "thumbnail",
    "trailerUrl",
  ] as const) {
    if (!draft[field].trim()) errors[field] = "Vui lòng nhập trường này.";
  }
  if (!categories.some((c) => c.id === draft.categoryId))
    errors.categoryId = "Vui lòng chọn danh mục tồn tại.";
  if (
    !draft.price.trim() ||
    !Number.isFinite(Number(draft.price)) ||
    Number(draft.price) < 0
  )
    errors.price = "Học phí phải là số không âm.";
  if (
    !draft.duration.trim() ||
    !Number.isFinite(Number(draft.duration)) ||
    Number(draft.duration) <= 0
  )
    errors.duration = "Thời lượng phải lớn hơn 0.";
  for (const field of ["thumbnail", "trailerUrl"] as const) {
    if (draft[field].trim() && !isHttpUrl(draft[field].trim()))
      errors[field] = "Nhập URL HTTP/HTTPS hợp lệ.";
  }
  if (/youtu\.?be/i.test(draft.trailerUrl))
    errors.trailerUrl =
      "Hãy dùng URL video MP4 trực tiếp thay cho trang YouTube.";
  return errors;
}
export function toCourseInput(d: CourseDraft): CourseInput {
  return {
    title: d.title.trim(),
    description: d.description.trim(),
    categoryId: d.categoryId,
    instructor: d.instructor.trim(),
    price: Number(d.price),
    duration: Number(d.duration),
    thumbnail: d.thumbnail.trim(),
    trailerUrl: d.trailerUrl.trim(),
    createdAt: d.createdAt,
  };
}
export function filterCourses(
  courses: Course[],
  query: string,
  categoryId: string,
) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  return courses.filter(
    (c) =>
      normalize(c.title).includes(normalize(query.trim())) &&
      (!categoryId || c.categoryId === categoryId),
  );
}
export const formatMoney = (n: number) =>
  `${Number(n).toLocaleString("vi-VN")} ₫`;

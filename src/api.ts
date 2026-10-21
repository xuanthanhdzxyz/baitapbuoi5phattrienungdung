import type { Category, Course, CourseInput } from "./domain";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export function createApi(rawBaseUrl: string, fetcher: typeof fetch = fetch) {
  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    if (!/^https:\/\/[^/]+\.mockapi\.io(?:\/.*)?$/.test(baseUrl))
      throw new ApiError(
        "Cần cấu hình Base URL HTTPS của MockAPI, không phải link trang quản trị.",
      );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetcher(`${baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok)
        throw new ApiError(
          response.status === 404
            ? "Không tìm thấy dữ liệu/endpoint. Kiểm tra Base URL và tên resources."
            : `MockAPI trả về lỗi ${response.status}. Vui lòng thử lại.`,
          response.status,
        );
      const text = await response.text();
      return text ? (JSON.parse(text) as T) : (undefined as T);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === "AbortError")
        throw new ApiError(
          "Yêu cầu quá 15 giây. Kiểm tra kết nối rồi thử lại.",
        );
      throw new ApiError(
        "Không kết nối được MockAPI hoặc dữ liệu trả về không hợp lệ.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  const idPath = (id: string) => encodeURIComponent(id);
  return {
    async categories() {
      const data = await request<Category[]>("/categories");
      if (!Array.isArray(data))
        throw new ApiError("API categories phải trả về mảng.");
      return data.map((c) => ({ ...c, id: String(c.id) }));
    },
    async courses() {
      const data = await request<Course[]>("/courses");
      if (!Array.isArray(data))
        throw new ApiError("API courses phải trả về mảng.");
      return data.map((c) => ({
        ...c,
        id: String(c.id),
        categoryId: String(c.categoryId),
        price: Number(c.price),
        duration: Number(c.duration),
      }));
    },
    course: (id: string) => request<Course>(`/courses/${idPath(id)}`),
    saveCourse: (data: CourseInput, id?: string) =>
      request<Course>(
        id ? `/courses/${idPath(id)}` : "/courses",
        id ? "PUT" : "POST",
        data,
      ),
    deleteCourse: (id: string) =>
      request<Course>(`/courses/${idPath(id)}`, "DELETE"),
    saveCategory: (data: Omit<Category, "id">, id?: string) =>
      request<Category>(
        id ? `/categories/${idPath(id)}` : "/categories",
        id ? "PUT" : "POST",
        data,
      ),
    async deleteCategory(id: string) {
      // Đọc lại toàn bộ courses trước khi xóa; không dùng kết quả lọc trên màn hình.
      const courses = await this.courses();
      if (courses.some((c) => c.categoryId === id))
        throw new ApiError(
          "Không thể xóa danh mục đang có khóa học. Hãy chuyển hoặc xóa các khóa học trước.",
        );
      return request<Category>(`/categories/${idPath(id)}`, "DELETE");
    },
  };
}

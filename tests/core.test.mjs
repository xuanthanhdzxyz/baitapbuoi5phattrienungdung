import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
async function load(name) {
  const source = await readFile(
    new URL(`../src/${name}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}
const { validateCourse, emptyCourse, filterCourses, toCourseInput } =
  await load("domain");
const { createApi } = await load("api");
const categories = [{ id: "1", name: "Mobile", description: "Mobile" }];
const valid = {
  ...emptyCourse(),
  title: " Android ",
  description: " Kotlin ",
  instructor: " Thành ",
  categoryId: "1",
  price: "0",
  duration: "30",
  thumbnail: "https://picsum.photos/400/300",
  trailerUrl: "https://example.org/trailer.mp4",
};
test("Trường bắt buộc, danh mục và số đều được kiểm tra", () => {
  const errors = validateCourse(emptyCourse(), categories);
  for (const key of [
    "title",
    "description",
    "instructor",
    "categoryId",
    "price",
    "duration",
    "thumbnail",
    "trailerUrl",
  ])
    assert.ok(errors[key]);
});
test("Chấp nhận khóa học miễn phí; chuyển số và cắt khoảng trắng", () => {
  assert.deepEqual(validateCourse(valid, categories), {});
  assert.equal(toCourseInput(valid).price, 0);
  assert.equal(toCourseInput(valid).title, "Android");
  assert.equal(toCourseInput(valid).createdAt, valid.createdAt);
});
test("Chặn học phí âm, NaN, vô cực và thời lượng không dương", () => {
  for (const price of ["-1", "NaN", "Infinity", "abc"])
    assert.ok(validateCourse({ ...valid, price }, categories).price);
  for (const duration of ["0", "-3", "Infinity"])
    assert.ok(validateCourse({ ...valid, duration }, categories).duration);
});
test("Chặn danh mục không tồn tại và URL không hợp lệ", () => {
  const e = validateCourse(
    {
      ...valid,
      categoryId: "999",
      thumbnail: "javascript:alert(1)",
      trailerUrl: "https://youtube.com/watch?v=x",
    },
    categories,
  );
  assert.ok(e.categoryId);
  assert.ok(e.thumbnail);
  assert.ok(e.trailerUrl);
});
test("Tìm kiếm không phân biệt dấu và kết hợp lọc danh mục", () => {
  const rows = [
    { ...toCourseInput(valid), id: "1", title: "Lập trình Android" },
    {
      ...toCourseInput(valid),
      id: "2",
      categoryId: "2",
      title: "Lập trình Web",
    },
  ];
  assert.equal(filterCourses(rows, "lap trinh", "").length, 2);
  assert.deepEqual(
    filterCourses(rows, "ANDROID", "1").map((x) => x.id),
    ["1"],
  );
  assert.equal(filterCourses(rows, "Android", "2").length, 0);
});
test("CRUD dùng đúng method, JSON body và mã hóa id", async () => {
  const calls = [];
  const api = createApi("https://test.mockapi.io/", async (url, init) => {
    calls.push([url, init]);
    return new Response(JSON.stringify({ id: "1" }), { status: 200 });
  });
  await api.saveCourse(toCourseInput(valid));
  await api.saveCourse(toCourseInput(valid), "a/b");
  await api.deleteCourse("1");
  await api.course("1");
  assert.deepEqual(
    calls.map((x) => x[1].method),
    ["POST", "PUT", "DELETE", "GET"],
  );
  assert.equal(calls[1][0], "https://test.mockapi.io/courses/a%2Fb");
  assert.equal(JSON.parse(calls[0][1].body).price, 0);
});
test("Không gửi DELETE nếu danh mục đang có khóa học", async () => {
  const calls = [];
  const api = createApi("https://test.mockapi.io", async (url, init) => {
    calls.push(init.method);
    return new Response(JSON.stringify([{ categoryId: "1", id: "8" }]));
  });
  await assert.rejects(api.deleteCategory("1"), /đang có khóa học/);
  assert.deepEqual(calls, ["GET"]);
});
test("Danh mục rỗng được kiểm tra lại từ API rồi mới xóa", async () => {
  const calls = [];
  const api = createApi("https://test.mockapi.io", async (url, init) => {
    calls.push([url, init.method]);
    return new Response(
      JSON.stringify(init.method === "GET" ? [] : { id: "1" }),
    );
  });
  await api.deleteCategory("1");
  assert.deepEqual(
    calls.map((x) => x[1]),
    ["GET", "DELETE"],
  );
});
test("Lỗi HTTP, lỗi mạng và JSON sai được báo rõ", async () => {
  await assert.rejects(
    createApi(
      "https://test.mockapi.io",
      async () => new Response("Not found", { status: 404 }),
    ).courses(),
    /Không tìm thấy/,
  );
  await assert.rejects(
    createApi("https://test.mockapi.io", async () => {
      throw new Error("network");
    }).courses(),
    /Không kết nối/,
  );
  await assert.rejects(
    createApi(
      "https://test.mockapi.io",
      async () => new Response("{}"),
    ).courses(),
    /phải trả về mảng/,
  );
});
test("Không xóa danh mục khi không kiểm tra được courses", async () => {
  const calls = [];
  const api = createApi("https://test.mockapi.io", async (url, init) => {
    calls.push(init.method);
    return new Response("error", { status: 500 });
  });
  await assert.rejects(api.deleteCategory("1"));
  assert.deepEqual(calls, ["GET"]);
});

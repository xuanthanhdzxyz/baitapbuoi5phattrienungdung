import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/api.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
});
const { createApi } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const base =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://6ad740fd95e98f36aef221f1.mockapi.io";
const api = createApi(base);
const [categories, courses] = await Promise.all([
  api.categories(),
  api.courses(),
]);
assert.ok(categories.length >= 3, "Cần ít nhất 3 danh mục");
assert.ok(courses.length >= 10, "Cần ít nhất 10 khóa học");
for (const c of courses) {
  assert.ok(
    categories.some((cat) => cat.id === c.categoryId),
    `Danh mục của khóa ${c.id} không tồn tại`,
  );
  assert.ok(
    c.title &&
      c.description &&
      c.instructor &&
      c.thumbnail &&
      c.trailerUrl &&
      c.createdAt,
  );
  assert.ok(c.price >= 0 && c.duration > 0);
}
assert.equal((await api.course(courses[0].id)).id, courses[0].id);
console.log(
  `GET OK: ${categories.length} danh mục, ${courses.length} khóa học; quan hệ và chi tiết hợp lệ.`,
);
if (process.argv.includes("--snapshot")) {
  const dir = new URL("../data/", import.meta.url);
  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(
      new URL("categories.json", dir),
      JSON.stringify(categories, null, 2) + "\n",
    ),
    writeFile(
      new URL("courses.json", dir),
      JSON.stringify(courses, null, 2) + "\n",
    ),
  ]);
  console.log("Đã lưu bản sao dữ liệu. Ứng dụng không import các file này.");
}
if (process.argv.includes("--write")) {
  // Chỉ tạo và dọn bản ghi thử của chính lần chạy này, không sửa bản ghi sẵn có.
  let catId, courseId;
  try {
    const cat = await api.saveCategory({
      name: `KIEM_THU_BIT240215_${Date.now()}`,
      description: "Danh mục tạm do script kiểm thử tạo.",
    });
    catId = cat.id;
    const updatedCat = await api.saveCategory(
      { name: cat.name, description: "Đã kiểm thử PUT danh mục." },
      catId,
    );
    assert.equal(updatedCat.description, "Đã kiểm thử PUT danh mục.");
    const course = await api.saveCourse({
      title: "KIEM_THU_BIT240215",
      description: "Khóa học tạm do script tạo.",
      categoryId: catId,
      instructor: "Đào Xuân Thành",
      price: 0,
      duration: 1,
      thumbnail: courses[0].thumbnail,
      trailerUrl: courses[0].trailerUrl,
      createdAt: new Date().toISOString(),
    });
    courseId = course.id;
    assert.equal((await api.course(courseId)).categoryId, catId);
    await assert.rejects(api.deleteCategory(catId), /đang có khóa học/);
    const { id, ...input } = course;
    const updated = await api.saveCourse(
      { ...input, title: "KIEM_THU_BIT240215_DA_SUA", price: 123000 },
      courseId,
    );
    assert.equal(updated.title, "KIEM_THU_BIT240215_DA_SUA");
    assert.equal(updated.price, 123000);
    console.log("POST/PUT/GET chi tiết OK; chặn xóa danh mục có khóa học OK.");
  } finally {
    if (courseId) await api.deleteCourse(courseId);
    if (catId) await api.deleteCategory(catId);
  }
  const [afterCats, afterCourses] = await Promise.all([
    api.categories(),
    api.courses(),
  ]);
  assert.equal(afterCats.length, categories.length);
  assert.equal(afterCourses.length, courses.length);
  console.log("DELETE OK; đã dọn bản ghi thử, giữ nguyên số bản ghi ban đầu.");
}

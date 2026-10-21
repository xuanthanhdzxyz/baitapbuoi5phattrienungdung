import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { router, useLocalSearchParams } from "expo-router";
import { createApi } from "./api";
import {
  Category,
  Course,
  CourseDraft,
  emptyCourse,
  filterCourses,
  formatMoney,
  isHttpUrl,
  toCourseInput,
  validateCourse,
} from "./domain";
import { Button, CategorySelect, Cover, Field, s } from "./ui";

const DEFAULT_API =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://6ad740fd95e98f36aef221f1.mockapi.io";
type Screen = "courses" | "detail" | "form" | "categories" | "settings";
type Confirmation = {
  title: string;
  description: string;
  action: () => Promise<void>;
};
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Có lỗi xảy ra. Vui lòng thử lại.";

function Trailer({ uri, close }: { uri: string; close: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
    error: undefined,
  });
  return (
    <View style={s.trailer}>
      <Text style={s.heading}>Trailer khóa học</Text>
      <VideoView
        player={player}
        nativeControls
        style={s.video}
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
      />
      {status === "loading" && <ActivityIndicator color="#147d73" />}
      {status === "error" && (
        <Text style={s.errorText}>
          Không phát được trailer. Kiểm tra URL MP4 hoặc kết nối mạng.{" "}
          {error?.message}
        </Text>
      )}
      <Text style={s.muted}>
        Video mẫu minh họa. Dùng nút điều khiển để tạm dừng hoặc xem toàn màn
        hình.
      </Text>
      <Button title="Đóng trailer" onPress={close} />
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <CourseApp />
    </SafeAreaProvider>
  );
}
function CourseApp() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API);
  const [configDraft, setConfigDraft] = useState(DEFAULT_API);
  const [ready, setReady] = useState(false);
  const api = useMemo(() => createApi(baseUrl), [baseUrl]);
  const route = useLocalSearchParams<{ screen: string }>();
  const screen: Screen = [
    "courses",
    "detail",
    "form",
    "categories",
    "settings",
  ].includes(route.screen)
    ? (route.screen as Screen)
    : "courses";
  const setScreen = useCallback(
    (next: Screen) => router.setParams({ screen: next }),
    [],
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const listRef = useRef<FlatList<Course>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [query, filter]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailRequest = useRef(0);
  const [draft, setDraft] = useState<CourseDraft>(emptyCourse);
  const [editingId, setEditingId] = useState<string>();
  const [formErrors, setFormErrors] = useState<
    ReturnType<typeof validateCourse>
  >({});
  const [catEditing, setCatEditing] = useState<string>();
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catError, setCatError] = useState("");
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [trailer, setTrailer] = useState(false);
  const names = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const shown = useMemo(
    () => filterCourses(courses, query, filter),
    [courses, query, filter],
  );
  useEffect(() => {
    AsyncStorage.getItem("course-api-base-url")
      .then((saved) => {
        if (saved) {
          setBaseUrl(saved);
          setConfigDraft(saved);
        }
      })
      .catch(() =>
        setNotice(
          "Không đọc được cấu hình lưu trước đó; đang dùng API mặc định.",
        ),
      )
      .finally(() => setReady(true));
  }, []);
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [cs, cats] = await Promise.all([api.courses(), api.categories()]);
      setCourses(cs);
      setCategories(cats);
      if (filter && !cats.some((c) => c.id === filter)) setFilter("");
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!ready) return;
    let active = true;
    Promise.all([api.courses(), api.categories()])
      .then(([cs, cats]) => {
        if (!active) return;
        setCourses(cs);
        setCategories(cats);
        setFilter((previous) =>
          cats.some((c) => c.id === previous) ? previous : "",
        );
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, api]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (busy) return true;
      if (trailer) {
        setTrailer(false);
        return true;
      }
      if (screen !== "courses") {
        setScreen(screen === "form" && editingId ? "detail" : "courses");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen, busy, trailer, editingId, setScreen]);
  async function mutation(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function openDetail(id: string) {
    const token = ++detailRequest.current;
    setSelected(null);
    setScreen("detail");
    setDetailLoading(true);
    setDetailError("");
    try {
      const result = await api.course(id);
      if (token === detailRequest.current)
        setSelected({ ...result, categoryId: String(result.categoryId) });
    } catch (e) {
      if (token === detailRequest.current) setDetailError(message(e));
    } finally {
      if (token === detailRequest.current) setDetailLoading(false);
    }
  }
  function openForm(course?: Course) {
    setEditingId(course?.id);
    setDraft(
      course
        ? {
            ...course,
            price: String(course.price),
            duration: String(course.duration),
          }
        : emptyCourse(),
    );
    setFormErrors({});
    setScreen("form");
    setNotice("");
  }
  async function saveCourse() {
    const errors = validateCourse(draft, categories);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    await mutation(async () => {
      const freshCategories = await api.categories();
      setCategories(freshCategories);
      const freshErrors = validateCourse(draft, freshCategories);
      if (Object.keys(freshErrors).length) {
        setFormErrors(freshErrors);
        return;
      }
      const saved = await api.saveCourse(toCourseInput(draft), editingId);
      setSelected(saved);
      setScreen("detail");
      setNotice(editingId ? "Đã cập nhật khóa học." : "Đã thêm khóa học.");
      await reload();
    });
  }
  function resetCategory() {
    setCatEditing(undefined);
    setCatName("");
    setCatDescription("");
    setCatError("");
  }
  async function saveCategory() {
    if (!catName.trim() || !catDescription.trim()) {
      setCatError("Vui lòng nhập tên và mô tả danh mục.");
      return;
    }
    await mutation(async () => {
      await api.saveCategory(
        { name: catName.trim(), description: catDescription.trim() },
        catEditing,
      );
      resetCategory();
      setNotice("Đã lưu danh mục.");
      await reload();
    });
  }
  const heading = {
    courses: "Khám phá khóa học",
    detail: "Chi tiết khóa học",
    form: editingId ? "Chỉnh sửa khóa học" : "Thêm khóa học",
    categories: "Quản lý danh mục",
    settings: "Kết nối dữ liệu",
  }[screen];
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.shell}>
          <View style={s.top}>
            <View>
              <Text style={s.brand}>
                COURSESPACE <Text style={s.brandDot}>●</Text>
              </Text>
              <Text style={s.student}>Đào Xuân Thành · BIT240215</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cài đặt API"
              disabled={busy}
              onPress={() => {
                setConfigDraft(baseUrl);
                setScreen("settings");
              }}
            >
              <Text style={s.settings}>⚙ API</Text>
            </Pressable>
          </View>
          <View style={s.pageTitle}>
            {screen !== "courses" && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() =>
                  setScreen(
                    screen === "form" && editingId ? "detail" : "courses",
                  )
                }
              >
                <Text style={s.back}>‹ Quay lại</Text>
              </Pressable>
            )}
            <Text accessibilityRole="header" style={s.title}>
              {heading}
            </Text>
            <Text style={s.muted}>
              {screen === "courses"
                ? "Học điều mới. Mở rộng tương lai."
                : "Quản lý khóa học trực tuyến với MockAPI"}
            </Text>
          </View>
          {!!notice && (
            <View style={s.notice}>
              <Text accessibilityLiveRegion="polite" style={s.noticeText}>
                {notice}
              </Text>
            </View>
          )}
          {!!error && (
            <View style={s.errorBox}>
              <Text accessibilityLiveRegion="polite" style={s.errorText}>
                {error}
              </Text>
              <Button
                title="Thử tải lại"
                secondary
                disabled={busy}
                onPress={() => void reload()}
              />
            </View>
          )}
          {busy && (
            <View style={s.busy}>
              <ActivityIndicator color="#147d73" />
              <Text style={s.muted}>Đang lưu thay đổi…</Text>
            </View>
          )}
          {!ready ? (
            <ActivityIndicator />
          ) : screen === "courses" ? (
            <>
              <View style={[s.toolbar, { marginHorizontal: 22 }]}>
                <Button
                  title="+ Thêm khóa học"
                  onPress={() => openForm()}
                  disabled={busy || loading}
                />
                <Button
                  title="Danh mục"
                  secondary
                  onPress={() => {
                    resetCategory();
                    setScreen("categories");
                  }}
                  disabled={busy}
                />
              </View>
              <View style={s.filters}>
                <TextInput
                  accessibilityLabel="Tìm kiếm theo tên khóa học"
                  placeholder="Tìm tên khóa học…"
                  style={s.input}
                  value={query}
                  onChangeText={setQuery}
                />
                <CategorySelect
                  label="Lọc theo danh mục"
                  value={filter}
                  onChange={setFilter}
                  options={categories}
                  placeholder="Tất cả danh mục"
                />
              </View>
              <Text style={s.result}>
                {shown.length} khóa học · {categories.length} danh mục
              </Text>
              <FlatList
                ref={listRef}
                style={s.flex}
                data={shown}
                keyExtractor={(c) => c.id}
                refreshing={loading}
                onRefresh={reload}
                contentContainerStyle={s.list}
                ListEmptyComponent={
                  <View style={s.empty}>
                    <Text style={s.heading}>
                      {loading
                        ? "Đang tải khóa học…"
                        : error
                          ? "Chưa tải được dữ liệu"
                          : "Chưa có khóa học phù hợp"}
                    </Text>
                    <Text style={s.muted}>
                      {error
                        ? "Kiểm tra mạng hoặc cấu hình API."
                        : "Thử đổi từ khóa, danh mục hoặc thêm khóa học mới."}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Xem ${item.title}`}
                    onPress={() => void openDetail(item.id)}
                    style={s.card}
                  >
                    <Cover uri={item.thumbnail} />
                    <View style={s.cardBody}>
                      <Text style={s.badge}>
                        {names.get(item.categoryId) || "Danh mục không tồn tại"}
                      </Text>
                      <Text style={s.heading}>{item.title}</Text>
                      <Text style={s.muted}>Giảng viên: {item.instructor}</Text>
                      <View style={s.cardBottom}>
                        <Text style={s.price}>{formatMoney(item.price)}</Text>
                        <Text style={s.muted}>{item.duration} giờ ↗</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            </>
          ) : screen === "detail" ? (
            <ScrollView contentContainerStyle={s.content}>
              {detailLoading ? (
                <ActivityIndicator color="#147d73" />
              ) : detailError ? (
                <View style={s.empty}>
                  <Text style={s.errorText}>{detailError}</Text>
                  <Button
                    title="Về danh sách"
                    onPress={() => setScreen("courses")}
                  />
                </View>
              ) : (
                selected && (
                  <>
                    <Cover uri={selected.thumbnail} large />
                    <Text style={s.badge}>
                      {names.get(String(selected.categoryId)) ||
                        "Danh mục không tồn tại"}
                    </Text>
                    <Text style={s.detailTitle}>{selected.title}</Text>
                    <Text style={s.muted}>
                      Giảng viên: {selected.instructor}
                    </Text>
                    <View style={s.metrics}>
                      <View>
                        <Text style={s.label}>HỌC PHÍ</Text>
                        <Text style={s.price}>
                          {formatMoney(selected.price)}
                        </Text>
                      </View>
                      <View>
                        <Text style={s.label}>THỜI LƯỢNG</Text>
                        <Text style={s.heading}>{selected.duration} giờ</Text>
                      </View>
                    </View>
                    <Text style={s.heading}>Giới thiệu khóa học</Text>
                    <Text style={s.description}>{selected.description}</Text>
                    <Text style={s.muted}>
                      Ngày tạo:{" "}
                      {Number.isNaN(Date.parse(selected.createdAt))
                        ? selected.createdAt
                        : new Date(selected.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                    </Text>
                    <Text style={s.muted}>
                      Mã khóa học: {selected.id} · Mã danh mục:{" "}
                      {selected.categoryId}
                    </Text>
                    <Button
                      title="▶ Xem trailer"
                      onPress={() => setTrailer(true)}
                    />
                    <View style={s.toolbar}>
                      <Button
                        title="Sửa khóa học"
                        secondary
                        disabled={busy}
                        onPress={() => openForm(selected)}
                      />
                      <Button
                        title="Xóa khóa học"
                        danger
                        disabled={busy}
                        onPress={() =>
                          setConfirm({
                            title: "Xóa khóa học?",
                            description: `Bạn muốn xóa “${selected.title}”? Thao tác sẽ xóa dữ liệu trên MockAPI.`,
                            action: async () => {
                              await api.deleteCourse(selected.id);
                              setScreen("courses");
                              setSelected(null);
                              setNotice("Đã xóa khóa học.");
                              await reload();
                            },
                          })
                        }
                      />
                    </View>
                  </>
                )
              )}
            </ScrollView>
          ) : screen === "form" ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.content}
            >
              <Text style={s.muted}>
                Tất cả các trường bên dưới đều bắt buộc.
              </Text>
              {(["title", "instructor", "description"] as const).map((key) => (
                <Field
                  key={key}
                  label={
                    {
                      title: "Tên khóa học *",
                      instructor: "Giảng viên *",
                      description: "Mô tả khóa học *",
                    }[key]
                  }
                  value={draft[key]}
                  onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                  error={formErrors[key]}
                  multiline={key === "description"}
                />
              ))}
              <View style={s.field}>
                <Text style={s.label}>Danh mục *</Text>
                <CategorySelect
                  label="Danh mục khóa học"
                  value={draft.categoryId}
                  onChange={(v) => setDraft((d) => ({ ...d, categoryId: v }))}
                  options={categories}
                  placeholder="Chọn danh mục"
                />
                {!!formErrors.categoryId && (
                  <Text style={s.errorText}>{formErrors.categoryId}</Text>
                )}
                {!categories.length && (
                  <Text style={s.errorText}>
                    Cần tải hoặc tạo danh mục trước khi thêm khóa học.
                  </Text>
                )}
              </View>
              <Field
                label="Học phí (VNĐ) *"
                value={draft.price}
                numeric
                onChange={(v) => setDraft((d) => ({ ...d, price: v }))}
                error={formErrors.price}
              />
              <Field
                label="Thời lượng (giờ) *"
                value={draft.duration}
                numeric
                onChange={(v) => setDraft((d) => ({ ...d, duration: v }))}
                error={formErrors.duration}
              />
              <Field
                label="URL ảnh bìa *"
                value={draft.thumbnail}
                url
                onChange={(v) => setDraft((d) => ({ ...d, thumbnail: v }))}
                error={formErrors.thumbnail}
              />
              {isHttpUrl(draft.thumbnail.trim()) && (
                <>
                  <Text style={s.label}>Xem trước ảnh bìa</Text>
                  <Cover uri={draft.thumbnail.trim()} large />
                </>
              )}
              <Field
                label="URL trailer (MP4 trực tiếp) *"
                value={draft.trailerUrl}
                url
                onChange={(v) => setDraft((d) => ({ ...d, trailerUrl: v }))}
                error={formErrors.trailerUrl}
              />
              <Text style={s.muted}>
                Ngày tạo được ghi tự động và giữ nguyên khi sửa.
              </Text>
              <Button
                title={
                  busy
                    ? "Đang lưu…"
                    : editingId
                      ? "Lưu thay đổi"
                      : "Tạo khóa học"
                }
                disabled={busy || loading}
                onPress={() => void saveCourse()}
              />
              <Button
                title="Hủy"
                secondary
                disabled={busy}
                onPress={() => setScreen(editingId ? "detail" : "courses")}
              />
            </ScrollView>
          ) : screen === "categories" ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.content}
            >
              <View style={s.panel}>
                <Text style={s.heading}>
                  {catEditing ? "Sửa danh mục" : "Thêm danh mục mới"}
                </Text>
                <Field
                  label="Tên danh mục *"
                  value={catName}
                  onChange={setCatName}
                />
                <Field
                  label="Mô tả danh mục *"
                  value={catDescription}
                  onChange={setCatDescription}
                  multiline
                />
                {!!catError && <Text style={s.errorText}>{catError}</Text>}
                <Button
                  title={catEditing ? "Lưu danh mục" : "+ Thêm danh mục"}
                  disabled={busy}
                  onPress={() => void saveCategory()}
                />
                {catEditing && (
                  <Button
                    title="Hủy chỉnh sửa"
                    secondary
                    disabled={busy}
                    onPress={resetCategory}
                  />
                )}
              </View>
              <Text style={s.heading}>{categories.length} danh mục</Text>
              {loading && <ActivityIndicator />}
              {!loading && !categories.length && (
                <Text style={s.muted}>
                  Chưa có danh mục. Hãy tạo danh mục đầu tiên.
                </Text>
              )}
              {categories.map((c) => {
                const count = courses.filter(
                  (x) => x.categoryId === c.id,
                ).length;
                return (
                  <View key={c.id} style={s.panel}>
                    <Text style={s.heading}>{c.name}</Text>
                    <Text style={s.description}>{c.description}</Text>
                    <Text style={s.badge}>{count} khóa học</Text>
                    <View style={s.toolbar}>
                      <Button
                        title={`Sửa ${c.name}`}
                        secondary
                        disabled={busy}
                        onPress={() => {
                          setCatEditing(c.id);
                          setCatName(c.name);
                          setCatDescription(c.description);
                          setCatError("");
                        }}
                      />
                      <Button
                        title="Xóa danh mục"
                        danger
                        disabled={busy}
                        onPress={() => {
                          if (count) {
                            setError(
                              "Không thể xóa danh mục đang có khóa học.",
                            );
                            return;
                          }
                          setConfirm({
                            title: "Xóa danh mục?",
                            description: `Xóa “${c.name}”? Ứng dụng sẽ kiểm tra lại khóa học trên API trước khi xóa.`,
                            action: async () => {
                              await api.deleteCategory(c.id);
                              if (catEditing === c.id) resetCategory();
                              setNotice("Đã xóa danh mục.");
                              await reload();
                            },
                          });
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={s.content}>
              <View style={s.panel}>
                <Text style={s.heading}>MockAPI REST API</Text>
                <Text style={s.description}>
                  Nhập Base URL chứa hai resource categories và courses. Ứng
                  dụng đọc và ghi trực tiếp trên API này.
                </Text>
                <Field
                  label="Base URL MockAPI"
                  value={configDraft}
                  url
                  onChange={setConfigDraft}
                />
                <Button
                  title="Kiểm tra và lưu kết nối"
                  disabled={busy}
                  onPress={() =>
                    void mutation(async () => {
                      const url = configDraft.trim().replace(/\/+$/, "");
                      const client = createApi(url);
                      await Promise.all([
                        client.categories(),
                        client.courses(),
                      ]);
                      await AsyncStorage.setItem("course-api-base-url", url);
                      if (url !== baseUrl) {
                        setCourses([]);
                        setCategories([]);
                        setLoading(true);
                      }
                      setBaseUrl(url);
                      setScreen("courses");
                      setNotice("Kết nối MockAPI thành công.");
                      if (url === baseUrl) await reload();
                    })
                  }
                />
                <Text selectable style={s.muted}>
                  Đang dùng: {baseUrl}
                </Text>
              </View>
              <Text style={s.heading}>Bài tập Mobile · Quản lý khóa học</Text>
              <Text style={s.description}>
                Sinh viên: Đào Xuân Thành_BIT240215{"\n"}React Native / Expo ·
                REST API · CRUD{"\n"}Dữ liệu danh mục luôn được lấy từ API.
              </Text>
            </ScrollView>
          )}
          <View style={s.footer}>
            <Text style={s.footerText}>COURSE MANAGEMENT · BIT240215</Text>
            <Text style={s.footerText}>MockAPI REST</Text>
          </View>
        </View>
        <Modal
          visible={!!confirm}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!busy) setConfirm(null);
          }}
        >
          <View style={s.overlay}>
            <View style={s.dialog}>
              <Text style={s.heading}>{confirm?.title}</Text>
              <Text style={s.description}>{confirm?.description}</Text>
              <Button
                title="Xác nhận xóa"
                danger
                disabled={busy}
                onPress={() => {
                  const action = confirm?.action;
                  setConfirm(null);
                  if (action) void mutation(action);
                }}
              />
              <Button title="Hủy" secondary onPress={() => setConfirm(null)} />
            </View>
          </View>
        </Modal>
        <Modal
          visible={trailer && !!selected}
          animationType="slide"
          onRequestClose={() => setTrailer(false)}
        >
          <SafeAreaView style={s.safe}>
            {trailer && selected && (
              <Trailer
                uri={selected.trailerUrl}
                close={() => setTrailer(false)}
              />
            )}
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

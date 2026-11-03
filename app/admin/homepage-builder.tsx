"use client";
import {Localized} from './admin-locale';
import {useInstitution,institutionLabels,institutionText} from '../institution-context';
import {allowedSections} from '../institutions';
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  GripVertical,
  ImagePlus,
  LayoutGrid,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  defaultHomeLayout,
  parseHomeLayout,
  type HomeBlock,
} from "../school-design";
import { sectionLabels as baseSectionLabels } from "../content-model";

type FileItem = { id: string; name: string; mimeType: string };
type SchoolDesign = { id: string; homeLayout: HomeBlock[] };
const baseSupported = [
  "schedule",
  "events",
  "clubs",
  "achievements",
  "menu",
  "map",
  "news",
  "teachers",
  "about",
  "documents",
];
const icons: Record<string, typeof LayoutGrid> = {
  schedule: CalendarDays,
  clubs: UsersRound,
  achievements: Trophy,
};

export default function HomepageBuilder({
  school,
  files,
  onSave,
}: {
  school: SchoolDesign;
  files: FileItem[];
  onSave: (layout: HomeBlock[]) => Promise<void>;
}) {
  const type=useInstitution();const sectionLabels=institutionLabels(type);const supported=allowedSections(type).filter(s=>s!=='home'&&s!=='announcements');
  const [blocks, setBlocks] = useState<HomeBlock[]>(() =>
    parseHomeLayout(school.homeLayout).map(b=>({...b,title:institutionText(b.title,type)})),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const inspect = (id: string) => {
    setSelected(id);
    if (window.matchMedia('(pointer: coarse), (max-width: 1024px)').matches)
      requestAnimationFrame(() => gridRef.current?.closest('section')?.querySelector('.block-inspector')?.scrollIntoView({behavior: 'smooth', block: 'start'}));
  };
  const moveBlock = (id: string, direction: number) => setBlocks(list => {
    const next = [...list], from = next.findIndex(b => b.id === id), to = Math.max(0, Math.min(next.length - 1, from + direction));
    next.splice(to, 0, next.splice(from, 1)[0]);
    return next;
  });
  useEffect(() => {
    setBlocks(parseHomeLayout(school.homeLayout).map(b=>({...b,title:institutionText(b.title,type)})));
    setSelected(null);
  }, [school.id, school.homeLayout,type]);
  const current = blocks.find((b) => b.id === selected);
  const update = (id: string, patch: Partial<HomeBlock>) =>
    setBlocks((list) =>
      list.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  const add = () => {
    const section =
      supported.find((s) => !blocks.some((b) => b.section === s)) || "news";
    const id = `home-${section}-${Date.now()}`;
    setBlocks((list) => [
      ...list,
      {
        id,
        section,
        title: sectionLabels[section] || "Новый блок",
        mode: "button",
        span: 4,
        height: 1,
      },
    ]);
    inspect(id);
  };
  const drop = (target: string) => {
    if (!dragged || dragged === target) return;
    setBlocks((list) => {
      const from = list.findIndex((b) => b.id === dragged),
        to = list.findIndex((b) => b.id === target);
      const next = [...list],
        item = next.splice(from, 1)[0];
      next.splice(to, 0, item);
      return next;
    });
    setDragged(null);
  };
  const resize = (event: React.PointerEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    const grid = gridRef.current;
    if (!grid) return;
    const startX = event.clientX,
      start = blocks.find((b) => b.id === id)?.span || 4,
      width = grid.getBoundingClientRect().width;
    const move = (e: PointerEvent) =>
      update(id, {
        span: Math.max(
          3,
          Math.min(12, start + Math.round((e.clientX - startX) / (width / 12))),
        ),
      });
    const done = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", done);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", done);
  };
  const resizeHeight = (event: React.PointerEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY,
      start = blocks.find((b) => b.id === id)?.height || 1;
    const move = (e: PointerEvent) =>
      update(id, {
        height: Math.max(
          1,
          Math.min(3, start + Math.round((e.clientY - startY) / 80)),
        ),
      });
    const done = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", done);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", done);
  };
  const save = async () => {
    setSaving(true);
    try {
      await onSave(blocks);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Localized as="section" className="homepage-builder">
      <Localized as="div" className="builder-toolbar">
        <Localized as="div">
          <Localized as="strong">Мини-просмотр главной страницы</Localized>
          <Localized as="span">
            Перетаскивайте блоки, тяните правый край для ширины и нижний край
            для высоты.
          </Localized>
        </Localized>
        <Localized as="div">
          <Localized as="button"
            className="owner-secondary"
            onClick={() => setBlocks(defaultHomeLayout.map(b=>({...b,title:institutionText(b.title,type)})))}
          >
            <RotateCcw size={16} />
            По умолчанию
          </Localized>
          <Localized as="button" className="owner-secondary" onClick={add}>
            <Plus size={16} />
            Добавить блок
          </Localized>
          <Localized as="button" className="owner-primary" disabled={saving} onClick={save}>
            <Save size={16} />
            {saving ? "Сохранение…" : "Сохранить главную"}
          </Localized>
        </Localized>
      </Localized>
      <Localized as="div" className="homepage-builder-body">
        <Localized as="div" className="homepage-mini-shell">
          <Localized as="aside">
            <Localized as="span">STEPLine EDU</Localized>
            <Localized as="i" />
            <Localized as="i" />
            <Localized as="i" />
            <Localized as="i" />
            <Localized as="i" />
          </Localized>
          <Localized as="div" className="homepage-mini-content">
            <Localized as="header">
              <Localized as="b">{school.id}</Localized>
              <Localized as="span">Предпросмотр</Localized>
            </Localized>
            <Localized as="div" className="homepage-mini-grid" ref={gridRef}>
              {blocks.map((block) => {
                const Icon = icons[block.section] || LayoutGrid;
                const image = files.find((f) => f.id === block.imageId);
                return (
                  <Localized as="article"
                    draggable
                    className={`mini-home-block mode-${block.mode} ${selected === block.id ? "selected" : ""}`}
                    style={{
                      gridColumn: `span ${block.span}`,
                      gridRow: `span ${block.height || 1}`,
                      backgroundImage: image
                        ? `linear-gradient(90deg,rgba(18,47,38,.82),rgba(18,47,38,.35)),url(/api/files/${image.id})`
                        : undefined,
                    }}
                    key={block.id}
                    onClick={() => inspect(block.id)}
                    onDragStart={() => setDragged(block.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => drop(block.id)}
                  >
                    <Localized as="span" className="mini-drag">
                      <GripVertical size={15} />
                    </Localized>
                    <Icon size={block.mode === "button" ? 21 : 28} />
                    <Localized as="div">
                      <Localized as="strong">{block.title}</Localized>
                      <Localized as="small">{sectionLabels[block.section]}</Localized>
                      {block.mode !== "button" && (
                        <Localized as="p">
                          {block.mode === "feature"
                            ? "Фотография, заголовок и опубликованный материал"
                            : "До трёх последних записей раздела"}
                        </Localized>
                      )}
                    </Localized>
                    <Localized as="button"
                      aria-label="Удалить блок"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBlocks((list) =>
                          list.filter((x) => x.id !== block.id),
                        );
                      }}
                    >
                      <Trash2 size={14} />
                    </Localized>
                    <Localized as="span"
                      className="mini-resize"
                      title="Потяните для изменения ширины"
                      onPointerDown={(e) => resize(e, block.id)}
                    />
                    <Localized as="span"
                      className="mini-resize-height"
                      title="Потяните для изменения высоты"
                      onPointerDown={(e) => resizeHeight(e, block.id)}
                    />
                  </Localized>
                );
              })}
            </Localized>
          </Localized>
        </Localized>
        {current ? (
          <Localized as="aside" className="block-inspector">
            <Localized as="button" className="owner-secondary" onClick={() => gridRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'})}>Вернуться к блокам</Localized>
            <Localized as="div" className="mobile-block-order"><Localized as="button" onClick={() => moveBlock(current.id, -1)}>↑ Выше</Localized><Localized as="button" onClick={() => moveBlock(current.id, 1)}>↓ Ниже</Localized></Localized>
            <Localized as="div">
              <Localized as="strong">Настройка блока</Localized>
              <Localized as="span">
                {Math.round((current.span / 12) * 100)}% · высота{" "}
                {current.height || 1}
              </Localized>
            </Localized>
            <Localized as="label">
              Заголовок
              <Localized as="input"
                value={current.title}
                onChange={(e) => update(current.id, { title: e.target.value })}
              />
            </Localized>
            <Localized as="label">
              Раздел
              <Localized as="select"
                value={current.section}
                onChange={(e) =>
                  update(current.id, {
                    section: e.target.value,
                    title: sectionLabels[e.target.value] || current.title,
                  })
                }
              >
                {supported.map((s) => (
                  <Localized as="option" key={s} value={s}>
                    {sectionLabels[s]}
                  </Localized>
                ))}
              </Localized>
            </Localized>
            <Localized as="label">
              Вид блока
              <Localized as="select"
                value={current.mode}
                onChange={(e) =>
                  update(current.id, {
                    mode: e.target.value as HomeBlock["mode"],
                  })
                }
              >
                <Localized as="option" value="button">Компактная кнопка</Localized>
                <Localized as="option" value="feature">Большой блок с фотографией</Localized>
                <Localized as="option" value="list">Лента последних материалов</Localized>
              </Localized>
            </Localized>
            <Localized as="label">
              Изображение
              <Localized as="select"
                value={current.imageId || ""}
                onChange={(e) =>
                  update(current.id, { imageId: e.target.value || undefined })
                }
              >
                <Localized as="option" value="">Автоматически из раздела</Localized>
                {files
                  .filter((f) => f.mimeType.startsWith("image/"))
                  .map((f) => (
                    <Localized as="option" key={f.id} value={f.id}>
                      {f.name}
                    </Localized>
                  ))}
              </Localized>
            </Localized>
            <Localized as="div" className="width-presets">
              <Localized as="span">Ширина</Localized>
              {[
                [3, "25%"],
                [4, "33%"],
                [6, "50%"],
                [8, "67%"],
                [12, "100%"],
              ].map(([span, label]) => (
                <Localized as="button"
                  className={current.span === span ? "active" : ""}
                  key={span}
                  onClick={() => update(current.id, { span: Number(span) })}
                >
                  {label}
                </Localized>
              ))}
            </Localized>
            <Localized as="div" className="width-presets">
              <Localized as="span">Высота</Localized>
              {[
                [1, "Обычная"],
                [2, "Высокая"],
                [3, "Максимальная"],
              ].map(([height, label]) => (
                <Localized as="button"
                  className={(current.height || 1) === height ? "active" : ""}
                  key={height}
                  onClick={() => update(current.id, { height: Number(height) })}
                >
                  {label}
                </Localized>
              ))}
            </Localized>
            <Localized as="p">
              <ImagePlus size={16} />
              Картинку можно выбрать здесь или загрузить в разделе «Файлы».
            </Localized>
          </Localized>
        ) : (
          <Localized as="aside" className="block-inspector empty">
            <LayoutGrid size={30} />
            <Localized as="strong">Выберите блок</Localized>
            <Localized as="span">
              После выбора появятся его вид, ширина, высота, раздел и
              изображение.
            </Localized>
          </Localized>
        )}
      </Localized>
    </Localized>
  );
}
